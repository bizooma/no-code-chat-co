import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Bot, Settings, Copy, Play, Pause, Trash2, MoreHorizontal, Video, MessageSquare, Film, GitBranch, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Chatbot {
  id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  workspace_id: string;
  chatbot_type: string | null;
  video_config: any;
}

const Chatbots = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'standard' | 'video' | 'avatar'>('all');

  useEffect(() => {
    fetchChatbots();
  }, [currentWorkspace]);

  const fetchChatbots = async () => {
    if (!currentWorkspace?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChatbots(data || []);
    } catch (error) {
      console.error('Error fetching chatbots:', error);
      toast({
        title: "Error",
        description: "Failed to load chatbots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (botId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('chatbots')
        .update({ status: newStatus })
        .eq('id', botId);

      if (error) throw error;
      
      setChatbots(prev => prev.map(bot => 
        bot.id === botId ? { ...bot, status: newStatus as 'active' | 'inactive' } : bot
      ));
      
      toast({
        title: "Success",
        description: `Chatbot ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error updating chatbot status:', error);
      toast({
        title: "Error",
        description: "Failed to update chatbot status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (botId: string) => {
    try {
      const { error } = await supabase
        .from('chatbots')
        .delete()
        .eq('id', botId);

      if (error) throw error;
      
      setChatbots(prev => prev.filter(bot => bot.id !== botId));
      
      toast({
        title: "Success",
        description: "Chatbot deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting chatbot:', error);
      toast({
        title: "Error",
        description: "Failed to delete chatbot",
        variant: "destructive",
      });
    }
  };

  const copyEmbedCode = (botId: string) => {
    const embedCode = `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/widget.js';
    script.setAttribute('data-chatbot-id', '${botId}');
    document.head.appendChild(script);
  })();
</script>`;
    navigator.clipboard.writeText(embedCode);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getBotType = (bot: Chatbot): 'standard' | 'video' | 'avatar' => {
    if (bot.chatbot_type === 'video_bot') return 'video';
    if (bot.chatbot_type === 'avatar_bot') return 'avatar';
    return 'standard';
  };

  const getVideoThumbnail = (bot: Chatbot): string | null => {
    if (bot.chatbot_type === 'video_bot' && bot.video_config?.preview_thumbnail) {
      return bot.video_config.preview_thumbnail;
    }
    return null;
  };

  const filteredBots = chatbots.filter(bot => {
    if (filterType === 'all') return true;
    return getBotType(bot) === filterType;
  });

  const botCounts = {
    all: chatbots.length,
    standard: chatbots.filter(b => getBotType(b) === 'standard').length,
    video: chatbots.filter(b => getBotType(b) === 'video').length,
    avatar: chatbots.filter(b => getBotType(b) === 'avatar').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading chatbots...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-foreground">My Chatbots</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/templates">
              <Button variant="outline">
                <Film className="mr-2 h-4 w-4" />
                Video Templates
              </Button>
            </Link>
            <Link to="/chatbots/create">
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create New Bot</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              All ({botCounts.all})
            </TabsTrigger>
            <TabsTrigger value="standard">
              <MessageSquare className="h-4 w-4 mr-2" />
              ChatFlow ({botCounts.standard})
            </TabsTrigger>
            <TabsTrigger value="video">
              <GitBranch className="h-4 w-4 mr-2" />
              VideoFlow ({botCounts.video})
            </TabsTrigger>
            <TabsTrigger value="avatar">
              <Sparkles className="h-4 w-4 mr-2" />
              AvatarFlow ({botCounts.avatar})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredBots.length === 0 ? (
          // Empty State
          <Card className="text-center py-12">
            <CardContent>
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">
                {filterType === 'all' ? 'No chatbots yet' : `No ${filterType} bots yet`}
              </CardTitle>
              <CardDescription className="mb-4">
                {filterType === 'video' 
                  ? 'Create an interactive video bot to engage your visitors with guided video flows.'
                  : 'Create your first chatbot to get started with lead generation and customer support.'}
              </CardDescription>
              <div className="flex gap-2 justify-center">
                {filterType === 'video' && (
                  <Link to="/templates">
                    <Button variant="outline" className="flex items-center space-x-2">
                      <Film className="h-4 w-4" />
                      <span>Browse Video Templates</span>
                    </Button>
                  </Link>
                )}
                <Link to="/chatbots/create">
                  <Button className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Create Your First Bot</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Chatbots Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBots.map((bot) => {
              const botType = getBotType(bot);
              const thumbnail = getVideoThumbnail(bot);
              
              return (
                <Card key={bot.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  {thumbnail && (
                    <div className="relative w-full h-40 bg-muted">
                      <img 
                        src={thumbnail} 
                        alt={bot.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-purple-600/90 backdrop-blur text-white">
                          <GitBranch className="h-3 w-3 mr-1" />
                          VideoFlow
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate flex items-center gap-2">
                          {botType === 'video' ? (
                            <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                              <GitBranch className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                          ) : botType === 'avatar' ? (
                            <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                              <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                          {bot.name}
                        </CardTitle>
                        {bot.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {bot.description}
                          </CardDescription>
                        )}
                        <div className="flex gap-2 mt-2">
                          {botType === 'video' && (
                            <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                              <GitBranch className="h-3 w-3 mr-1" />
                              VideoFlow Bot
                            </Badge>
                          )}
                          {botType === 'avatar' && (
                            <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AvatarFlow Bot
                            </Badge>
                          )}
                          {botType === 'standard' && (
                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              ChatFlow Bot
                            </Badge>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
                          <DropdownMenuItem onClick={() => copyEmbedCode(bot.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Embed Code
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusToggle(bot.id, bot.status)}>
                            {bot.status === 'active' ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Chatbot</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{bot.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(bot.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className={getStatusColor(bot.status)}>
                        {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(bot.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link 
                        to={botType === 'video' ? `/chatbots/${bot.id}/video-editor` : `/chatbots/${bot.id}/editor`} 
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Settings className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                      <Link to={`/analytics?chatbot_id=${bot.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Bot className="mr-2 h-4 w-4" />
                          Analytics
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Chatbots;
