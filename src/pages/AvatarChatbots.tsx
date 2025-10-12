import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Plus, Video, Edit, Trash2, Play } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AvatarChatbots = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (currentWorkspace) {
      fetchChatbots();
    }
  }, [currentWorkspace]);

  const fetchChatbots = async () => {
    if (!currentWorkspace) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('avatar_chatbots')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChatbots(data || []);
    } catch (error) {
      console.error('Error fetching avatar chatbots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load avatar chatbots',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('avatar_chatbots')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Avatar chatbot deleted successfully',
      });

      fetchChatbots();
    } catch (error) {
      console.error('Error deleting chatbot:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete avatar chatbot',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Avatar Chatbots</h1>
          <p className="text-muted-foreground mt-1">
            Manage your AI-powered video avatar chatbots
          </p>
        </div>
        <Button onClick={() => navigate('/avatar-chatbots/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Avatar Chatbot
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading avatar chatbots...</p>
        </div>
      ) : chatbots.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Video className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No Avatar Chatbots Yet</h3>
                <p className="text-muted-foreground mt-1">
                  Create your first avatar chatbot to get started with AI-powered video conversations
                </p>
              </div>
              <Button onClick={() => navigate('/avatar-chatbots/create')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Avatar Chatbot
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatbots.map((chatbot) => (
            <Card key={chatbot.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      {chatbot.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {chatbot.system_prompt ? (
                        chatbot.system_prompt.substring(0, 100) + (chatbot.system_prompt.length > 100 ? '...' : '')
                      ) : (
                        'No description'
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant={chatbot.is_active ? 'default' : 'secondary'}>
                    {chatbot.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Avatar:</strong> {chatbot.avatar_id}</p>
                  <p><strong>Voice:</strong> {chatbot.voice_id}</p>
                  <p><strong>Model:</strong> {chatbot.llm_model}</p>
                  <p className="text-xs">
                    Created {new Date(chatbot.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/avatar-chatbots/${chatbot.id}/preview`)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/avatar-chatbots/${chatbot.id}/editor`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(chatbot.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this avatar chatbot and all its conversations.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AvatarChatbots;
