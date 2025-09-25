-- Phase 1: Core Database Schema & Foundation for Chatbot Platform

-- Create enums for type safety
CREATE TYPE public.chatbot_status AS ENUM ('draft', 'active', 'inactive');
CREATE TYPE public.conversation_status AS ENUM ('active', 'ended', 'transferred_to_human');
CREATE TYPE public.message_type AS ENUM ('text', 'image', 'file', 'form', 'button');
CREATE TYPE public.message_sender AS ENUM ('bot', 'user', 'agent');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost');
CREATE TYPE public.integration_type AS ENUM ('zapier', 'hubspot', 'mailchimp', 'slack', 'facebook', 'whatsapp');
CREATE TYPE public.event_type AS ENUM ('conversation_started', 'message_sent', 'lead_captured', 'bot_triggered');

-- 1. Workspaces table (Agency Management)
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  domain TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Chatbots table (Core Bot Configuration)
CREATE TABLE public.chatbots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status public.chatbot_status NOT NULL DEFAULT 'draft',
  welcome_message TEXT NOT NULL DEFAULT 'Hello! How can I help you?',
  fallback_message TEXT NOT NULL DEFAULT 'I didn''t understand that.',
  widget_config JSONB DEFAULT '{"color": "#3B82F6", "position": "bottom-right"}',
  ai_enabled BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Chatbot Messages table (Bot Flow Messages)
CREATE TABLE public.chatbot_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  message_key TEXT NOT NULL,
  message_text TEXT NOT NULL,
  message_type public.message_type NOT NULL DEFAULT 'text',
  next_message_key TEXT,
  conditions JSONB,
  buttons JSONB,
  collect_lead_info BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(chatbot_id, message_key)
);

-- 4. Conversations table (User Chat Sessions)
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  status public.conversation_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  visitor_info JSONB,
  assigned_agent_id UUID REFERENCES public.profiles(user_id),
  lead_captured BOOLEAN NOT NULL DEFAULT false
);

-- 5. Conversation Messages table (Individual Chat Messages)
CREATE TABLE public.conversation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender public.message_sender NOT NULL,
  message_text TEXT NOT NULL,
  message_type public.message_type NOT NULL DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Leads table (Captured Lead Information)
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  name TEXT,
  company TEXT,
  additional_data JSONB,
  status public.lead_status NOT NULL DEFAULT 'new',
  value DECIMAL(10,2),
  source TEXT NOT NULL DEFAULT 'website_chat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Chatbot Templates table (Pre-built Templates)
CREATE TABLE public.chatbot_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  preview_image TEXT,
  template_config JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Integrations table (Third-party Connections)
CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  integration_type public.integration_type NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Analytics Events table (User Interaction Tracking)
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  event_type public.event_type NOT NULL,
  event_data JSONB,
  visitor_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create security definer functions
CREATE OR REPLACE FUNCTION public.get_user_workspaces(user_uuid uuid)
RETURNS TABLE(workspace_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.id
  FROM public.workspaces w
  WHERE w.owner_id = user_uuid
  OR EXISTS (
    SELECT 1 FROM public.has_role(user_uuid, 'platform_owner'::app_role)
    WHERE public.has_role(user_uuid, 'platform_owner'::app_role) = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_member(user_uuid uuid, workspace_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.workspaces w
    WHERE w.id = workspace_uuid
    AND (
      w.owner_id = user_uuid
      OR public.has_role(user_uuid, 'platform_owner'::app_role) = true
    )
  );
$$;

-- RLS Policies

-- Workspaces: Users see their own workspaces + platform owners see all
CREATE POLICY "Users can view their own workspaces" 
ON public.workspaces FOR SELECT 
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'platform_owner'::app_role));

CREATE POLICY "Users can insert their own workspaces" 
ON public.workspaces FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own workspaces" 
ON public.workspaces FOR UPDATE 
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'platform_owner'::app_role));

CREATE POLICY "Platform owners can delete workspaces" 
ON public.workspaces FOR DELETE 
USING (public.has_role(auth.uid(), 'platform_owner'::app_role));

-- Chatbots: Users see bots in their workspaces only
CREATE POLICY "Users can view chatbots in their workspaces" 
ON public.chatbots FOR SELECT 
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can insert chatbots in their workspaces" 
ON public.chatbots FOR INSERT 
WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id) AND auth.uid() = created_by);

