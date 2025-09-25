-- Add video analytics tracking
CREATE TABLE IF NOT EXISTS public.video_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  visitor_id TEXT,
  video_url TEXT NOT NULL,
  video_type TEXT NOT NULL CHECK (video_type IN ('youtube', 'uploaded', 'video_intro')),
  event_type TEXT NOT NULL CHECK (event_type IN ('video_started', 'video_played', 'video_paused', 'video_ended', 'video_seeked', 'video_fullscreen', 'video_interaction')),
  event_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_duration INTEGER, -- in seconds
  completion_rate DECIMAL(5,2), -- percentage 0-100
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for video analytics
CREATE POLICY "Users can view video analytics for their bots"
ON public.video_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chatbots c 
    WHERE c.id = video_analytics.chatbot_id 
    AND is_workspace_member(auth.uid(), c.workspace_id)
  )
);

CREATE POLICY "Allow video analytics to be created"
ON public.video_analytics
FOR INSERT
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_video_analytics_chatbot_id ON public.video_analytics(chatbot_id);
CREATE INDEX idx_video_analytics_conversation_id ON public.video_analytics(conversation_id);
CREATE INDEX idx_video_analytics_visitor_id ON public.video_analytics(visitor_id);
CREATE INDEX idx_video_analytics_timestamp ON public.video_analytics(timestamp);

-- Add video layout and interactive elements support
ALTER TABLE public.chatbot_messages 
ADD COLUMN IF NOT EXISTS video_layout TEXT DEFAULT 'standard' CHECK (video_layout IN ('standard', 'portrait', 'landscape', 'split', 'overlay')),
ADD COLUMN IF NOT EXISTS interactive_elements JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS video_chapters JSONB DEFAULT NULL;