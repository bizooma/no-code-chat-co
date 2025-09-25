-- Add new message types for video support
ALTER TYPE message_type ADD VALUE IF NOT EXISTS 'youtube_video';
ALTER TYPE message_type ADD VALUE IF NOT EXISTS 'uploaded_video';
ALTER TYPE message_type ADD VALUE IF NOT EXISTS 'video_intro';

-- Add video configuration fields to chatbots table
ALTER TABLE public.chatbots 
ADD COLUMN IF NOT EXISTS video_type text DEFAULT 'none' CHECK (video_type IN ('none', 'youtube', 'uploaded', 'intro_video')),
ADD COLUMN IF NOT EXISTS video_config jsonb DEFAULT NULL;

-- Add video-specific fields to chatbot_messages table
ALTER TABLE public.chatbot_messages
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS video_thumbnail text,
ADD COLUMN IF NOT EXISTS video_duration integer,
ADD COLUMN IF NOT EXISTS video_autoplay boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS video_controls boolean DEFAULT true;

-- Create storage bucket for video uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chatbot-videos', 'chatbot-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for video storage
CREATE POLICY "Users can view videos for their workspace chatbots" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'chatbot-videos' 
  AND EXISTS (
    SELECT 1 FROM chatbots c 
    WHERE c.id::text = (storage.foldername(name))[1]
    AND is_workspace_member(auth.uid(), c.workspace_id)
  )
);

CREATE POLICY "Users can upload videos for their workspace chatbots" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'chatbot-videos' 
  AND EXISTS (
    SELECT 1 FROM chatbots c 
    WHERE c.id::text = (storage.foldername(name))[1]
    AND is_workspace_member(auth.uid(), c.workspace_id)
  )
);

CREATE POLICY "Users can update videos for their workspace chatbots" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'chatbot-videos' 
  AND EXISTS (
    SELECT 1 FROM chatbots c 
    WHERE c.id::text = (storage.foldername(name))[1]
    AND is_workspace_member(auth.uid(), c.workspace_id)
  )
);

CREATE POLICY "Users can delete videos for their workspace chatbots" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'chatbot-videos' 
  AND EXISTS (
    SELECT 1 FROM chatbots c 
    WHERE c.id::text = (storage.foldername(name))[1]
    AND is_workspace_member(auth.uid(), c.workspace_id)
  )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_video_url ON public.chatbot_messages(video_url) WHERE video_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chatbots_video_type ON public.chatbots(video_type) WHERE video_type != 'none';