-- Create avatar_chatbots table
CREATE TABLE IF NOT EXISTS public.avatar_chatbots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  avatar_id TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  llm_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  system_prompt TEXT,
  knowledge_base TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create avatar_conversations table
CREATE TABLE IF NOT EXISTS public.avatar_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID REFERENCES public.avatar_chatbots(id) ON DELETE CASCADE NOT NULL,
  visitor_id TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb NOT NULL,
  session_duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.avatar_chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for avatar_chatbots
CREATE POLICY "Users can manage their avatar chatbots"
  ON public.avatar_chatbots
  FOR ALL
  USING (
    auth.uid() = user_id OR 
    is_workspace_member(auth.uid(), workspace_id)
  );

-- RLS Policies for avatar_conversations
CREATE POLICY "Users can view conversations for their bots"
  ON public.avatar_conversations
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM avatar_chatbots ac
    WHERE ac.id = avatar_conversations.chatbot_id
    AND (ac.user_id = auth.uid() OR is_workspace_member(auth.uid(), ac.workspace_id))
  ));

CREATE POLICY "Anyone can create conversations"
  ON public.avatar_conversations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their bot conversations"
  ON public.avatar_conversations
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM avatar_chatbots ac
    WHERE ac.id = avatar_conversations.chatbot_id
    AND (ac.user_id = auth.uid() OR is_workspace_member(auth.uid(), ac.workspace_id))
  ));

-- Add chatbot_type to existing chatbots table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chatbots' AND column_name = 'chatbot_type'
  ) THEN
    ALTER TABLE public.chatbots 
    ADD COLUMN chatbot_type TEXT DEFAULT 'standard' CHECK (chatbot_type IN ('standard', 'avatar'));
  END IF;
END $$;

-- Create trigger for avatar_chatbots
DROP TRIGGER IF EXISTS update_avatar_chatbots_updated_at ON public.avatar_chatbots;
CREATE TRIGGER update_avatar_chatbots_updated_at
  BEFORE UPDATE ON public.avatar_chatbots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_avatar_chatbots_workspace_id ON public.avatar_chatbots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_avatar_chatbots_user_id ON public.avatar_chatbots(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_conversations_chatbot_id ON public.avatar_conversations(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_avatar_conversations_visitor_id ON public.avatar_conversations(visitor_id);