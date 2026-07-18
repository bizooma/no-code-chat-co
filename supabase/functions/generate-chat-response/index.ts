import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_QUOTAS: Record<string, number> = {
  free: 100,
  professional: 3000,
  pro: 3000,
  enterprise: 20000,
};

const ALLOWED_MODELS = new Set(["gpt-4o-mini", "gpt-4o"]);
const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_INPUT_CHARS = 2000;
const MAX_HISTORY = 12;
const IP_LIMIT_PER_MINUTE = 20;
const CONVERSATION_MSG_CAP = 50;

interface HistoryItem {
  sender: "bot" | "user";
  text: string;
}

const log = (step: string, details?: unknown) =>
  console.log(`[generate-chat-response] ${step}${details ? " " + JSON.stringify(details) : ""}`);

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

function normalizeOrigin(v: string | null): string | null {
  if (!v) return null;
  try {
    return new URL(v).host.toLowerCase();
  } catch {
    return v.toLowerCase();
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const body = await req.json().catch(() => ({}));
    const chatbotId: string | undefined = body.chatbotId;
    const conversationId: string | undefined = body.conversationId;
    const userMessage: string | undefined = body.message;
    const history: HistoryItem[] = Array.isArray(body.history) ? body.history : [];

    if (!chatbotId || typeof chatbotId !== "string") {
      return json({ error: "chatbotId required" }, 400);
    }
    if (!userMessage || typeof userMessage !== "string" || !userMessage.trim()) {
      return json({ error: "message required" }, 400);
    }
    if (userMessage.length > MAX_INPUT_CHARS) {
      return json({ error: `Message too long (max ${MAX_INPUT_CHARS} characters).` }, 400);
    }

    const ip = getClientIp(req);

    // Per-IP sliding window rate limit (fail-open on limiter error).
    try {
      const since = new Date(Date.now() - 60_000).toISOString();
      const { count } = await supabase
        .from("rate_limit_events")
        .select("id", { count: "exact", head: true })
        .eq("ip", ip)
        .gte("created_at", since);
      if ((count ?? 0) >= IP_LIMIT_PER_MINUTE) {
        return json(
          { error: "Too many requests. Please slow down and try again in a minute.", rateLimited: true },
          429,
        );
      }
    } catch (e) {
      log("ip rate check failed (allowing)", { e: String(e) });
    }

    // Per-conversation cap (fail-open).
    if (conversationId) {
      try {
        const { count } = await supabase
          .from("rate_limit_events")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conversationId);
        if ((count ?? 0) >= CONVERSATION_MSG_CAP) {
          return json({ error: "This conversation has reached its message limit.", conversationLimitReached: true }, 200);
        }
      } catch (e) {
        log("conv cap check failed (allowing)", { e: String(e) });
      }
    }

    // Load chatbot
    const { data: bot, error: botErr } = await supabase
      .from("chatbots")
      .select("id, workspace_id, name, ai_enabled, ai_model, ai_prompt, fallback_message, status, widget_config")
      .eq("id", chatbotId)
      .maybeSingle();

    if (botErr) throw botErr;
    if (!bot) return json({ error: "chatbot not found" }, 404);
    if (bot.status !== "active") return json({ error: "chatbot inactive" }, 400);
    if (!bot.ai_enabled) return json({ error: "ai not enabled for this chatbot" }, 400);

    // Origin allowlist (soft): only enforce when configured.
    const allowed: string[] = Array.isArray((bot.widget_config as any)?.allowed_domains)
      ? ((bot.widget_config as any).allowed_domains as string[]).map((d) => d.toLowerCase().trim()).filter(Boolean)
      : [];
    if (allowed.length > 0) {
      const originHost = normalizeOrigin(req.headers.get("origin")) || normalizeOrigin(req.headers.get("referer"));
      const ok = originHost && allowed.some((d) => originHost === d || originHost.endsWith("." + d));
      if (!ok) {
        log("origin blocked", { originHost, allowed });
        return json({ error: "This chatbot is not permitted on this domain." }, 403);
      }
    }

    const model = ALLOWED_MODELS.has(bot.ai_model ?? "") ? bot.ai_model! : DEFAULT_MODEL;
    const systemPrompt =
      bot.ai_prompt?.trim() ||
      `You are a helpful support assistant for ${bot.name}. Answer clearly and concisely.`;

    // Resolve key: BYO first (decrypted via Vault through service-role RPC), else platform.
    let apiKey: string | null = null;
    let usingBYO = false;
    const { data: byoKey, error: byoErr } = await supabase.rpc("get_workspace_ai_key", {
      _workspace_id: bot.workspace_id,
    });
    if (byoErr) log("get_workspace_ai_key error", byoErr);
    if (typeof byoKey === "string" && byoKey.length > 0) {
      apiKey = byoKey;
      usingBYO = true;
    }

    // Platform key + quota enforcement (tier from workspace_plan cache)
    if (!apiKey) {
      apiKey = Deno.env.get("OPENAI_API_KEY") ?? null;
      if (!apiKey) return json({ error: "AI is not configured" }, 500);

      const { data: planRow } = await supabase
        .from("workspace_plan")
        .select("tier")
        .eq("workspace_id", bot.workspace_id)
        .maybeSingle();
      const tier = planRow?.tier ?? "free"; // fail closed
      const quota = PLAN_QUOTAS[tier] ?? PLAN_QUOTAS.free;

      const period = new Date();
      const periodMonth = new Date(Date.UTC(period.getUTCFullYear(), period.getUTCMonth(), 1))
        .toISOString()
        .slice(0, 10);
      const { data: usageRow } = await supabase
        .from("ai_usage")
        .select("message_count")
        .eq("workspace_id", bot.workspace_id)
        .eq("period_month", periodMonth)
        .maybeSingle();

      const used = usageRow?.message_count ?? 0;
      log("quota check", { tier, quota, used });
      if (used >= quota) {
        return json({ limitReached: true, tier, quota, used }, 200);
      }
    }

    // Log the request for rate limiting AFTER limits pass, BEFORE OpenAI call
    await supabase.from("rate_limit_events").insert({
      ip,
      chatbot_id: chatbotId,
      conversation_id: conversationId ?? null,
    });

    // Build messages
    const trimmedHistory = history.slice(-MAX_HISTORY).map((h) => ({
      role: h.sender === "user" ? "user" : "assistant",
      content: String(h.text ?? "").slice(0, MAX_INPUT_CHARS),
    }));

    const openaiBody = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...trimmedHistory,
        { role: "user", content: userMessage },
      ],
      max_tokens: 500,
      temperature: 0.7,
    };

    const oaRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(openaiBody),
    });

    if (!oaRes.ok) {
      const errText = await oaRes.text();
      log("openai error", { status: oaRes.status, body: errText.slice(0, 500) });
      return json({ error: "AI request failed", details: oaRes.status }, 502);
    }
    const oa = await oaRes.json();
    const reply: string =
      oa?.choices?.[0]?.message?.content?.trim() ||
      bot.fallback_message ||
      "Sorry, I couldn't generate a response.";

    if (!usingBYO) {
      const { error: incErr } = await supabase.rpc("increment_ai_usage", {
        _workspace_id: bot.workspace_id,
      });
      if (incErr) log("increment_ai_usage error", incErr);
    }

    // Best-effort cleanup of old rate-limit rows (>10 min)
    try {
      const cutoff = new Date(Date.now() - 10 * 60_000).toISOString();
      await supabase.from("rate_limit_events").delete().lt("created_at", cutoff);
    } catch {
      /* ignore */
    }

    return json({ reply, model, usingBYO }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { msg });
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
