
CREATE OR REPLACE FUNCTION public.conversations_validate_chatbot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bot_status text;
  bot_exists boolean;
BEGIN
  IF NEW.chatbot_id IS NULL THEN
    RAISE EXCEPTION 'chatbot_id is required';
  END IF;

  SELECT status, true INTO bot_status, bot_exists
  FROM public.chatbots WHERE id = NEW.chatbot_id;

  IF NOT COALESCE(bot_exists, false) THEN
    RAISE EXCEPTION 'invalid chatbot_id';
  END IF;

  IF bot_status IS NOT NULL AND bot_status = 'archived' THEN
    RAISE EXCEPTION 'chatbot is not accepting conversations';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS conversations_validate_chatbot_trg ON public.conversations;
CREATE TRIGGER conversations_validate_chatbot_trg
BEFORE INSERT ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.conversations_validate_chatbot();

CREATE OR REPLACE FUNCTION public.conversation_messages_validate_parent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_exists boolean;
BEGIN
  IF NEW.conversation_id IS NULL THEN
    RAISE EXCEPTION 'conversation_id is required';
  END IF;

  SELECT true INTO conv_exists
  FROM public.conversations WHERE id = NEW.conversation_id;

  IF NOT COALESCE(conv_exists, false) THEN
    RAISE EXCEPTION 'invalid conversation_id';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS conversation_messages_validate_parent_trg ON public.conversation_messages;
CREATE TRIGGER conversation_messages_validate_parent_trg
BEFORE INSERT ON public.conversation_messages
FOR EACH ROW EXECUTE FUNCTION public.conversation_messages_validate_parent();
