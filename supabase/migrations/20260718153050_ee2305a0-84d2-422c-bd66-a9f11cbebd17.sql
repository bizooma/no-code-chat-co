
CREATE OR REPLACE FUNCTION public.notify_lead_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_url text;
BEGIN
  SELECT value INTO base_url FROM public.app_config WHERE key = 'functions_base_url';
  IF base_url IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := base_url || '/send-lead-notification',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('leadId', NEW.id::text)
  );

  PERFORM net.http_post(
    url := base_url || '/slack-notifications',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('leadId', NEW.id::text)
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_lead_after_insert failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;
