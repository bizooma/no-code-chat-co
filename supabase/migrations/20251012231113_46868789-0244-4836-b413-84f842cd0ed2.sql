-- Create enum for knowledge source types
CREATE TYPE knowledge_source_type AS ENUM ('text', 'file', 'url');

-- Create enum for processing status
CREATE TYPE knowledge_source_status AS ENUM ('processing', 'ready', 'error');

-- Create avatar_knowledge_sources table
CREATE TABLE avatar_knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES avatar_chatbots(id) ON DELETE CASCADE,
  source_type knowledge_source_type NOT NULL,
  source_name TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  file_url TEXT,
  status knowledge_source_status NOT NULL DEFAULT 'ready',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_knowledge_sources_chatbot ON avatar_knowledge_sources(chatbot_id);
CREATE INDEX idx_knowledge_sources_status ON avatar_knowledge_sources(status);

-- Enable RLS
ALTER TABLE avatar_knowledge_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage knowledge sources for their bots"
ON avatar_knowledge_sources
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM avatar_chatbots ac
    WHERE ac.id = avatar_knowledge_sources.chatbot_id
    AND (ac.user_id = auth.uid() OR is_workspace_member(auth.uid(), ac.workspace_id))
  )
);

-- Create storage bucket for knowledge files
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar-knowledge-files', 'avatar-knowledge-files', true);

-- Storage policies
CREATE POLICY "Users can upload knowledge files for their bots"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatar-knowledge-files'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM avatar_chatbots
    WHERE user_id = auth.uid() OR is_workspace_member(auth.uid(), workspace_id)
  )
);

CREATE POLICY "Users can view knowledge files for their bots"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'avatar-knowledge-files'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM avatar_chatbots
    WHERE user_id = auth.uid() OR is_workspace_member(auth.uid(), workspace_id)
  )
);

CREATE POLICY "Users can delete knowledge files for their bots"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatar-knowledge-files'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM avatar_chatbots
    WHERE user_id = auth.uid() OR is_workspace_member(auth.uid(), workspace_id)
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_knowledge_sources_updated_at
BEFORE UPDATE ON avatar_knowledge_sources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();