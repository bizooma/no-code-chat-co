
# Final Cleanup Pass

Grouped exactly as requested. I'll do A → E in order so security-sensitive DB changes land last, after visible bug fixes are validated.

---

## A. Remove fabricated/mock data

- **ABTestDashboard.tsx** — remove the feature for now. Delete the component, drop the "A/B Testing" tab from `Analytics.tsx` and the placement in `ChatbotEditor.tsx`. Real A/B needs variant assignment + event collection we don't have.
- **RealtimeDashboard.tsx** — remove the "Response Rate" tile entirely (grid becomes 3 cols). Compute nothing fake.
- **TemplateMetrics.tsx / VideoFlowAnalytics.tsx** — strip hardcoded "+12%" style deltas and the "Live Data" badge. Show current value only.
- **Analytics.tsx** — drop the hardcoded `avgResponseTime = 2.5` tile and the invented 75/60% funnel multipliers. Funnel becomes: sessions → conversations (real) → leads (real).
- **PDFReport** — rename component + button to `HTMLReport` / "Export HTML" (it emits HTML). Not implementing a real PDF this pass.
- **TemplateLibrary.tsx** — orphaned per section E; will be deleted, so hardcoded rating/downloads go with it.

## B. Marketing / pricing reconciliation

- **Landing.tsx** pricing: rewrite to match `Pricing.tsx` exactly — Free $0, Professional $29, Enterprise $99 (features from the Stripe-backed page).
- Replace every "unlimited conversations" with "unlimited fair-use messages" (or plan-scoped copy).
- Remove unsupported claims: HeyGen, native mobile app, live human takeover, auto multi-language, HubSpot/Google Sheets auto-sync. Keep D-ID avatar, video branching, standard chatbots, Slack + email lead notifications, embed script.
- Testimonials block: **remove** (no real attributable ones). Also remove "Join thousands of businesses…" hero social proof.
- Brand: standardize on **SupportBots** everywhere (drop the `.dev` suffix in UI copy; keep the domain only where it's actually a URL).

## C. Broken bug fixes

- Fix nav routes:
  - `Dashboard.tsx`: `/lead-integrations` → `/leads/integrations`
  - `ClientPortal.tsx`: `/create-chatbot` → `/chatbots/create`
  - `Pricing.tsx` FAQ `/contact` → create a minimal `Contact.tsx` route with a mailto + form that inserts into `leads` (source=`contact_form`) so notifications reuse the same pipeline.
- `FlowBuilder.tsx`: wire the pencil button to a proper edit dialog reusing the add-message form; call `updateMessage`.
- `CreateChatbot.tsx`: on insert, if a template is selected, copy the template's `bot_config` (or equivalent) into the new chatbot and store `template_id`.
- `ChatbotEditor.tsx`: remove the orphan "analytics" tab trigger and the stray inner `<Tabs>`. Pass the real `workspaceId` from `WorkspaceContext` wherever needed. (ABTestDashboard usage removed per section A.)
- `UserManagement.tsx`: new **edge function `admin-list-users`** (verify_jwt=true, checks caller `platform_owner` via `has_role`) that uses service role + `auth.admin.listUsers()` to return `{id,email,created_at}`. Frontend calls it and joins to profiles/roles.
- `public/widget.js`: derive `baseUrl` from `currentScript.src` origin (no hardcoded `supportbots.dev`); keep Supabase URL/anon key inline (public anon key is fine, but read chatbot type through an origin-agnostic call).

## D. Security hardening

**DB migration** (single migration, all GRANTs kept intact):

1. **`leads` insert policy** — drop `WITH CHECK (true)`. Replace with a policy that:
   - Requires `chatbot_id` to reference an existing `chatbots` row where `is_active = true`.
   - Enforces `workspace_id = (SELECT workspace_id FROM chatbots WHERE id = chatbot_id)`.
   - Anonymous inserts still allowed but only when both conditions match; server code must send both fields (already does).
2. **`conversations` / `conversation_messages`** — same "derive from chatbot" pattern. `workspace_id` in conversations must match its chatbot's workspace; `conversation_id` on messages must reference an existing conversation.
3. Add a **BEFORE INSERT trigger** on `leads` and `conversations` that auto-fills `workspace_id` from `chatbot_id` if the client omits/mismatches it (defense in depth).

**Edge functions**:

- `save-avatar-conversation`: require the `visitor_id` on the existing row to match on update; verify `chatbot_id` is active on insert. Reject cross-visitor updates.
- `slack-notifications`: derive `workspace_id` from the lead (require `leadId` instead of trusting a client-supplied `workspace_id`). Update the DB trigger call accordingly.
- `process-knowledge-source`: 
  - Verify the authenticated caller owns `chatbot_id` (has `verify_jwt=true` in config).
  - SSRF guard: allow only `http:`/`https:`, resolve the hostname, block loopback (`127.0.0.0/8`), link-local (`169.254.0.0/16`), private ranges (`10/8`, `172.16/12`, `192.168/16`), `::1`, `fc00::/7`, `fe80::/10`, and metadata IPs (`169.254.169.254`).
- `facebook-messenger-webhook`: constant-time compare of `hub.verify_token` against a `FACEBOOK_VERIFY_TOKEN` secret (I'll `generate_secret` a random one, user copies to Meta dashboard on setup). Validate `X-Hub-Signature-256` HMAC-SHA256 against `FACEBOOK_APP_SECRET` (user-supplied — add via `add_secret`).
- `whatsapp-business-webhook`: same pattern with `WHATSAPP_VERIFY_TOKEN` (generated) and `WHATSAPP_APP_SECRET` (user-supplied).

I'll only **generate** the two verify tokens automatically. The two app secrets require the user's Meta app — I'll prompt via `add_secret` after landing the code and infrastructure, per secrets policy.

## E. Dead code removal

Delete:
- `src/pages/Index.tsx` (unused Lovable stub — verify no route/import references remain).
- `src/pages/TemplateLibrary.tsx` (orphaned; fake data).
- `src/components/video/VideoLayoutPreview.tsx` (unused).

Update `App.tsx` routes/imports if any reference these.

---

## Technical notes

- Migration ordering: policy replacements use `DROP POLICY IF EXISTS` then `CREATE POLICY`. GRANTs on `leads`/`conversations`/`conversation_messages` already exist; not re-issuing.
- Anonymous lead capture stays functional because the new check is a JOIN to `chatbots`, not an auth requirement.
- No changes to the AI engine, avatar create/run, video flow branching, or lead-notification trigger — all verified working paths untouched.

## Judgment calls I'll take unless you say otherwise

1. **Delete** the A/B testing UI rather than stub it (section A).
2. **Delete** testimonials + hero social proof rather than replace (section B).
3. Create a minimal `/contact` page that writes to `leads` so the FAQ link resolves (section C).
4. Standardize brand as plain **SupportBots** in UI copy (section B).

Reply "go" (or with tweaks) and I'll execute A→E in one pass, then summarize every edge function, policy, and trigger changed.
