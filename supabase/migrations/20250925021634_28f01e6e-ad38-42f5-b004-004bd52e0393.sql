-- Check and add missing integration types (avoid duplicates)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'facebook_messenger' AND enumtypid = 'integration_type'::regtype) THEN
        ALTER TYPE integration_type ADD VALUE 'facebook_messenger';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'whatsapp_business' AND enumtypid = 'integration_type'::regtype) THEN
        ALTER TYPE integration_type ADD VALUE 'whatsapp_business';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'webhook' AND enumtypid = 'integration_type'::regtype) THEN
        ALTER TYPE integration_type ADD VALUE 'webhook';
    END IF;
END $$;

-- Add channel support to conversations if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'channel') THEN
        ALTER TABLE conversations 
        ADD COLUMN channel TEXT DEFAULT 'website' CHECK (channel IN ('website', 'facebook', 'whatsapp', 'slack'));
    END IF;
END $$;

-- Add channel support to conversation_messages if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_messages' AND column_name = 'channel') THEN
        ALTER TABLE conversation_messages
        ADD COLUMN channel TEXT DEFAULT 'website' CHECK (channel IN ('website', 'facebook', 'whatsapp', 'slack'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_messages' AND column_name = 'external_message_id') THEN
        ALTER TABLE conversation_messages
        ADD COLUMN external_message_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_messages' AND column_name = 'platform_metadata') THEN
        ALTER TABLE conversation_messages 
        ADD COLUMN platform_metadata JSONB;
    END IF;
END $$;

-- Create webhook logs table if not exists
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for webhook_logs if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'webhook_logs' AND rowsecurity) THEN
        ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policy for webhook_logs if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'webhook_logs' AND policyname = 'Users can view webhook logs for their workspaces') THEN
        CREATE POLICY "Users can view webhook logs for their workspaces"
          ON webhook_logs FOR SELECT
          USING (is_workspace_member(auth.uid(), workspace_id));
    END IF;
END $$;

-- Create indexes for better performance if not exists
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_channel ON conversation_messages(channel);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_external_id ON conversation_messages(external_message_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_workspace_id ON webhook_logs(workspace_id);