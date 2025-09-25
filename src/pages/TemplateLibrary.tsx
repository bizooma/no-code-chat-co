import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Bot, 
  Search, 
  Filter, 
  Star, 
  Download, 
  Eye, 
  ShoppingCart, 
  Home, 
  Utensils, 
  Code, 
  TrendingUp, 
  Headphones 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChatbotTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  preview_image: string | null;
  template_config: any;
  is_active: boolean;
  created_at: string;
}

interface Workspace {
  id: string;
  name: string;
}

const categoryIcons = {
  ecommerce: ShoppingCart,
  realestate: Home,
  restaurant: Utensils,
  saas: Code,
  sales: TrendingUp,
  support: Headphones,
  default: Bot
};

const categoryColors = {
  ecommerce: 'bg-green-100 text-green-800',
  realestate: 'bg-blue-100 text-blue-800',
  restaurant: 'bg-orange-100 text-orange-800',
  saas: 'bg-purple-100 text-purple-800',
  sales: 'bg-red-100 text-red-800',
  support: 'bg-gray-100 text-gray-800'
};

const TemplateLibrary = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<ChatbotTemplate[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState<ChatbotTemplate | null>(null);

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
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  };

  const handleDeployTemplate = async (template: ChatbotTemplate) => {
    if (workspaces.length === 0) {
      toast({
        title: "No Workspace",
        description: "Please create a workspace first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create chatbot with template configuration
      const { data: chatbot, error } = await supabase
        .from('chatbots')
        .insert({
          name: `${template.name} - ${new Date().toLocaleDateString()}`,
          description: template.description,
          workspace_id: workspaces[0].id, // Use first workspace
          created_by: user?.id,
          welcome_message: template.template_config.welcome_message || 'Hello! How can I help you today?',
          ai_enabled: template.template_config.ai_enabled || false,
          ai_model: template.template_config.ai_model || 'gpt-3.5-turbo',
          widget_config: template.template_config.widget_config || {
            color: '#3B82F6',
            position: 'bottom-right'
          },
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      // Create template messages if they exist
      if (template.template_config.messages && Array.isArray(template.template_config.messages)) {
        const messages = template.template_config.messages.map((msg: any) => ({
          chatbot_id: chatbot.id,
          message_key: msg.key,
          message_text: msg.text,
          message_type: msg.type || 'text',
          next_message_key: msg.next_key || null,
          buttons: msg.buttons || null,
          collect_lead_info: msg.collect_lead || false,
          conditions: msg.conditions || null
        }));

        const { error: messagesError } = await supabase
          .from('chatbot_messages')
          .insert(messages);

        if (messagesError) {
          console.error('Error creating template messages:', messagesError);
        }
      }

      toast({
        title: "Template Deployed!",
        description: `${template.name} has been deployed successfully`,
      });

      // Navigate to editor
      navigate(`/chatbots/${chatbot.id}/editor`);
    } catch (error) {
      console.error('Error deploying template:', error);
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, ChatbotTemplate[]>);

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Template Library</h1>
                <p className="text-muted-foreground mt-2">
                  Deploy industry-specific chatbots in minutes
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/templates/analytics">
                  <Button variant="outline">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                </Link>
                <Link to="/chatbots/create">
                  <Button>
                    <Bot className="mr-2 h-4 w-4" />
                    Create Custom Bot
                  </Button>
                </Link>
              </div>
            </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ecommerce">E-commerce</TabsTrigger>
            <TabsTrigger value="saas">SaaS</TabsTrigger>
            <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
            <TabsTrigger value="realestate">Real Estate</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-8">
            {Object.keys(groupedTemplates).length === 0 ? (
              <div className="text-center py-12">
                <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No templates found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                  <div key={category}>
                    <h3 className="text-xl font-semibold mb-4 capitalize flex items-center gap-2">
                      {React.createElement(categoryIcons[category as keyof typeof categoryIcons] || categoryIcons.default, { className: "h-5 w-5" })}
                      {category} Templates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryTemplates.map((template) => (
                        <Card key={template.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                {React.createElement(categoryIcons[template.category as keyof typeof categoryIcons] || categoryIcons.default, { className: "h-5 w-5" })}
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                              </div>
                              <Badge className={categoryColors[template.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}>
                                {template.category}
                              </Badge>
                            </div>
                            <CardDescription>{template.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>4.8</span>
                                <span>•</span>
                                <Download className="h-4 w-4" />
                                <span>1.2k</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPreviewTemplate(template)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleDeployTemplate(template)}
                                  disabled={loading}
                                >
                                  Deploy
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TemplateLibrary;