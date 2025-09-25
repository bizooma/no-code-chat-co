import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Bot, Settings, Copy, Play, Pause, Trash2, MoreHorizontal } from 'lucide-react';
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
}

const Chatbots = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatbots();
  }, []);

  const fetchChatbots = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
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
    const embedCode = `<script src="https://supportbots.dev/embed/${botId}"></script>`;
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
          <Link to="/chatbots/create">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create New Bot</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {chatbots.length === 0 ? (
          // Empty State
          <Card className="text-center py-12">
            <CardContent>
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">No chatbots yet</CardTitle>
              <CardDescription className="mb-4">
                Create your first chatbot to get started with lead generation and customer support.
              </CardDescription>
              <Link to="/chatbots/create">
                <Button className="flex items-center space-x-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Bot</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          // Chatbots Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chatbots.map((bot) => (
              <Card key={bot.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{bot.name}</CardTitle>
                      {bot.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {bot.description}
                        </CardDescription>
                      )}
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
                    <Link to={`/chatbots/${bot.id}/editor`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    <Link to={`/chatbots/${bot.id}/analytics`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Bot className="mr-2 h-4 w-4" />
                        Analytics
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Chatbots;