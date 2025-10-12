import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import AvatarChatbot from '@/components/avatar/AvatarChatbot';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AvatarChatbotEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    avatar_id: 'anna_public_3_20240108',
    voice_id: 'af9a42ce26594cbcae8c01b33b1f473b', // Default English voice
    llm_model: 'gpt-4o-mini',
    system_prompt: 'You are a helpful AI assistant. Keep your responses concise and conversational, suitable for being spoken by a video avatar.',
    knowledge_base: '',
    is_active: true,
  });

  useEffect(() => {
    if (id) {
      fetchChatbot();
    }
  }, [id]);

  const fetchChatbot = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('avatar_chatbots')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setFormData({
        name: data.name,
        avatar_id: data.avatar_id,
        voice_id: data.voice_id,
        llm_model: data.llm_model,
        system_prompt: data.system_prompt || '',
        knowledge_base: data.knowledge_base || '',
        is_active: data.is_active,
      });
    } catch (error) {
      console.error('Error fetching chatbot:', error);
      toast({
        title: 'Error',
        description: 'Failed to load avatar chatbot',
        variant: 'destructive',
      });
      navigate('/avatar-chatbots');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !currentWorkspace) return;

    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a name for your avatar chatbot',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        workspace_id: currentWorkspace.id,
        user_id: user.id,
      };

      if (id) {
        // Update existing
        const { error } = await supabase
          .from('avatar_chatbots')
          .update(dataToSave)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Avatar chatbot updated successfully',
        });
      } else {
        // Create new
        const { data, error } = await supabase
          .from('avatar_chatbots')
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Avatar chatbot created successfully',
        });

        navigate(`/avatar-chatbots/${data.id}/editor`);
      }
    } catch (error) {
      console.error('Error saving chatbot:', error);
      toast({
        title: 'Error',
        description: 'Failed to save avatar chatbot',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/avatar-chatbots')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {id ? 'Edit Avatar Chatbot' : 'Create Avatar Chatbot'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure your AI-powered video avatar
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          {id && <TabsTrigger value="preview">Preview</TabsTrigger>}
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Configure the basic settings for your avatar chatbot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Chatbot Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Avatar Assistant"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable this avatar chatbot
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avatar & Voice Configuration</CardTitle>
              <CardDescription>Select the avatar and voice for your chatbot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="avatar_id">Avatar ID</Label>
                <Input
                  id="avatar_id"
                  value={formData.avatar_id}
                  onChange={(e) => setFormData({ ...formData, avatar_id: e.target.value })}
                  placeholder="anna_public_3_20240108"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a valid HeyGen avatar ID
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voice_id">Voice ID</Label>
                <Input
                  id="voice_id"
                  value={formData.voice_id}
                  onChange={(e) => setFormData({ ...formData, voice_id: e.target.value })}
                  placeholder="af9a42ce26594cbcae8c01b33b1f473b"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a valid HeyGen voice ID
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>Configure the AI model and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="llm_model">LLM Model</Label>
                <Select
                  value={formData.llm_model}
                  onValueChange={(value) => setFormData({ ...formData, llm_model: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (Recommended)</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system_prompt">System Prompt</Label>
                <Textarea
                  id="system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  placeholder="You are a helpful AI assistant..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Define how the AI should behave and respond
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="knowledge_base">Knowledge Base (Optional)</Label>
                <Textarea
                  id="knowledge_base"
                  value={formData.knowledge_base}
                  onChange={(e) => setFormData({ ...formData, knowledge_base: e.target.value })}
                  placeholder="Add custom knowledge or context for the AI..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Provide additional context or information for the AI to reference
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {id && (
          <TabsContent value="preview">
            <AvatarChatbot chatbotId={id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AvatarChatbotEditor;