CREATE POLICY "Users can update chatbots in their workspaces" 
ON public.chatbots FOR UPDATE 
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can delete chatbots in their workspaces" 
ON public.chatbots FOR DELETE 
USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Chatbot Messages: Tied to chatbot access
CREATE POLICY "Users can manage chatbot messages for their bots" 
ON public.chatbot_messages FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.chatbots c 
    WHERE c.id = chatbot_id 
    AND public.is_workspace_member(auth.uid(), c.workspace_id)
  )
);

-- Conversations: Users see conversations for their bots only
CREATE POLICY "Users can view conversations for their bots" 
ON public.conversations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chatbots c 
    WHERE c.id = chatbot_id 
    AND public.is_workspace_member(auth.uid(), c.workspace_id)
  )
);

CREATE POLICY "Allow bot conversations to be created" 
ON public.conversations FOR INSERT 
WITH CHECK (true); -- Needed for anonymous bot interactions

-- Conversation Messages: Tied to conversation access
CREATE POLICY "Users can view messages for accessible conversations" 
ON public.conversation_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations conv
    JOIN public.chatbots c ON c.id = conv.chatbot_id
    WHERE conv.id = conversation_id 
    AND public.is_workspace_member(auth.uid(), c.workspace_id)
  )
);

CREATE POLICY "Allow messages to be inserted into conversations" 
ON public.conversation_messages FOR INSERT 
WITH CHECK (true); -- Needed for anonymous bot interactions

-- Leads: Users see leads from their workspaces only
CREATE POLICY "Users can view leads from their workspaces" 
ON public.leads FOR SELECT 
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can update leads from their workspaces" 
ON public.leads FOR UPDATE 
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Allow leads to be created" 
ON public.leads FOR INSERT 
WITH CHECK (true); -- Needed for bot lead capture

-- Templates: Everyone can view active templates
CREATE POLICY "Everyone can view active templates" 
ON public.chatbot_templates FOR SELECT 
USING (is_active = true);

CREATE POLICY "Platform owners can manage templates" 
ON public.chatbot_templates FOR ALL 
USING (public.has_role(auth.uid(), 'platform_owner'::app_role));

-- Integrations: Users manage integrations for their workspaces
CREATE POLICY "Users can manage integrations for their workspaces" 
ON public.integrations FOR ALL 
USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Analytics Events: Users see events for their bots only
CREATE POLICY "Users can view analytics for their bots" 
ON public.analytics_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chatbots c 
    WHERE c.id = chatbot_id 
    AND public.is_workspace_member(auth.uid(), c.workspace_id)
  )
);

CREATE POLICY "Allow analytics events to be created" 
ON public.analytics_events FOR INSERT 
WITH CHECK (true); -- Needed for bot analytics tracking

-- Create indexes for performance
CREATE INDEX idx_workspaces_owner_id ON public.workspaces(owner_id);
CREATE INDEX idx_chatbots_workspace_status ON public.chatbots(workspace_id, status);
CREATE INDEX idx_chatbots_created_by ON public.chatbots(created_by);
CREATE INDEX idx_conversations_chatbot_status ON public.conversations(chatbot_id, status, started_at);
CREATE INDEX idx_conversation_messages_conversation_time ON public.conversation_messages(conversation_id, created_at);
CREATE INDEX idx_leads_workspace_status_time ON public.leads(workspace_id, status, created_at);
CREATE INDEX idx_analytics_events_chatbot_type_time ON public.analytics_events(chatbot_id, event_type, created_at);
CREATE INDEX idx_chatbot_messages_chatbot_key ON public.chatbot_messages(chatbot_id, message_key);

-- Create triggers for updated_at columns
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chatbots_updated_at
  BEFORE UPDATE ON public.chatbots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chatbot_messages_updated_at
  BEFORE UPDATE ON public.chatbot_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create default workspace for new users
CREATE OR REPLACE FUNCTION public.create_default_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default workspace for new user
  INSERT INTO public.workspaces (name, owner_id)
  VALUES ('My Workspace', NEW.user_id);
  
  RETURN NEW;
END;
$$;

-- Update the existing user creation trigger to include workspace creation
CREATE OR REPLACE FUNCTION public.handle_new_user_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Insert default notification preferences
  INSERT INTO public.user_notification_preferences (user_id)
  VALUES (NEW.id);
  
  -- Create default workspace
  INSERT INTO public.workspaces (name, owner_id)
  VALUES ('My Workspace', NEW.id);
  
  RETURN NEW;
END;
$$;