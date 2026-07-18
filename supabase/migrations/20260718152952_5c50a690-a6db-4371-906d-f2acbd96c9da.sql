
-- Trigger: on lead insert, derive/validate workspace_id from chatbot
CREATE OR REPLACE FUNCTION public.leads_derive_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bot_workspace uuid;
  bot_status text;
BEGIN
  IF NEW.chatbot_id IS NULL THEN
    RAISE EXCEPTION 'chatbot_id is required';
  END IF;

  SELECT workspace_id, status INTO bot_workspace, bot_status
  FROM public.chatbots WHERE id = NEW.chatbot_id;

  IF bot_workspace IS NULL THEN
    RAISE EXCEPTION 'invalid chatbot_id';
  END IF;

  IF bot_status IS NOT NULL AND bot_status = 'archived' THEN
    RAISE EXCEPTION 'chatbot is not accepting leads';
  END IF;

  -- Always derive workspace_id from the chatbot; ignore any client-supplied value
  NEW.workspace_id := bot_workspace;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_derive_workspace_trg ON public.leads;
CREATE TRIGGER leads_derive_workspace_trg
BEFORE INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.leads_derive_workspace();
