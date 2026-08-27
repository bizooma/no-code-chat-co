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
import { EMBED_ORIGIN } from '@/lib/embed';
import AvatarChatbot from '@/components/avatar/AvatarChatbot';
import { FloatingAvatarWidget } from '@/components/avatar/FloatingAvatarWidget';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KnowledgeBaseManager } from '@/components/avatar/KnowledgeBaseManager';

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
    presenter_id: 'anna_public_3_20240108',
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
        presenter_id: (data as any).presenter_id || 'anna_public_3_20240108',
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
    if (!user) return;

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
      // Ensure workspace exists (create a default one if needed)
      let workspaceId = currentWorkspace?.id as string | null | undefined;

      if (!workspaceId) {
        const { data: newWs, error: wsError } = await supabase
          .from('workspaces')
          .insert([{ name: 'My Workspace', owner_id: user.id }])
          .select()
          .single();
        if (wsError) throw wsError;
        workspaceId = newWs.id;
      }

      const dataToSave = {
        ...formData,
        workspace_id: workspaceId,
        user_id: user.id,
      };

      let chatbotId = id;

      if (id) {
        // Update existing
        const { error } = await supabase
          .from('avatar_chatbots')
          .update(dataToSave)
          .eq('id', id);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('avatar_chatbots')
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;
        chatbotId = data.id;
        
        navigate(`/avatar-chatbots/${data.id}/editor`);
      }

      // Create or update D-ID agent
      console.log('Creating D-ID agent for chatbot:', chatbotId);
      const { data: agentData, error: agentError } = await supabase.functions.invoke(
        'create-did-agent',
        {
          body: {
            chatbotId,
            name: formData.name,
            presenterId: formData.presenter_id,
            voiceId: formData.voice_id,
            llmModel: formData.llm_model,
            systemPrompt: formData.system_prompt,
            knowledgeBase: formData.knowledge_base
          }
        }
      );

      if (agentError) {
        console.error('Failed to create D-ID agent:', agentError);
        toast({
          title: 'Warning',
          description: 'Chatbot saved but D-ID agent creation failed. Please try saving again.',
          variant: 'destructive',
        });
      } else {
        console.log('D-ID agent created successfully:', agentData);
        toast({
          title: 'Success',
          description: 'Avatar chatbot and D-ID agent saved successfully',
        });
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
          {id && <TabsTrigger value="embed">Embed</TabsTrigger>}
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
                <Label htmlFor="presenter_id">Presenter ID</Label>
                <Input
                  id="presenter_id"
                  value={formData.presenter_id}
                  onChange={(e) => setFormData({ ...formData, presenter_id: e.target.value })}
                  placeholder="anna_public_3_20240108"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a valid D-ID presenter ID (e.g., amy-Aq6OmGZnMt)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voice_id">Voice ID</Label>
                <Input
                  id="voice_id"
                  value={formData.voice_id}
                  onChange={(e) => setFormData({ ...formData, voice_id: e.target.value })}
                  placeholder="9BWtsMINqrJLrRacOk9x"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a valid ElevenLabs voice ID (e.g., 9BWtsMINqrJLrRacOk9x for Aria)
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
                <Label>Knowledge Base</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Train your bot with documents, URLs, or manual text
                </p>
                {id && <KnowledgeBaseManager chatbotId={id} />}
                {!id && (
                  <p className="text-sm text-muted-foreground p-4 border rounded-lg">
                    Save the chatbot first to add knowledge sources
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {id && (
          <TabsContent value="preview" className="min-h-[600px] relative overflow-hidden">
            {/* Mock Website Layout */}
            <div className="absolute inset-0 bg-background">
              {/* Mock Header */}
              <div className="border-b bg-card px-6 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded" />
                    <span className="font-semibold text-lg">Your Website</span>
                  </div>
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <span>Home</span>
                    <span>About</span>
                    <span>Services</span>
                    <span>Contact</span>
                  </div>
                </div>
              </div>

              {/* Mock Hero Section */}
              <div className="px-6 py-16 bg-gradient-to-br from-primary/10 to-primary/5">
                <div className="max-w-7xl mx-auto">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Welcome to Our Website
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mb-8">
                    This is a preview of how your AI chatbot will appear on your website. 
                    The floating button in the bottom-right corner is your live chatbot.
                  </p>
                  <div className="flex gap-4">
                    <div className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium">
                      Get Started
                    </div>
                    <div className="px-6 py-3 border rounded-lg font-medium">
                      Learn More
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Content Section */}
              <div className="px-6 py-12">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-card border rounded-lg">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg mb-4" />
                    <h3 className="font-semibold mb-2">Feature One</h3>
                    <p className="text-sm text-muted-foreground">
                      Your chatbot is always available to help visitors.
                    </p>
                  </div>
                  <div className="p-6 bg-card border rounded-lg">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg mb-4" />
                    <h3 className="font-semibold mb-2">Feature Two</h3>
                    <p className="text-sm text-muted-foreground">
                      Instant responses to common questions.
                    </p>
                  </div>
                  <div className="p-6 bg-card border rounded-lg">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg mb-4" />
                    <h3 className="font-semibold mb-2">Feature Three</h3>
                    <p className="text-sm text-muted-foreground">
                      Collect leads while you sleep.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Avatar Widget */}
            <FloatingAvatarWidget chatbotId={id} />
          </TabsContent>
        )}

        {id && (
          <TabsContent value="embed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Embed Code</CardTitle>
                <CardDescription>
                  Copy this code and paste it into your website's HTML, just before the closing &lt;/body&gt; tag. The chatbot will appear as a floating button in the bottom-right corner.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <code>{getAvatarEmbedCode()}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      navigator.clipboard.writeText(getAvatarEmbedCode());
                      toast({
                        title: 'Copied!',
                        description: 'Embed code copied to clipboard',
                      });
                    }}
                  >
                    Copy
                  </Button>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Installation Instructions</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Copy the embed code above</li>
                    <li>Paste it into your website's HTML, just before the closing &lt;/body&gt; tag</li>
                    <li>Save and publish your website</li>
                    <li>A floating chat button will appear in the bottom-right corner of your website</li>
                    <li>Visitors can click the button to start chatting with your AI avatar</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AvatarChatbotEditor;
