import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Bot, Sparkles, MessageSquare, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface ChatbotTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  preview_image: string | null;
  template_config: any;
}

interface Workspace {
  id: string;
  name: string;
}

const CreateChatbot = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [templates, setTemplates] = useState<ChatbotTemplate[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    workspace_id: '',
    welcome_message: 'Hello! How can I help you today?',
    ai_enabled: false,
    ai_model: 'gpt-3.5-turbo',
    template_id: '',
    chatbot_type: 'standard' as 'standard' | 'video_bot',
    widget_config: {
      color: '#3B82F6',
      position: 'bottom-right'
    }
  });

  useEffect(() => {
    fetchTemplates();
    fetchWorkspaces();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_templates')
        .select('*')
        .eq('is_active', true)
        .order('category');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setWorkspaces(data || []);
      
      // Auto select first workspace if only one exists
      if (data?.length === 1) {
        setFormData(prev => ({ ...prev, workspace_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a bot name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.workspace_id) {
      toast({
        title: "Error", 
        description: "Please select a workspace",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chatbots')
        .insert({
          name: formData.name,
          description: formData.description || null,
          workspace_id: formData.workspace_id,
          created_by: user?.id,
          welcome_message: formData.welcome_message,
          ai_enabled: formData.ai_enabled,
          ai_model: formData.ai_enabled ? formData.ai_model : null,
          widget_config: formData.widget_config,
          chatbot_type: formData.chatbot_type,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Chatbot created successfully",
      });

      // Navigate to editor
      navigate(`/chatbots/${data.id}/editor`);
    } catch (error) {
      console.error('Error creating chatbot:', error);
      toast({
        title: "Error",
        description: "Failed to create chatbot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, ChatbotTemplate[]>);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Choose Bot Type</CardTitle>
              <CardDescription>
                Select the type of chatbot you want to create
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                    formData.chatbot_type === 'standard' ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, chatbot_type: 'standard' }))}
                >
                  <CardContent className="p-6">
                    <MessageSquare className="h-12 w-12 text-primary mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Standard Bot</h3>
                    <p className="text-sm text-muted-foreground">
                      Text-based chatbot with AI capabilities and flow builder
                    </p>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                    formData.chatbot_type === 'video_bot' ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, chatbot_type: 'video_bot' }))}
                >
                  <CardContent className="p-6">
                    <Bot className="h-12 w-12 text-primary mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Video Bot</h3>
                    <p className="text-sm text-muted-foreground">
                      Interactive video bot with conditional logic and branching
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Let's start with the basics for your new chatbot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Bot Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Support Bot, Sales Assistant"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What does this bot do? (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {workspaces.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="workspace">Workspace *</Label>
                  <select
                    id="workspace"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    value={formData.workspace_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, workspace_id: e.target.value }))}
                  >
                    <option value="">Select a workspace</option>
                    {workspaces.map((workspace) => (
                      <option key={workspace.id} value={workspace.id}>
                        {workspace.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Bot Behavior
              </CardTitle>
              <CardDescription>
                Configure how your bot will interact with visitors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="welcome">Welcome Message</Label>
                <Textarea
                  id="welcome"
                  value={formData.welcome_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, welcome_message: e.target.value }))}
                  rows={2}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI-Powered Responses
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable intelligent responses using AI (requires API key)
                    </p>
                  </div>
                  <Switch
                    checked={formData.ai_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ai_enabled: checked }))}
                  />
                </div>

                {formData.ai_enabled && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="ai_model">AI Model</Label>
                    <select
                      id="ai_model"
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                      value={formData.ai_model}
                      onChange={(e) => setFormData(prev => ({ ...prev, ai_model: e.target.value }))}
                    >
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast & Cost-effective)</option>
                      <option value="gpt-4">GPT-4 (High Quality)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo (Latest)</option>
                    </select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Choose a Template</CardTitle>
              <CardDescription>
                Start with a pre-built template or create from scratch
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(groupedTemplates).length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No templates available yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    You can create a bot from scratch
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                    <div key={category}>
                      <h4 className="font-medium mb-3 capitalize">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categoryTemplates.map((template) => (
                          <Card
                            key={template.id}
                            className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                              formData.template_id === template.id ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, template_id: template.id }))}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-medium">{template.name}</h5>
                                {formData.template_id === template.id && (
                                  <CheckCircle className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {template.description}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Review & Create</CardTitle>
              <CardDescription>
                Review your bot configuration before creating
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Bot Name</Label>
                  <p className="text-sm text-muted-foreground">{formData.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">AI-Powered</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.ai_enabled ? `Yes (${formData.ai_model})` : 'No'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium">Welcome Message</Label>
                  <p className="text-sm text-muted-foreground">{formData.welcome_message}</p>
                </div>
                {formData.description && (
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground">{formData.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/chatbots" className="text-muted-foreground hover:text-foreground">
              ← Back to Chatbots
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Create New Chatbot</h1>
          </div>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <Badge 
                key={step}
                variant={step === currentStep ? 'default' : step < currentStep ? 'secondary' : 'outline'}
                className="px-2 py-1"
              >
                {step}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {renderStep()}
          
          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            {currentStep === 5 ? (
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? 'Creating...' : 'Create Chatbot'}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateChatbot;