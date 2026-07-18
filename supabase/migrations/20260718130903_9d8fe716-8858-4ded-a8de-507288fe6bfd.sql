
-- ai_usage table
CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  period_month date NOT NULL,
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, period_month)
);
GRANT SELECT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view their workspace ai_usage"
  ON public.ai_usage FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER update_ai_usage_updated_at
  BEFORE UPDATE ON public.ai_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX ai_usage_workspace_period_idx
  ON public.ai_usage (workspace_id, period_month);

-- workspace_ai_keys table (BYO OpenAI key)
-- NOTE: Key value is NEVER readable via the Data API. Only INSERT/UPDATE/DELETE
-- are granted to authenticated so admins can manage their key without ever
-- reading it back. The edge function reads it via service_role.
CREATE TABLE public.workspace_ai_keys (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  openai_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT, UPDATE, DELETE ON public.workspace_ai_keys TO authenticated;
GRANT ALL ON public.workspace_ai_keys TO service_role;
ALTER TABLE public.workspace_ai_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert their workspace ai key"
  ON public.workspace_ai_keys FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update their workspace ai key"
  ON public.workspace_ai_keys FOR UPDATE TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete their workspace ai key"
  ON public.workspace_ai_keys FOR DELETE TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_workspace_ai_keys_updated_at
  BEFORE UPDATE ON public.workspace_ai_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Safe presence check for the UI
CREATE OR REPLACE FUNCTION public.workspace_has_ai_key(_workspace_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_ai_keys WHERE workspace_id = _workspace_id
  );
$$;
REVOKE ALL ON FUNCTION public.workspace_has_ai_key(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.workspace_has_ai_key(uuid) TO authenticated;

-- Atomic increment used only by the edge function (service_role)
CREATE OR REPLACE FUNCTION public.increment_ai_usage(_workspace_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _period date := date_trunc('month', now() at time zone 'UTC')::date;
  _count integer;
BEGIN
  INSERT INTO public.ai_usage (workspace_id, period_month, message_count)
  VALUES (_workspace_id, _period, 1)
  ON CONFLICT (workspace_id, period_month)
  DO UPDATE SET message_count = public.ai_usage.message_count + 1, updated_at = now()
  RETURNING message_count INTO _count;
  RETURN _count;
END;
$$;
REVOKE ALL ON FUNCTION public.increment_ai_usage(uuid) FROM PUBLIC, anon, authenticated;
