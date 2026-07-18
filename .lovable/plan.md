## 1. Avatar bots — fix crash + wire knowledge base

**File:** `supabase/functions/create-did-agent/index.ts`

- Remove `window.location.origin` (crashes Deno). Replace `allowed_domains` with a static list, no `'*'`:
  ```
  ['https://no-code-chat-co.lovable.app', 'https://id-preview--63fdb9bb-fa8e-432e-84fe-145d05de64bf.lovable.app', 'http://localhost:8080', ...customer domains from bot's widget_config.allowed_domains]
  ```
- Fetch `avatar_knowledge_sources` rows for this `chatbotId` (service-role read), concatenate their `content` with the manual `knowledgeBase` field, and pass the combined text into D-ID's `agent.knowledge` payload so the avatar can actually cite uploaded content.
- Leave the existing "always create a new agent" behavior alone (out of scope, and current DB has no ambient agents to clean up given every prior save crashed before persisting).

**File:** `supabase/functions/process-knowledge-source/index.ts`

- Stop writing the placeholder `"Manual text extraction required"`. Return HTTP 400 for `pdf` / `docx` uploads with a clear message ("PDF/DOCX parsing not yet supported — please paste text or upload .txt/.md").
- Keep `txt`, `md`, and `url` paths working.

**File:** `src/components/avatar/KnowledgeBaseManager.tsx`

- Restrict the file input `accept` to `.txt,.md` and remove PDF/DOCX from the UI copy so users aren't misled.

**Verify:** Create an avatar bot → `avatar_chatbots.did_agent_id` and `did_client_key` both populated; widget starts a session; add a `.txt` knowledge source with a distinctive fact, re-save the bot, ask the avatar → it answers using that fact.

## 2. Video-flow branching — connect edges to responses

**File:** `src/components/chatbot/VideoFlowBuilder.tsx`

- Give each response its own source `Handle` (id = response.id) inside the node card, replacing the single right-edge source handle on `VideoQuestionNode` and `MultipleChoiceNode`. Keep a single default source handle on `TextResponseNode` and `LeadCaptureNode`.
- On save (in `VideoFlowEditor.handleSave`), for each node compute each `response.next_node_id` from edges where `edge.source === node.id && edge.sourceHandle === response.id`. Persist that into `data.responses` (which is what gets written to `chatbot_messages.buttons`). Keep also writing `node_connections` for backward compat.
- Add a target-node dropdown in the right-panel response editor (list all other nodes) as a manual fallback / confirmation, syncing both the response's `next_node_id` and the edge.
- Fix `handleSave` in `VideoFlowEditor.tsx` to preserve node type: map `lead_capture` → `'form'`, `end` → `'text'`, and keep the video-question/multiple-choice branches. Persist node type in `chatbot_messages.conditions.node_type` so we can round-trip it and the runtime knows it's a lead node.

**File:** `src/hooks/useVideoFlowState.ts`

- When building `nodeMap`, read `type` from `conditions.node_type` first, falling back to `message_type` mapping. Lead nodes get `type: 'lead_capture'` and their `lead_fields` from `conditions.lead_fields`.

**Verify:** Build a 3-node flow (question → 2 branches → different end nodes). Save. Play through: each button lands on its own target.

## 3. Video-flow lead capture — reach the form

**File:** `src/components/chatbot/VideoFlowWidget.tsx`

- After `moveToNextNode`, inspect the new `currentNode.type`. If it's `lead_capture`, transition `widgetState` to `COLLECTING_LEAD` and render the form using that node's `lead_fields` (dynamic fields, not the hardcoded name/email/phone).
- On lead submit, call `captureLeadData`, then advance to next node via the node's default outgoing edge (or COMPLETED if none).
- Same logic on initial load if the start node happens to be `lead_capture`.

**Verify:** A flow that ends on a lead-capture node presents the form; submitting inserts a row into `leads`.

