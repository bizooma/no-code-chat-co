
-- Ensure pg_net is available for outbound HTTP from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Config table (service-role only; no anon / authenticated grants)
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_config TO service_role;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (bypasses RLS) can read/write.

INSERT INTO public.app_config (key, value) VALUES
  ('functions_base_url', 'https://jsyqavxvspkqitrwbeay.supabase.co/functions/v1')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

CREATE OR REPLACE FUNCTION public.notify_lead_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_url text;
  lead_payload jsonb;
BEGIN
  SELECT value INTO base_url FROM public.app_config WHERE key = 'functions_base_url';
  IF base_url IS NULL THEN
    RETURN NEW;
  END IF;

  -- Email notification (function looks up the lead by id)
  PERFORM net.http_post(
    url := base_url || '/send-lead-notification',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('leadId', NEW.id::text)
  );

  -- Slack notification (needs the lead body + workspace_id inline)
  lead_payload := jsonb_build_object(
    'name', NEW.name,
    'email', NEW.email,
    'phone', NEW.phone,
    'company', NEW.company,
    'source', NEW.source
  );
  PERFORM net.http_post(
    url := base_url || '/slack-notifications',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('workspace_id', NEW.workspace_id::text, 'lead', lead_payload)
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never fail the lead insert because of a notification hiccup
  RAISE WARNING 'notify_lead_after_insert failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_notify_after_insert ON public.leads;
CREATE TRIGGER leads_notify_after_insert
AFTER INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.notify_lead_after_insert();
