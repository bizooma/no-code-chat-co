-- Add D-ID agent columns to avatar_chatbots table
ALTER TABLE avatar_chatbots
ADD COLUMN did_agent_id text,
ADD COLUMN did_client_key text;

-- Add comment for clarity
COMMENT ON COLUMN avatar_chatbots.did_agent_id IS 'Unique agent ID from D-ID API for this chatbot';
COMMENT ON COLUMN avatar_chatbots.did_client_key IS 'Client key generated for this agent to authenticate SDK connections';