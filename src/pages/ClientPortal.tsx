import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Settings,
  ExternalLink,
  Play,
  BarChart3,
  Target,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ClientPortalProps {
  workspaceId?: string;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ workspaceId: propWorkspaceId }) => {
  const [searchParams] = useSearchParams();
  const { currentWorkspace, switchWorkspace, workspaces } = useWorkspace();
  const [stats, setStats] = useState({
    totalChatbots: 0,
    totalConversations: 0,
    totalLeads: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);

  // Get workspace ID from props or URL params
  const workspaceId = propWorkspaceId || searchParams.get('workspace');
  
  // Find the workspace for branding
  const workspace = workspaceId 
    ? workspaces.find(w => w.id === workspaceId) || currentWorkspace
    : currentWorkspace;

  useEffect(() => {
    if (workspaceId && workspaceId !== currentWorkspace?.id) {
      switchWorkspace(workspaceId);
    }
  }, [workspaceId, currentWorkspace, switchWorkspace]);

  useEffect(() => {
    fetchStats();
  }, [workspace?.id]);

  const fetchStats = async () => {
    if (!workspace?.id) return;

    try {
      // Fetch chatbots count
      const { count: chatbotsCount } = await supabase
        .from('chatbots')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id);

      // Fetch conversations
      const { data: conversations } = await supabase
        .from('conversations')
        .select(`
          id,
          lead_captured,
          chatbots!inner(workspace_id)
        `)
        .eq('chatbots.workspace_id', workspace.id);

      const totalConversations = conversations?.length || 0;
      const totalLeads = conversations?.filter(c => c.lead_captured).length || 0;
      const conversionRate = totalConversations > 0 ? (totalLeads / totalConversations) * 100 : 0;

      setStats({
        totalChatbots: chatbotsCount || 0,
        totalConversations,
        totalLeads,
        conversionRate
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply workspace branding
  const brandColor = workspace?.brand_color || '#3B82F6';
  const isWhiteLabeled = workspace?.white_label_enabled;
  const brandName = isWhiteLabeled ? (workspace?.agency_name || 'SupportBots') : 'SupportBots';
  const clientName = workspace?.client_name || 'Client';

  return (
    <div className="min-h-screen bg-background">
      {/* Custom Header with Branding */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {workspace?.logo_url ? (
                <img 
                  src={workspace.logo_url} 
                  alt={brandName}
                  className="h-8 w-auto"
                />
              ) : (
                <div 
                  className="h-8 w-8 rounded flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: brandColor }}
                >
                  {brandName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{brandName}</h1>
                {workspace?.client_name && (
                  <p className="text-sm text-muted-foreground">{workspace.client_name} Dashboard</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {workspace && (
                <Badge 
                  variant="secondary" 
                  style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
                >
                  {workspace.subscription_tier}
                </Badge>
              )}
              {!isWhiteLabeled && (
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                  Admin Dashboard →
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">
            Here's what's happening with your chatbots today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Chatbots</p>
                  <p className="text-3xl font-bold">{stats.totalChatbots}</p>
                </div>
                <Bot className="h-8 w-8 opacity-50" style={{ color: brandColor }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversations</p>
                  <p className="text-3xl font-bold">{stats.totalConversations}</p>
                </div>
                <MessageSquare className="h-8 w-8 opacity-50" style={{ color: brandColor }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Leads Generated</p>
                  <p className="text-3xl font-bold">{stats.totalLeads}</p>
                </div>
                <Target className="h-8 w-8 opacity-50" style={{ color: brandColor }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-3xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 opacity-50" style={{ color: brandColor }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Manage Chatbots
              </CardTitle>
              <CardDescription>
                Create, edit, and configure your chatbots
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active chatbots</span>
                <Badge variant="secondary">{stats.totalChatbots}</Badge>
              </div>
              <div className="flex gap-2">
                <Button asChild style={{ backgroundColor: brandColor }} className="text-white">
                  <Link to="/chatbots">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Chatbots
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/chatbots/create">
                    <Play className="mr-2 h-4 w-4" />
                    Create New
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics & Reports
              </CardTitle>
              <CardDescription>
                View detailed analytics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total conversations</span>
                <Badge variant="secondary">{stats.totalConversations}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link to="/analytics">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Analytics
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/leads">
                    <Users className="mr-2 h-4 w-4" />
                    View Leads
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* White Label Footer */}
        {isWhiteLabeled ? (
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 {workspace?.agency_name || brandName}. All rights reserved.
            </p>
          </div>
        ) : (
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Powered by <span className="font-semibold">SupportBots</span> • 
              <Link to="/pricing" className="ml-1 hover:underline">
                Upgrade your plan
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientPortal;