## Goal

Make the public/anonymous avatar widget path work again after the `avatar_chatbots` public SELECT policy was removed, by reading config through the new `get_avatar_widget_config(_chatbot_id uuid)` SECURITY DEFINER RPC. Leave all authenticated dashboard/editor reads alone.

## Scope

Only one file needs to change: `src/components/avatar/AvatarChatbot.tsx`. This is the component rendered by `src/pages/Widget.tsx` for anonymous embedded viewers (and reused by `FloatingAvatarWidget`), and it currently does two direct `supabase.from('avatar_chatbots').select(...)` reads that anon can no longer perform.

All other references to `avatar_chatbots` (`useDashboardStats.ts`, `pages/AvatarChatbots.tsx`, `pages/AvatarChatbotEditor.tsx`) run only for logged-in owners and stay as-is — the owner-scoped RLS policy still covers them.

## Changes in `src/components/avatar/AvatarChatbot.tsx`

1. Replace the fetch at line ~42 (inside the `fetchChatbot` effect) with:

   ```ts
   const { data, error } = await supabase
     .rpc('get_avatar_widget_config', { _chatbot_id: chatbotId })
     .single();
   ```

   Keep the existing error handling and `setChatbot(data)`. The RPC returns exactly the fields the widget uses downstream: `id`, `name`, `voice_id`, `presenter_id`, `did_agent_id`, `did_client_key`, `is_active`. `system_prompt`, `knowledge_base`, `user_id`, `workspace_id` are intentionally not returned — the widget code doesn't read them.

2. Replace the second fetch inside `startSession` (line ~77, which re-reads `did_agent_id, did_client_key`) with the same RPC call, or simplify by reusing the already-loaded `chatbot` state (preferred — avoids a second round trip). Keep the "Configuration Required" guard when `did_agent_id` or `did_client_key` is missing.

## What we do NOT touch

- No SQL migrations. The database changes described are already live; do not attempt to recreate the dropped public policy or re-grant `assign_platform_owner_role` / `create_platform_owner`.
- No changes to `AvatarChatbots.tsx`, `AvatarChatbotEditor.tsx`, `useDashboardStats.ts` — those are authenticated owner paths.
- No changes to `types.ts` (auto-generated).

## Verification

- Load the embed route (`/widget?chatbotId=<id>&type=avatar&embedded=true`) in a logged-out browser and confirm the avatar widget loads its config, connects to D-ID, and starts a session.
- In a logged-out session, confirm `supabase.from('avatar_chatbots').select('*')` returns zero rows (sanity check that the policy removal is effective).
- Confirm the logged-in editor at `/avatar-chatbots/:id` still loads and saves normally.