## 4. Lead notifications — DB trigger + fix payload contract

### Migration

- Enable `pg_net` (if not already) and create an `AFTER INSERT` trigger on `public.leads` that fires `net.http_post` to both `send-lead-notification` (with `{ leadId }`) and `slack-notifications` (with `{ workspace_id, lead }`), using the Supabase project's function URL + service-role auth header. Use a `SECURITY DEFINER` function to keep secrets out of the trigger body — read the URL/key from a config table or hardcode the project URL + service-role token from `vault`.
- Since the service-role token can't be hardcoded in a migration safely, store project URL + service-role JWT in `vault.secrets` first (or use `current_setting('app.settings.<name>')` if easier). Simplest working approach: create a `public.notify_lead()` SECURITY DEFINER function that reads both values from `vault.decrypted_secrets` by name (`project_url`, `service_role_jwt`).
- I'll add a one-time SQL to seed those two Vault entries from the values available in the migration context (project ref is known). If seeding the service-role JWT can't be done in migration SQL, I'll add a small admin RPC and call it once from an already-authenticated admin path.

### Edge function `send-lead-notification`

- Accept **both** shapes:
  - `{ leadId: string }` → look up lead as today, resolve workspace's `integrations` row where `integration_type = 'email'`, send.
  - `{ test: true, lead: {...}, recipients, subject, template }` → skip the DB lookup, send directly to the provided recipients.
- Move to `verify_jwt = false` only if we want the trigger to call it without a JWT; otherwise the trigger will attach the service-role JWT and we leave `verify_jwt` as-is.

### UI fix

**File:** `src/pages/LeadIntegrations.tsx`

- Replace every `'email_notifications'` string with `'email'` (matches the actual enum). Enum has no `'email_notifications'` value, so current saves silently fail.
- Remove/ignore `'google_sheets'` branch (also not in the enum) — out of scope for this pass; leave a TODO.

**Verify:** Submit a real lead through a standard bot AND a video bot → row lands in `leads`, trigger fires, configured Resend email is sent, configured Slack webhook receives message. Test button in Integrations page also succeeds against the same function.

## 5. Regression guards

- Do NOT touch `generate-chat-response` or the button-flow path in `Widget.tsx` free-text branch.
- Do NOT modify RLS on `avatar_chatbots` or the `get_avatar_widget_config` RPC.
- Migration only adds: `pg_net` extension (if needed), `public.notify_lead()` function, `leads_notify_after_insert` trigger, and two Vault secrets.

## Order of execution

1. Migration (trigger + Vault seeds) — must run first, user approval gate.
2. Edge function fixes: `create-did-agent`, `process-knowledge-source`, `send-lead-notification` — deployed automatically on save.
3. Frontend: `VideoFlowBuilder`, `VideoFlowEditor`, `useVideoFlowState`, `VideoFlowWidget`, `KnowledgeBaseManager`, `LeadIntegrations`, `AvatarChatbotEditor` (already loads knowledge sources via manager, no change needed).
4. Manual smoke test each of the 5 items.

## Known caveats

- **Vault seeding**: the migration can create Vault entries but can't know the project's service-role JWT from inside SQL. I'll either (a) have the migration create empty placeholders and a one-off admin-only RPC to set them, which you call once, or (b) skip pg_net and instead make the trigger write to a `pending_lead_notifications` queue table that a small edge function polls / a Supabase Realtime subscription reacts to. I'll go with (a) — it's the cleaner trigger approach the spec asks for. You'll get a one-time toast on the Integrations page telling you to click a "Enable notifications" button that seeds the secrets.
- **Old avatar bots** created before the crash fix are unusable (no `did_client_key`). I'll surface a one-line notice in `AvatarChatbots.tsx` telling you to re-save any bot missing `did_agent_id`. No auto-migration.
- **PDF/DOCX** knowledge uploads: rejected, not parsed. Real parsing needs an external service and is out of this scope.
