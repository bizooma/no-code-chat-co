
CREATE OR REPLACE FUNCTION public.get_workspace_ai_key(_workspace_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sid uuid;
  plaintext text;
  legacy text;
BEGIN
  SELECT openai_key_secret_id, openai_key
    INTO sid, legacy
  FROM public.workspace_ai_keys
  WHERE workspace_id = _workspace_id;

  IF sid IS NOT NULL THEN
    SELECT decrypted_secret INTO plaintext
      FROM vault.decrypted_secrets WHERE id = sid;
    RETURN plaintext;
  END IF;

  RETURN legacy; -- legacy plaintext fallback; expected to be NULL post-migration
END;
$$;

REVOKE ALL ON FUNCTION public.get_workspace_ai_key(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_workspace_ai_key(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_ai_key(uuid) TO service_role;
