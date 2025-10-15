import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Bot, Users, BarChart3, Bell, Settings, Target, Crown, Building2, Palette, Home, Video, MessageSquare, GitBranch, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import WorkspaceSwitcher from '@/components/WorkspaceSwitcher';
import { useDashboardStats, useRecentChatbots, useRecentLeads } from '@/hooks/useDashboardStats';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { user, signOut, isPlatformOwner, subscription } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const { data: stats, isLoading: statsLoading } = useDashboardStats(currentWorkspace?.id);
  const { data: recentBots, isLoading: botsLoading } = useRecentChatbots(currentWorkspace?.id, 5);
  const { data: recentLeads, isLoading: leadsLoading } = useRecentLeads(currentWorkspace?.id, 5);

  const brandColor = currentWorkspace?.brand_color || '#3B82F6';
  const isWhiteLabeled = currentWorkspace?.white_label_enabled;
  const brandName = isWhiteLabeled ? (currentWorkspace?.agency_name || 'SupportBots') : 'SupportBots';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              {currentWorkspace?.logo_url && !isWhiteLabeled ? (
                <img 
                  src={currentWorkspace.logo_url} 
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
              <h1 className="text-xl font-bold">{isWhiteLabeled ? brandName : 'SupportBots.dev'}</h1>
            </div>
            
            <WorkspaceSwitcher />
            
            {currentWorkspace && (
              <div className="flex items-center gap-2">
                {currentWorkspace.white_label_enabled && (
                  <Badge variant="outline" className="gap-1">
                    <Crown className="w-3 h-3" />
                    White Label
                  </Badge>
                )}
                <Badge variant="secondary">
                  {currentWorkspace.subscription_tier}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.user_metadata?.full_name || user?.email}
            </span>
            {subscription?.subscribed && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {subscription.tier === 'professional' ? 'Pro' : 
                 subscription.tier === 'enterprise' ? 'Enterprise' : 'Pro'}
              </Badge>
            )}
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your chatbots and view analytics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalBots ?? 0}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {stats?.standardBots ? (
                      <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {stats.standardBots} ChatFlow
                      </Badge>
                    ) : null}
                    {stats?.videoBots ? (
                      <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                        <GitBranch className="h-3 w-3 mr-1" />
                        {stats.videoBots} VideoFlow
                      </Badge>
                    ) : null}
                    {stats?.avatarBots ? (
                      <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {stats.avatarBots} AvatarFlow
                      </Badge>
                    ) : null}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalLeads ?? 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalLeads === 0 ? 'No leads collected yet' : 
                     stats?.totalLeads === 1 ? '1 lead captured' : 
                     `${stats?.totalLeads} leads captured`}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalConversations ?? 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalConversations === 0 ? 'No conversations yet' : 
                     stats?.totalConversations === 1 ? '1 conversation' : 
                     `${stats?.totalConversations} total conversations`}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status */}
        {!subscription?.subscribed && !isPlatformOwner && (
          <Card className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Crown className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold">Upgrade to unlock more features</h3>
                    <p className="text-muted-foreground">
                      Get unlimited chatbots, advanced analytics, and priority support
                    </p>
                  </div>
                </div>
                <Link to="/pricing">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Crown className="mr-2 h-4 w-4" />
                    View Plans
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {subscription?.subscribed && (
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Crown className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold">
                      {subscription.tier === 'professional' ? 'SupportBots Professional' : 
                       subscription.tier === 'enterprise' ? 'SupportBots Enterprise' : 'Premium Plan'}
                    </h3>
                    <p className="text-muted-foreground">
                      {subscription.subscription_end && 
                        `Renews on ${new Date(subscription.subscription_end).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <Link to="/pricing">
                  <Button variant="outline">
                    Manage Subscription
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
        {isPlatformOwner && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-6">Platform Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    Manage platform users and their roles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/user-management">
                    <Button className="w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Workspace Management
                  </CardTitle>
                  <CardDescription>
                    Manage client workspaces and agency settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/workspaces">
                    <Button className="w-full">
                      <Building2 className="mr-2 h-4 w-4" />
                      Manage Workspaces
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Platform Notifications
                  </CardTitle>
                  <CardDescription>
                    Send notifications to all platform users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/platform-notifications">
                    <Button className="w-full">
                      <Bell className="mr-2 h-4 w-4" />
                      Manage Notifications
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Create Your Bot Section */}
        <div className="mb-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-foreground mb-2">Create Your Bot</h3>
            <p className="text-muted-foreground">Choose the perfect bot type for your business needs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ChatFlow Card */}
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-background">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl flex items-center gap-2">
                  ChatFlow
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    Text-Based
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Perfect for FAQ, lead capture, and customer support
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5" />
                    <span className="text-muted-foreground">Quick setup with templates</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5" />
                    <span className="text-muted-foreground">Customizable conversation flows</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5" />
                    <span className="text-muted-foreground">Lead collection forms</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5" />
                    <span className="text-muted-foreground">Multi-channel deployment</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">BEST FOR</p>
                  <p className="text-sm">Customer support, Lead generation, Product info</p>
                </div>
                
                <Link to="/chatbots/create" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Create ChatFlow Bot
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* VideoFlow Card */}
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-background">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-4">
                  <GitBranch className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-xl flex items-center gap-2">
                  VideoFlow
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                    Interactive
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Engage visitors with branching video experiences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-1.5" />
                    <span className="text-muted-foreground">Visual flow builder</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-1.5" />
                    <span className="text-muted-foreground">Conditional video paths</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-1.5" />
                    <span className="text-muted-foreground">Interactive decision points</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-1.5" />
                    <span className="text-muted-foreground">Advanced analytics & heatmaps</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">BEST FOR</p>
                  <p className="text-sm">Product demos, Training, Interactive tours</p>
                </div>
                
                <Link to="/templates" className="block">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    Create VideoFlow Bot
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* AvatarFlow Card */}
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-green-200 dark:border-green-900 bg-gradient-to-br from-green-50/50 to-white dark:from-green-950/20 dark:to-background">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl flex items-center gap-2">
                  AvatarFlow
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                    AI Avatar
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Realistic AI avatars powered by HeyGen/D-ID
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-1.5" />
                    <span className="text-muted-foreground">Natural conversations with AI</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-1.5" />
                    <span className="text-muted-foreground">Lifelike video avatars</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-1.5" />
                    <span className="text-muted-foreground">Knowledge base integration</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-1.5" />
                    <span className="text-muted-foreground">Real-time responses</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">BEST FOR</p>
                  <p className="text-sm">Sales pitches, Consultations, Virtual assistants</p>
                </div>
                
                <Link to="/avatar-chatbots/create" className="block">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Create AvatarFlow Bot
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions - Simplified */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <Link to="/chatbots">
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                <Bot className="h-5 w-5" />
                <span className="text-sm font-medium">Manage Bots</span>
              </Button>
            </Link>
            <Link to="/analytics">
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <span className="text-sm font-medium">Analytics</span>
              </Button>
            </Link>
            <Link to="/leads">
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">Leads</span>
              </Button>
            </Link>
            <Link to="/lead-integrations">
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                <Target className="h-5 w-5" />
                <span className="text-sm font-medium">Integrations</span>
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                <Crown className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {subscription?.subscribed ? 'Manage Plan' : 'Upgrade'}
                </span>
              </Button>
            </Link>
          </div>
        </div>
          <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground">My Bots</h3>
            <Button variant="outline" size="sm" asChild>
              <Link to="/chatbots">
                View All Bots →
              </Link>
            </Button>
          </div>

          {botsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentBots && recentBots.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentBots.map((bot) => (
                  <Card key={bot.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {bot.type === 'avatar' ? (
                              <>
                                <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                  <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                {bot.name}
                              </>
                            ) : bot.type === 'video' ? (
                              <>
                                <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                  <GitBranch className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                {bot.name}
                              </>
                            ) : (
                              <>
                                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                  <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                {bot.name}
                              </>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-2 flex items-center gap-2">
                            {bot.type === 'avatar' ? (
                              <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AvatarFlow Bot
                              </Badge>
                            ) : bot.type === 'video' ? (
                              <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                                <GitBranch className="h-3 w-3 mr-1" />
                                VideoFlow Bot
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                ChatFlow Bot
                              </Badge>
                            )}
                          </CardDescription>
                        </div>
                        <Badge variant={bot.status === 'published' || bot.status === 'active' ? 'default' : 'secondary'}>
                          {bot.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link to={bot.type === 'avatar' ? `/avatar-chatbots/${bot.id}` : `/chatbots/${bot.id}`}>
                            <Settings className="mr-2 h-3 w-3" />
                            Edit
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link to="/analytics">
                            <BarChart3 className="mr-2 h-3 w-3" />
                            Analytics
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link to="/chatbots" className="text-primary hover:underline text-sm">
                  View all chatbots →
                </Link>
              </div>
            </>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="mb-2">No bots yet</CardTitle>
                <CardDescription className="mb-6">
                  Choose from our 3 bot types to get started with lead generation and customer support
                </CardDescription>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  <Link to="/chatbots/create">
                    <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                      <span className="font-semibold">ChatFlow</span>
                      <span className="text-xs text-muted-foreground">Text-based chatbot</span>
                    </Button>
                  </Link>
                  <Link to="/templates">
                    <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300">
                      <GitBranch className="h-6 w-6 text-purple-600" />
                      <span className="font-semibold">VideoFlow</span>
                      <span className="text-xs text-muted-foreground">Interactive video</span>
                    </Button>
                  </Link>
                  <Link to="/avatar-chatbots/create">
                    <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-300">
                      <Sparkles className="h-6 w-6 text-green-600" />
                      <span className="font-semibold">AvatarFlow</span>
                      <span className="text-xs text-muted-foreground">AI video avatar</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Leads Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground">Recent Leads</h3>
            <Button variant="outline" size="sm" asChild>
              <Link to="/leads">
                View All Leads →
              </Link>
            </Button>
          </div>
          
          {leadsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentLeads && recentLeads.length > 0 ? (
            <>
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <Card key={lead.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">
                              {lead.name || 'Anonymous'}
                            </h4>
                            <Badge variant={
                              lead.status === 'new' ? 'default' : 
                              lead.status === 'contacted' ? 'secondary' : 
                              'outline'
                            }>
                              {lead.status}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {lead.email && (
                              <p className="flex items-center gap-2">
                                <Users className="h-3 w-3" />
                                {lead.email}
                              </p>
                            )}
                            {lead.phone && <p>📞 {lead.phone}</p>}
                            {lead.company && <p>🏢 {lead.company}</p>}
                            {lead.chatbot_name && (
                              <p className="flex items-center gap-2">
                                <Bot className="h-3 w-3" />
                                From: {lead.chatbot_name}
                              </p>
                            )}
                            <p className="text-xs">
                              {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/leads">
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link to="/leads" className="text-primary hover:underline text-sm">
                  View all leads →
                </Link>
              </div>
            </>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="mb-2">No leads yet</CardTitle>
                <CardDescription>
                  Leads collected by your chatbots will appear here.
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;