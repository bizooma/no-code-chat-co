import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Adjust these before shipping to prod.
const PLAN_QUOTAS: Record<string, number> = {
  free: 100,
  professional: 3000,
  pro: 3000,
  enterprise: 20000,
};

const ALLOWED_MODELS = new Set(["gpt-4o-mini", "gpt-4o"]);
const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_INPUT_CHARS = 4000;
const MAX_HISTORY = 12;

interface HistoryItem {
  sender: "bot" | "user";
  text: string;
}

const log = (step: string, details?: unknown) =>
  console.log(`[generate-chat-response] ${step}${details ? " " + JSON.stringify(details) : ""}`);

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
    const userMessage: string | undefined = body.message;
    const history: HistoryItem[] = Array.isArray(body.history) ? body.history : [];

    if (!chatbotId || typeof chatbotId !== "string") {
      return json({ error: "chatbotId required" }, 400);
    }
    if (!userMessage || typeof userMessage !== "string" || !userMessage.trim()) {
      return json({ error: "message required" }, 400);
    }
    if (userMessage.length > MAX_INPUT_CHARS) {
      return json({ error: "message too long" }, 400);
    }

    // Load chatbot
    const { data: bot, error: botErr } = await supabase
      .from("chatbots")
      .select("id, workspace_id, name, ai_enabled, ai_model, ai_prompt, fallback_message, status")
      .eq("id", chatbotId)
      .maybeSingle();

    if (botErr) throw botErr;
    if (!bot) return json({ error: "chatbot not found" }, 404);
    if (bot.status !== "active") return json({ error: "chatbot inactive" }, 400);
    if (!bot.ai_enabled) return json({ error: "ai not enabled for this chatbot" }, 400);

    const model = ALLOWED_MODELS.has(bot.ai_model ?? "") ? bot.ai_model! : DEFAULT_MODEL;
    const systemPrompt =
      bot.ai_prompt?.trim() ||
      `You are a helpful support assistant for ${bot.name}. Answer clearly and concisely.`;

    // Resolve key: BYO first
    let apiKey: string | null = null;
    let usingBYO = false;
    const { data: byoRow } = await supabase
      .from("workspace_ai_keys")
      .select("openai_key")
      .eq("workspace_id", bot.workspace_id)
      .maybeSingle();
    if (byoRow?.openai_key) {
      apiKey = byoRow.openai_key;
      usingBYO = true;
    }

    // Platform key + quota enforcement
    if (!apiKey) {
      apiKey = Deno.env.get("OPENAI_API_KEY") ?? null;
      if (!apiKey) return json({ error: "AI is not configured" }, 500);

      const tier = await resolveWorkspaceTier(supabase, bot.workspace_id);
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

    // Meter only when using the platform key
    if (!usingBYO) {
      const { error: incErr } = await supabase.rpc("increment_ai_usage", {
        _workspace_id: bot.workspace_id,
      });
      if (incErr) log("increment_ai_usage error", incErr);
    }

    return json({ reply, model, usingBYO }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { msg });
    return json({ error: msg }, 500);
  }
});

async function resolveWorkspaceTier(
  supabase: ReturnType<typeof createClient>,
  workspaceId: string,
): Promise<string> {
  try {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("owner_id")
      .eq("id", workspaceId)
      .maybeSingle();
    if (!ws?.owner_id) return "free";

    const { data: userRes } = await supabase.auth.admin.getUserById(ws.owner_id);
    const email = userRes?.user?.email;
    if (!email) return "free";

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return "free";
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) return "free";

    const subs = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "active",
      limit: 1,
    });
    if (subs.data.length === 0) return "free";

    const productId = subs.data[0].items.data[0].price.product as string;
    const mapping: Record<string, string> = {
      prod_T7Ih26ZMAehp3r: "professional",
      prod_T7IkTHwZAItNtS: "enterprise",
    };
    return mapping[productId] ?? "free";
  } catch (e) {
    log("resolveWorkspaceTier failed", { e: String(e) });
    return "free";
  }
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
