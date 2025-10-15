import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Pause, 
  Settings2, 
  MessageSquare, 
  Palette, 
  Code,
  Plus,
  TrendingUp,
  Trash2,
  Eye,
  Bot
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FlowBuilder } from '@/components/chatbot/FlowBuilder';
import { VideoAnalytics } from '@/components/video/VideoAnalytics';
import { VideoTemplateLibrary } from '@/components/templates/VideoTemplateLibrary';
import { ABTestDashboard } from '@/components/analytics/ABTestDashboard';
import { HeatMapVisualizer } from '@/components/analytics/HeatMapVisualizer';
import { ChatPreview } from '@/components/chatbot/ChatPreview';

interface Chatbot {
  id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'inactive';
  welcome_message: string;
  fallback_message: string;
  widget_config: any;
  ai_enabled: boolean;
  ai_model: string | null;
  ai_prompt: string | null;
  chatbot_type?: string;
  created_at: string;
  updated_at: string;
}

interface ChatbotMessage {
  id: string;
  message_key: string;
  message_text: string;
  message_type: 'text' | 'image' | 'file' | 'form' | 'button' | 'youtube_video' | 'uploaded_video' | 'video_intro';
  next_message_key: string | null;
  conditions: any;
  buttons: any;
  collect_lead_info: boolean;
  video_url?: string;
  video_thumbnail?: string;
  video_duration?: number;
  video_autoplay?: boolean;
  video_controls?: boolean;
}

const ChatbotEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('flow');
  const [previewOpen, setPreviewOpen] = useState(false);

  // Redirect to VideoFlowEditor if this is a video bot
  useEffect(() => {
    if (chatbot?.chatbot_type === 'video_bot') {
      navigate(`/chatbots/${id}/video-editor`);
    }
  }, [chatbot, id, navigate]);

  useEffect(() => {
    if (id) {
      fetchChatbot();
      fetchMessages();
    }
  }, [id]);

  const fetchChatbot = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setChatbot(data);
    } catch (error) {
      console.error('Error fetching chatbot:', error);
      toast({
        title: "Error",
        description: "Failed to load chatbot",
        variant: "destructive",
      });
      navigate('/chatbots');
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_messages')
        .select('*')
        .eq('chatbot_id', id)
        .order('created_at');

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!chatbot || !id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('chatbots')
        .update({
          name: chatbot.name,
          description: chatbot.description,
          welcome_message: chatbot.welcome_message,
          fallback_message: chatbot.fallback_message,
          widget_config: chatbot.widget_config,
          ai_enabled: chatbot.ai_enabled,
          ai_model: chatbot.ai_model,
          ai_prompt: chatbot.ai_prompt,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Chatbot updated successfully",
      });
    } catch (error) {
      console.error('Error saving chatbot:', error);
      toast({
        title: "Error",
        description: "Failed to save chatbot",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!chatbot || !id) return;

    const newStatus = chatbot.status === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('chatbots')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setChatbot(prev => prev ? { ...prev, status: newStatus } : null);
      
      toast({
        title: "Success",
        description: `Chatbot ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update chatbot status",
        variant: "destructive",
      });
    }
  };

  const getEmbedCode = () => {
    return `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/widget.js';
    script.setAttribute('data-chatbot-id', '${id}');
    document.head.appendChild(script);
  })();
</script>`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(getEmbedCode());
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading chatbot editor...</div>
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Chatbot not found</h2>
          <Link to="/chatbots">
            <Button>Back to Chatbots</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/chatbots" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">{chatbot.name}</h1>
                <p className="text-sm text-muted-foreground">
                  Chatbot Editor
                </p>
              </div>
              <Badge className={
                chatbot.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                chatbot.status === 'inactive' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
              }>
                {chatbot.status.charAt(0).toUpperCase() + chatbot.status.slice(1)}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(!previewOpen)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStatusToggle}
              >
                {chatbot.status === 'active' ? (
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
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Editor Panel */}
        <div className={`${previewOpen ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b px-4">
              <TabsList className="grid w-full max-w-md grid-cols-5">
                <TabsTrigger value="flow" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Flow
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="design" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Design
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="embed" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Embed
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="flow" className="h-full p-0 m-0">
              <FlowBuilder 
                chatbotId={id!}
                messages={messages}
                onMessagesUpdate={setMessages}
              />
            </TabsContent>

            <TabsContent value="settings" className="p-4 space-y-6 overflow-y-auto h-full">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Settings</CardTitle>
                  <CardDescription>Configure your chatbot's basic information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Bot Name</Label>
                    <Input
                      id="name"
                      value={chatbot.name}
                      onChange={(e) => setChatbot(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={chatbot.description || ''}
                      onChange={(e) => setChatbot(prev => prev ? { ...prev, description: e.target.value } : null)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="welcome">Welcome Message</Label>
                    <Textarea
                      id="welcome"
                      value={chatbot.welcome_message}
                      onChange={(e) => setChatbot(prev => prev ? { ...prev, welcome_message: e.target.value } : null)}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fallback">Fallback Message</Label>
                    <Textarea
                      id="fallback"
                      value={chatbot.fallback_message}
                      onChange={(e) => setChatbot(prev => prev ? { ...prev, fallback_message: e.target.value } : null)}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {chatbot.ai_enabled && (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Configuration</CardTitle>
                    <CardDescription>Configure AI-powered responses</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai_model">AI Model</Label>
                      <select
                        id="ai_model"
                        className="w-full px-3 py-2 border border-input bg-background rounded-md"
                        value={chatbot.ai_model || 'gpt-3.5-turbo'}
                        onChange={(e) => setChatbot(prev => prev ? { ...prev, ai_model: e.target.value } : null)}
                      >
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ai_prompt">System Prompt</Label>
                      <Textarea
                        id="ai_prompt"
                        placeholder="You are a helpful customer support assistant..."
                        value={chatbot.ai_prompt || ''}
                        onChange={(e) => setChatbot(prev => prev ? { ...prev, ai_prompt: e.target.value } : null)}
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="design" className="p-4 space-y-6 overflow-y-auto h-full">
              <Card>
                <CardHeader>
                  <CardTitle>Widget Appearance</CardTitle>
                  <CardDescription>Customize how your chatbot widget looks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={chatbot.widget_config?.color || '#3B82F6'}
                        onChange={(e) => setChatbot(prev => prev ? {
                          ...prev,
                          widget_config: { ...prev.widget_config, color: e.target.value }
                        } : null)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={chatbot.widget_config?.color || '#3B82F6'}
                        onChange={(e) => setChatbot(prev => prev ? {
                          ...prev,
                          widget_config: { ...prev.widget_config, color: e.target.value }
                        } : null)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Widget Position</Label>
                    <select
                      id="position"
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                      value={chatbot.widget_config?.position || 'bottom-right'}
                      onChange={(e) => setChatbot(prev => prev ? {
                        ...prev,
                        widget_config: { ...prev.widget_config, position: e.target.value }
                      } : null)}
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="top-left">Top Left</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          <Tabs defaultValue="templates" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="templates">Video Templates</TabsTrigger>
              <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
              <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
              <TabsTrigger value="heatmaps">Interaction Heatmaps</TabsTrigger>
            </TabsList>

            <TabsContent value="templates">
              <VideoTemplateLibrary
                onTemplateSelect={(template) => {
                  // Handle template selection
                  console.log('Selected template:', template);
                }}
                onPreview={(template) => {
                  // Handle template preview
                  console.log('Preview template:', template);
                }}
              />
            </TabsContent>

            <TabsContent value="analytics">
              <VideoAnalytics chatbotId={id!} />
            </TabsContent>

            <TabsContent value="ab-testing">
              <ABTestDashboard chatbotId={id!} workspaceId="workspace-id" />
            </TabsContent>

            <TabsContent value="heatmaps">
              <HeatMapVisualizer chatbotId={id!} />
            </TabsContent>
          </Tabs>

            <TabsContent value="embed" className="p-4 space-y-6 overflow-y-auto h-full">
              <Card>
                <CardHeader>
                  <CardTitle>Embed Code</CardTitle>
                  <CardDescription>
                    Copy this code and paste it into your website's HTML
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                        <code>{getEmbedCode()}</code>
                      </pre>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={copyEmbedCode} className="flex-1">
                        Copy Embed Code
                      </Button>
                      <Link to={`/embed-demo?id=${id}`}>
                        <Button variant="outline">
                          Test Widget
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Installation Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">1. Copy the embed code above</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the copy button to copy the embed code to your clipboard.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">2. Paste before closing &lt;/body&gt; tag</h4>
                    <p className="text-sm text-muted-foreground">
                      Paste the code just before the closing &lt;/body&gt; tag on every page where you want the chatbot to appear.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">3. Activate your bot</h4>
                    <p className="text-sm text-muted-foreground">
                      Make sure your bot status is set to "Active" for it to appear on your website.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        {previewOpen && (
          <div className="w-1/3 border-l border-border">
            <ChatPreview 
              chatbot={chatbot}
              messages={messages}
              onClose={() => setPreviewOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatbotEditor;