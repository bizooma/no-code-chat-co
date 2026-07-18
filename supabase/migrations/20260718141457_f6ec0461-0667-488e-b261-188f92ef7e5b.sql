
-- Ensure no plaintext key exists before dropping (safety no-op if column already null)
UPDATE public.workspace_ai_keys SET openai_key = NULL WHERE openai_key IS NOT NULL;

-- Drop the plaintext column entirely
ALTER TABLE public.workspace_ai_keys DROP COLUMN IF EXISTS openai_key;

-- Recreate set_workspace_ai_key without any reference to the dropped column
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
      SET updated_at = now()
      WHERE workspace_id = _workspace_id;
  ELSE
    new_secret := vault.create_secret(_key, 'workspace_ai_key_' || _workspace_id::text, 'BYO OpenAI key');
    INSERT INTO public.workspace_ai_keys (workspace_id, openai_key_secret_id)
      VALUES (_workspace_id, new_secret)
    ON CONFLICT (workspace_id) DO UPDATE
      SET openai_key_secret_id = EXCLUDED.openai_key_secret_id,
          updated_at = now();
  END IF;
END;
$$;

-- Recreate get_workspace_ai_key without legacy plaintext fallback
CREATE OR REPLACE FUNCTION public.get_workspace_ai_key(_workspace_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sid uuid;
  plaintext text;
BEGIN
  SELECT openai_key_secret_id INTO sid
    FROM public.workspace_ai_keys
    WHERE workspace_id = _workspace_id;

  IF sid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO plaintext
    FROM vault.decrypted_secrets WHERE id = sid;
  RETURN plaintext;
END;
$$;

-- Recreate workspace_has_ai_key without reference to dropped column
CREATE OR REPLACE FUNCTION public.workspace_has_ai_key(_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_ai_keys
    WHERE workspace_id = _workspace_id
      AND openai_key_secret_id IS NOT NULL
  );
$$;
