-- Add branding and agency features to workspaces
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS white_label_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS agency_name TEXT,
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- Create workspace_members table for multi-user access
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- member, admin, viewer
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Enable RLS on workspace_members
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Create policies for workspace_members
CREATE POLICY "Users can view workspace members for their workspaces"
ON public.workspace_members
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.get_user_workspaces(auth.uid())
  )
);

CREATE POLICY "Workspace admins can manage members"
ON public.workspace_members
FOR ALL
USING (
  workspace_id IN (
    SELECT w.id FROM public.workspaces w 
    WHERE w.owner_id = auth.uid()
    OR public.has_role(auth.uid(), 'platform_owner'::app_role)
  )
);

-- Create function to check workspace member access
CREATE OR REPLACE FUNCTION public.is_workspace_admin(user_uuid UUID, workspace_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_uuid
    AND (
      w.owner_id = user_uuid
      OR public.has_role(user_uuid, 'platform_owner'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = workspace_uuid
        AND wm.user_id = user_uuid
        AND wm.role = 'admin'
      )
    )
  );
$$;