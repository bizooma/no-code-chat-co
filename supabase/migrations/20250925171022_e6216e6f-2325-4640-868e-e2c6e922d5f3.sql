-- Add A/B testing and advanced analytics support
CREATE TABLE IF NOT EXISTS public.ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  test_type TEXT NOT NULL CHECK (test_type IN ('video_layout', 'video_content', 'message_flow', 'interactive_elements')),
  variants JSONB NOT NULL DEFAULT '[]',
  traffic_split JSONB NOT NULL DEFAULT '{"A": 50, "B": 50}',
  success_metric TEXT NOT NULL CHECK (success_metric IN ('completion_rate', 'interaction_rate', 'conversion_rate', 'engagement_time')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add heat map tracking for video interactions
CREATE TABLE IF NOT EXISTS public.video_heatmaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  visitor_id TEXT,
  video_url TEXT NOT NULL,
  interaction_data JSONB NOT NULL, -- {x, y, timestamp, type, duration}
  viewport_size JSONB NOT NULL, -- {width, height}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add conversion funnel tracking
CREATE TABLE IF NOT EXISTS public.conversion_funnels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  steps JSONB NOT NULL, -- [{"name": "Video Start", "event": "video_started"}, ...]
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add performance metrics tracking
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('load_time', 'video_buffer_time', 'interaction_latency', 'error_rate')),
  metric_value DECIMAL NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_heatmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage AB tests for their workspaces"
ON public.ab_tests
FOR ALL
USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can view heatmaps for their bots"
ON public.video_heatmaps
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chatbots c 
    WHERE c.id = video_heatmaps.chatbot_id 
    AND is_workspace_member(auth.uid(), c.workspace_id)
  )
);

CREATE POLICY "Allow heatmap data to be created"
ON public.video_heatmaps
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can manage conversion funnels for their workspaces"
ON public.conversion_funnels
FOR ALL
USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can view performance metrics for their bots"
ON public.performance_metrics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chatbots c 
    WHERE c.id = performance_metrics.chatbot_id 
    AND is_workspace_member(auth.uid(), c.workspace_id)
  )
);

CREATE POLICY "Allow performance metrics to be created"
ON public.performance_metrics
FOR INSERT
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_ab_tests_chatbot_id ON public.ab_tests(chatbot_id);
CREATE INDEX idx_ab_tests_workspace_id ON public.ab_tests(workspace_id);
CREATE INDEX idx_ab_tests_status ON public.ab_tests(status);

CREATE INDEX idx_video_heatmaps_chatbot_id ON public.video_heatmaps(chatbot_id);
CREATE INDEX idx_video_heatmaps_created_at ON public.video_heatmaps(created_at);

CREATE INDEX idx_conversion_funnels_chatbot_id ON public.conversion_funnels(chatbot_id);
CREATE INDEX idx_conversion_funnels_workspace_id ON public.conversion_funnels(workspace_id);

CREATE INDEX idx_performance_metrics_chatbot_id ON public.performance_metrics(chatbot_id);
CREATE INDEX idx_performance_metrics_timestamp ON public.performance_metrics(timestamp);

-- Update chatbot templates to support video content
ALTER TABLE public.chatbot_templates 
ADD COLUMN IF NOT EXISTS video_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sample_videos JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS industry_tags TEXT[] DEFAULT '{}';

-- Add enhanced template configuration
UPDATE public.chatbot_templates SET 
  video_enabled = true,
  industry_tags = ARRAY['law', 'professional_services'],
  sample_videos = '[
    {
      "type": "video_intro", 
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", 
      "title": "Welcome Video",
      "layout": "portrait"
    }
  ]'::jsonb
WHERE name LIKE '%Law%' OR name LIKE '%Legal%';