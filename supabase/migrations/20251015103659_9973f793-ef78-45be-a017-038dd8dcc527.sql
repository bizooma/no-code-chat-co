-- Update chatbot_type constraint to support all three bot types
-- Remove old constraint that only allowed 'standard' and 'avatar'
ALTER TABLE public.chatbots 
DROP CONSTRAINT IF EXISTS chatbots_chatbot_type_check;

-- Add new constraint that allows 'standard', 'avatar', and 'video_bot'
ALTER TABLE public.chatbots 
ADD CONSTRAINT chatbots_chatbot_type_check 
CHECK (chatbot_type IN ('standard', 'avatar', 'video_bot'));