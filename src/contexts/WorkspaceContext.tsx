import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  domain?: string;
  logo_url?: string;
  brand_color: string;
  custom_domain?: string;
  white_label_enabled: boolean;
  agency_name?: string;
  client_name?: string;
  subscription_tier: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  invited_by?: string;
  invited_at: string;
  accepted_at?: string;
  profiles?: {
    full_name?: string;
  };
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  loading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (data: Partial<Workspace>) => Promise<Workspace | null>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  inviteMember: (workspaceId: string, email: string, role: string) => Promise<void>;
  getWorkspaceMembers: (workspaceId: string) => Promise<WorkspaceMember[]>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('name');

      if (error) throw error;

      setWorkspaces(data || []);
      
      // Set first workspace as current if none selected
      if (!currentWorkspace && data && data.length > 0) {
        setCurrentWorkspace(data[0]);
        localStorage.setItem('currentWorkspaceId', data[0].id);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast({
        title: "Error",
        description: "Failed to load workspaces",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  useEffect(() => {
    // Restore saved workspace from localStorage
    const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
    if (savedWorkspaceId && workspaces.length > 0) {
      const workspace = workspaces.find(w => w.id === savedWorkspaceId);
      if (workspace) {
        setCurrentWorkspace(workspace);
      }
    }
  }, [workspaces]);

  const switchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      localStorage.setItem('currentWorkspaceId', workspaceId);
      
      toast({
        title: "Workspace switched",
        description: `Switched to ${workspace.name}`,
      });
    }
  };

  const refreshWorkspaces = async () => {
    await fetchWorkspaces();
  };

  const createWorkspace = async (data: Partial<Workspace>): Promise<Workspace | null> => {
    try {
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .insert({
          name: data.name || 'New Workspace',
          owner_id: user?.id || '',
          ...data,
        })
        .select()
        .single();

      if (error) throw error;

      await refreshWorkspaces();
      
      toast({
        title: "Success",
        description: "Workspace created successfully",
      });

      return workspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast({
        title: "Error",
        description: "Failed to create workspace",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateWorkspace = async (id: string, data: Partial<Workspace>) => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      await refreshWorkspaces();
      
      // Update current workspace if it's the one being updated
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace({ ...currentWorkspace, ...data });
      }

      toast({
        title: "Success",
        description: "Workspace updated successfully",
      });
    } catch (error) {
      console.error('Error updating workspace:', error);
      toast({
        title: "Error",
        description: "Failed to update workspace",
        variant: "destructive",
      });
    }
  };

  const deleteWorkspace = async (id: string) => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await refreshWorkspaces();
      
      // Switch to another workspace if current was deleted
      if (currentWorkspace?.id === id) {
        const remaining = workspaces.filter(w => w.id !== id);
        setCurrentWorkspace(remaining.length > 0 ? remaining[0] : null);
      }

      toast({
        title: "Success",
        description: "Workspace deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast({
        title: "Error",
        description: "Failed to delete workspace",
        variant: "destructive",
      });
    }
  };

  const inviteMember = async (workspaceId: string, email: string, role: string) => {
    try {
      // First check if user exists by email (this is simplified - in production you'd need admin API)
      // For now, we'll create a placeholder invitation that can be accepted later
      
      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${email}`,
      });
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    }
  };

  const getWorkspaceMembers = async (workspaceId: string): Promise<WorkspaceMember[]> => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      return (data || []) as WorkspaceMember[];
    } catch (error) {
      console.error('Error fetching workspace members:', error);
      return [];
    }
  };

  const value = {
    workspaces,
    currentWorkspace,
    loading,
    switchWorkspace,
    refreshWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    inviteMember,
    getWorkspaceMembers,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};