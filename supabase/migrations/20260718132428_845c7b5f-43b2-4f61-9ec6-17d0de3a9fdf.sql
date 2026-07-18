
-- 1) workspace_plan cache
CREATE TABLE IF NOT EXISTS public.workspace_plan (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'free',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.workspace_plan TO authenticated;
GRANT ALL ON public.workspace_plan TO service_role;
ALTER TABLE public.workspace_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view their workspace plan"
  ON public.workspace_plan FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- 2) rate_limit_events (service-role only)
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id bigserial PRIMARY KEY,
  ip text NOT NULL,
  chatbot_id uuid,
  conversation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limit_events_ip_time ON public.rate_limit_events (ip, created_at DESC);
CREATE INDEX IF NOT EXISTS rate_limit_events_conv_time ON public.rate_limit_events (conversation_id, created_at DESC);
GRANT ALL ON public.rate_limit_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.rate_limit_events_id_seq TO service_role;
ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;
-- No policies: locked to service_role.

-- 3) BYO keys via Vault
ALTER TABLE public.workspace_ai_keys
  ADD COLUMN IF NOT EXISTS openai_key_secret_id uuid;

-- Migrate any existing plaintext keys into Vault
DO $$
DECLARE
  r record;
  sid uuid;
BEGIN
  FOR r IN
    SELECT workspace_id, openai_key
    FROM public.workspace_ai_keys
    WHERE openai_key IS NOT NULL AND openai_key <> ''
      AND openai_key_secret_id IS NULL
  LOOP
    sid := vault.create_secret(r.openai_key, 'workspace_ai_key_' || r.workspace_id::text, 'BYO OpenAI key for workspace ' || r.workspace_id::text);
    UPDATE public.workspace_ai_keys
      SET openai_key_secret_id = sid, openai_key = NULL
      WHERE workspace_id = r.workspace_id;
  END LOOP;
END $$;

-- Save BYO key (admin-only). Encrypts via Vault; never returns plaintext.
CREATE OR REPLACE FUNCTION public.set_workspace_ai_key(_workspace_id uuid, _key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_secret uuid;
  new_secret uuid;
BEGIN
  IF NOT public.is_workspace_admin(auth.uid(), _workspace_id) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _key IS NULL OR length(_key) < 10 THEN
    RAISE EXCEPTION 'invalid key';
  END IF;

  SELECT openai_key_secret_id INTO existing_secret
    FROM public.workspace_ai_keys WHERE workspace_id = _workspace_id;

  IF existing_secret IS NOT NULL THEN
    PERFORM vault.update_secret(existing_secret, _key);
    UPDATE public.workspace_ai_keys
      SET openai_key = NULL, updated_at = now()
      WHERE workspace_id = _workspace_id;
  ELSE
    new_secret := vault.create_secret(_key, 'workspace_ai_key_' || _workspace_id::text, 'BYO OpenAI key');
    INSERT INTO public.workspace_ai_keys (workspace_id, openai_key_secret_id)
      VALUES (_workspace_id, new_secret)
    ON CONFLICT (workspace_id) DO UPDATE
      SET openai_key_secret_id = EXCLUDED.openai_key_secret_id,
          openai_key = NULL,
          updated_at = now();
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_workspace_ai_key(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_workspace_ai_key(uuid, text) TO authenticated;

-- Remove BYO key
CREATE OR REPLACE FUNCTION public.delete_workspace_ai_key(_workspace_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_secret uuid;
BEGIN
  IF NOT public.is_workspace_admin(auth.uid(), _workspace_id) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT openai_key_secret_id INTO existing_secret
    FROM public.workspace_ai_keys WHERE workspace_id = _workspace_id;

  DELETE FROM public.workspace_ai_keys WHERE workspace_id = _workspace_id;

  IF existing_secret IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = existing_secret;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_workspace_ai_key(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_workspace_ai_key(uuid) TO authenticated;

-- Update presence check to consider vault-backed key too
CREATE OR REPLACE FUNCTION public.workspace_has_ai_key(_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_ai_keys
    WHERE workspace_id = _workspace_id
      AND (openai_key_secret_id IS NOT NULL OR (openai_key IS NOT NULL AND openai_key <> ''))
  );
$$;
