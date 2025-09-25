import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  Rocket, 
  Target, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  ShoppingCart,
  Home,
  Utensils,
  Code,
  TrendingUp,
  Headphones
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  template_config: any;
}

interface Workspace {
  id: string;
  name: string;
}

const industryOptions = [
  { id: 'ecommerce', name: 'E-commerce', icon: ShoppingCart, description: 'Online store, product support' },
  { id: 'saas', name: 'SaaS', icon: Code, description: 'Software demos, trials, support' },
  { id: 'restaurant', name: 'Restaurant', icon: Utensils, description: 'Reservations, menu, orders' },
  { id: 'realestate', name: 'Real Estate', icon: Home, description: 'Property inquiries, viewings' },
  { id: 'sales', name: 'Sales', icon: TrendingUp, description: 'Lead generation, qualification' },
  { id: 'support', name: 'Support', icon: Headphones, description: 'Customer service, FAQ' }
];

const OnboardingWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [wizardData, setWizardData] = useState({
    industry: '',
    businessName: '',
    mainGoal: '',
    template: null as Template | null,
    customization: {
      botName: '',
      welcomeMessage: '',
      primaryColor: '#3B82F6'
    }
  });

  const goals = [
    { id: 'lead_generation', name: 'Generate Leads', description: 'Capture visitor information' },
    { id: 'customer_support', name: 'Customer Support', description: 'Answer questions and help customers' },
    { id: 'sales_assistance', name: 'Sales Assistance', description: 'Guide customers through purchases' },
    { id: 'appointment_booking', name: 'Appointment Booking', description: 'Schedule meetings or services' }
  ];

  useEffect(() => {
    fetchTemplates();
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (wizardData.industry && templates.length > 0) {
      const matchingTemplate = templates.find(t => t.category === wizardData.industry);
      if (matchingTemplate) {
        setWizardData(prev => ({ 
          ...prev, 
          template: matchingTemplate,
          customization: {
            ...prev.customization,
            botName: `${wizardData.businessName} Bot` || matchingTemplate.name,
            welcomeMessage: matchingTemplate.template_config.welcome_message || 'Hello! How can I help you today?'
          }
        }));
      }
    }
  }, [wizardData.industry, templates, wizardData.businessName]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_templates')
        .select('*')
        .eq('is_active', true);

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

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (!wizardData.template || workspaces.length === 0) return;

    setLoading(true);
    try {
      // Create chatbot
      const { data: chatbot, error } = await supabase
        .from('chatbots')
        .insert({
          name: wizardData.customization.botName,
          description: `${wizardData.businessName} ${wizardData.industry} bot`,
          workspace_id: workspaces[0].id,
          created_by: user?.id,
          welcome_message: wizardData.customization.welcomeMessage,
          ai_enabled: wizardData.template.template_config.ai_enabled || false,
          widget_config: {
            color: wizardData.customization.primaryColor,
            position: 'bottom-right'
          },
          status: 'active' // Deploy immediately
        })
        .select()
        .single();

      if (error) throw error;

      // Create template messages
      if (wizardData.template.template_config.messages) {
        const messages = wizardData.template.template_config.messages.map((msg: any) => ({
          chatbot_id: chatbot.id,
          message_key: msg.key,
          message_text: msg.text,
          message_type: msg.type || 'text',
          next_message_key: msg.next_key || null,
          buttons: msg.buttons || null,
          collect_lead_info: msg.collect_lead || false,
          conditions: msg.conditions || null
        }));

        await supabase.from('chatbot_messages').insert(messages);
      }

      toast({
        title: "🎉 Bot Created Successfully!",
        description: "Your chatbot is now live and ready to engage visitors",
      });

      navigate(`/chatbots/${chatbot.id}/editor`);
    } catch (error) {
      console.error('Error creating bot:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create your bot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / 4) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader className="text-center">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>What's your industry?</CardTitle>
              <CardDescription>
                Let's start by understanding your business type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {industryOptions.map((industry) => (
                  <Card
                    key={industry.id}
                    className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                      wizardData.industry === industry.id ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setWizardData(prev => ({ ...prev, industry: industry.id }))}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <industry.icon className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-medium">{industry.name}</h4>
                          <p className="text-sm text-muted-foreground">{industry.description}</p>
                        </div>
                        {wizardData.industry === industry.id && (
                          <CheckCircle className="h-5 w-5 text-primary ml-auto" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader className="text-center">
              <Bot className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Tell us about your business</CardTitle>
              <CardDescription>
                Help us personalize your chatbot experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="e.g., Acme Corp, John's Restaurant"
                  value={wizardData.businessName}
                  onChange={(e) => setWizardData(prev => ({ ...prev, businessName: e.target.value }))}
                />
              </div>

              <div className="space-y-3">
                <Label>What's your main goal? *</Label>
                <div className="grid grid-cols-1 gap-3">
                  {goals.map((goal) => (
                    <Card
                      key={goal.id}
                      className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                        wizardData.mainGoal === goal.id ? 'ring-2 ring-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setWizardData(prev => ({ ...prev, mainGoal: goal.id }))}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{goal.name}</h4>
                            <p className="text-sm text-muted-foreground">{goal.description}</p>
                          </div>
                          {wizardData.mainGoal === goal.id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader className="text-center">
              <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Customize Your Bot</CardTitle>
              <CardDescription>
                Make it yours with these final touches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="botName">Bot Name</Label>
                <Input
                  id="botName"
                  value={wizardData.customization.botName}
                  onChange={(e) => setWizardData(prev => ({ 
                    ...prev, 
                    customization: { ...prev.customization, botName: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Input
                  id="welcomeMessage"
                  value={wizardData.customization.welcomeMessage}
                  onChange={(e) => setWizardData(prev => ({ 
                    ...prev, 
                    customization: { ...prev.customization, welcomeMessage: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="primaryColor"
                    value={wizardData.customization.primaryColor}
                    onChange={(e) => setWizardData(prev => ({ 
                      ...prev, 
                      customization: { ...prev.customization, primaryColor: e.target.value }
                    }))}
                    className="w-12 h-10 rounded border"
                  />
                  <Input
                    value={wizardData.customization.primaryColor}
                    onChange={(e) => setWizardData(prev => ({ 
                      ...prev, 
                      customization: { ...prev.customization, primaryColor: e.target.value }
                    }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader className="text-center">
              <Rocket className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Ready to Launch!</CardTitle>
              <CardDescription>
                Your chatbot is configured and ready to go live
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-800">Configuration Complete</h4>
                </div>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Industry: {wizardData.industry}</li>
                  <li>• Business: {wizardData.businessName}</li>
                  <li>• Bot Name: {wizardData.customization.botName}</li>
                  <li>• Template: {wizardData.template?.name}</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>✓ Your bot will be created and deployed</li>
                  <li>✓ Embed code will be generated</li>
                  <li>✓ You can customize flows in the editor</li>
                  <li>✓ Analytics will start tracking conversations</li>
                </ul>
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">5-Minute Bot Setup</h1>
              <p className="text-muted-foreground">Get your chatbot live in minutes</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Step {currentStep} of 4</span>
                <Progress value={progress} className="w-24" />
              </div>
            </div>
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
              Back
            </Button>
            
            {currentStep === 4 ? (
              <Button 
                onClick={handleFinish} 
                disabled={loading || !wizardData.template}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                {loading ? 'Launching...' : 'Launch My Bot'}
                <Rocket className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !wizardData.industry) ||
                  (currentStep === 2 && (!wizardData.businessName || !wizardData.mainGoal))
                }
              >
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

export default OnboardingWizard;