import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Search, Play, ArrowRight, Users, MessageSquare, ShoppingCart, HelpCircle, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview_image: string;
  flow_structure: {
    nodes: Array<{
      id: string;
      title: string;
      type: string;
      description?: string;
      responses?: Array<{ text: string }>;
    }>;
  };
  use_case: string;
  features: string[];
}

const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: 'product-demo',
    name: 'Product Demo Flow',
    description: 'Showcase your product features with an interactive video tour that guides visitors through key capabilities.',
    category: 'sales',
    preview_image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600',
    use_case: 'Product launches, feature showcases, demo requests',
    features: ['Interactive feature walkthrough', 'Demo scheduling', 'Lead capture', 'Follow-up automation'],
    flow_structure: {
      nodes: [
        { id: '1', title: 'Welcome & Product Overview', type: 'video_question', description: 'Introduce the product' },
        { id: '2', title: 'Feature Selection', type: 'video_question', description: 'Which feature interests you?', responses: [{ text: 'Pricing' }, { text: 'Features' }, { text: 'Support' }] },
        { id: '3', title: 'Deep Dive', type: 'video_question', description: 'Detailed feature explanation' },
        { id: '4', title: 'Schedule Demo', type: 'lead_capture', description: 'Collect contact info for demo' },
      ],
    },
  },
  {
    id: 'lead-qualification',
    name: 'Lead Qualification Bot',
    description: 'Automatically qualify leads with targeted discovery questions and route high-intent prospects to your sales team.',
    category: 'sales',
    preview_image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600',
    use_case: 'Sales qualification, lead scoring, appointment booking',
    features: ['Smart qualification questions', 'Lead scoring', 'CRM integration ready', 'Priority routing'],
    flow_structure: {
      nodes: [
        { id: '1', title: 'Introduction', type: 'video_question', description: 'Greeting and context' },
        { id: '2', title: 'Company Size', type: 'video_question', responses: [{ text: '1-10' }, { text: '11-50' }, { text: '51+' }] },
        { id: '3', title: 'Budget Range', type: 'video_question', responses: [{ text: '<$1k' }, { text: '$1k-$5k' }, { text: '$5k+' }] },
        { id: '4', title: 'Timeline', type: 'video_question', responses: [{ text: 'Immediate' }, { text: '1-3 months' }, { text: 'Exploring' }] },
        { id: '5', title: 'Contact Info', type: 'lead_capture' },
      ],
    },
  },
  {
    id: 'customer-onboarding',
    name: 'Customer Onboarding',
    description: 'Welcome new customers with a personalized video sequence that guides them through setup and initial usage.',
    category: 'support',
    preview_image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600',
    use_case: 'New user onboarding, product setup, account activation',
    features: ['Step-by-step guidance', 'Progress tracking', 'Resource links', 'Support escalation'],
    flow_structure: {
      nodes: [
        { id: '1', title: 'Welcome Video', type: 'video_question', description: 'Welcome new customer' },
        { id: '2', title: 'Account Type', type: 'video_question', responses: [{ text: 'Personal' }, { text: 'Business' }] },
        { id: '3', title: 'Setup Guide', type: 'video_question', description: 'Step-by-step setup' },
        { id: '4', title: 'Resources', type: 'video_question', description: 'Helpful links and docs' },
        { id: '5', title: 'Support Contact', type: 'lead_capture', description: 'Stay in touch' },
      ],
    },
  },
  {
    id: 'faq-series',
    name: 'FAQ Video Series',
    description: 'Answer common questions with a library of video responses, reducing support tickets and improving customer satisfaction.',
    category: 'support',
    preview_image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600',
    use_case: 'Customer support, self-service help, knowledge base',
    features: ['Video FAQ library', 'Smart search', 'Related questions', 'Escalation to human'],
    flow_structure: {
      nodes: [
        { id: '1', title: 'How can we help?', type: 'video_question', description: 'Main menu' },
        { id: '2', title: 'Topic Selection', type: 'video_question', responses: [{ text: 'Billing' }, { text: 'Technical' }, { text: 'Account' }] },
        { id: '3', title: 'Specific Question', type: 'video_question', description: 'Video answer' },
        { id: '4', title: 'Was this helpful?', type: 'video_question', responses: [{ text: 'Yes' }, { text: 'Need more help' }] },
        { id: '5', title: 'Contact Support', type: 'lead_capture' },
      ],
    },
  },
  {
    id: 'sales-pitch',
    name: 'Sales Pitch Flow',
    description: 'Convert visitors into customers with a compelling, conversion-optimized video sales presentation.',
    category: 'sales',
    preview_image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600',
    use_case: 'High-ticket sales, service offerings, consultation booking',
    features: ['Persuasive storytelling', 'Objection handling', 'Social proof', 'Strong CTA'],
    flow_structure: {
      nodes: [
        { id: '1', title: 'Hook & Problem', type: 'video_question', description: 'Identify pain points' },
        { id: '2', title: 'Solution Overview', type: 'video_question', description: 'Present your solution' },
        { id: '3', title: 'Social Proof', type: 'video_question', description: 'Show testimonials' },
        { id: '4', title: 'Pricing Options', type: 'video_question', responses: [{ text: 'Basic' }, { text: 'Pro' }, { text: 'Enterprise' }] },
        { id: '5', title: 'Book Consultation', type: 'lead_capture' },
      ],
    },
  },
];

const VideoTemplateLibrary = () => {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null);

  const handleUseTemplate = async (template: VideoTemplate) => {
    if (!currentWorkspace?.id) {
      toast({
        title: 'Error',
        description: 'Please select a workspace first',
        variant: 'destructive',
      });
      return;
    }

    setCreatingTemplate(template.id);

    try {
      // Create chatbot from template
      const { data: chatbot, error: botError } = await supabase
        .from('chatbots')
        .insert({
          workspace_id: currentWorkspace.id,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          name: template.name,
          description: template.description,
          chatbot_type: 'video_bot',
          status: 'draft',
          video_config: {
            template_id: template.id,
            preview_thumbnail: template.preview_image,
          },
        })
        .select()
        .single();

      if (botError) throw botError;

      // Create flow nodes
      const messages = template.flow_structure.nodes.map((node, index) => ({
        chatbot_id: chatbot.id,
        message_key: node.title,
        message_text: node.description || node.title,
        message_type: node.type === 'lead_capture' ? 'form' as const : 'text' as const,
        buttons: node.responses ? node.responses.map((r, i) => ({
          id: `btn-${i}`,
          text: r.text,
          next_message_key: index < template.flow_structure.nodes.length - 1 
            ? template.flow_structure.nodes[index + 1].title 
            : null,
        })) : [],
        node_position: { x: index * 300, y: 0 },
      }));

      const { error: messagesError } = await supabase
        .from('chatbot_messages')
        .insert(messages);

      if (messagesError) throw messagesError;

      toast({
        title: 'Success!',
        description: `${template.name} created successfully`,
      });

      // Navigate to video flow editor
      navigate(`/chatbots/${chatbot.id}/video-editor`);
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create bot from template',
        variant: 'destructive',
      });
    } finally {
      setCreatingTemplate(null);
    }
  };

  const filteredTemplates = VIDEO_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sales': return ShoppingCart;
      case 'support': return HelpCircle;
      case 'onboarding': return UserPlus;
      default: return MessageSquare;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Video className="h-8 w-8 text-primary" />
                Video Bot Templates
              </h1>
              <p className="text-muted-foreground mt-2">
                Pre-built interactive video flows ready to customize for your business
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="mb-8">
          <TabsList>
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="sales">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="support">
              <HelpCircle className="h-4 w-4 mr-2" />
              Support
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredTemplates.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">No templates found</CardTitle>
              <CardDescription>Try adjusting your search or filters</CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const CategoryIcon = getCategoryIcon(template.category);
              
              return (
                <Card key={template.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="relative h-48 bg-muted">
                    <img 
                      src={template.preview_image} 
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-background/90 backdrop-blur">
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {template.category}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="h-12 w-12 text-white" />
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {template.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Use Case:</p>
                      <p className="text-sm text-muted-foreground">{template.use_case}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Features:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.features.slice(0, 3).map((feature, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {template.features.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <span>{template.flow_structure.nodes.length} nodes</span>
                        <span>~5 min setup</span>
                      </div>
                      
                      <Button 
                        className="w-full group"
                        onClick={() => handleUseTemplate(template)}
                        disabled={creatingTemplate === template.id}
                      >
                        {creatingTemplate === template.id ? (
                          'Creating...'
                        ) : (
                          <>
                            Use This Template
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
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

export default VideoTemplateLibrary;
