import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Send, 
  Webhook, 
  Mail, 
  FileSpreadsheet,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Settings,
  Zap,
  RefreshCw,
  MessageSquare,
  Phone,
  Slack
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface Integration {
  id: string;
  integration_type: string;
  name: string;
  config: any;
  is_active: boolean;
  created_at: string;
}

const LeadIntegrations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);
  
  // Form states for different integrations
  const [zapierWebhook, setZapierWebhook] = useState('');
  const [emailNotifications, setEmailNotifications] = useState({
    enabled: false,
    recipients: '',
    subject: 'New Lead Captured'
  });
  const [hubspotConfig, setHubspotConfig] = useState({
    api_key: '',
    enabled: false
  });
  const [googleSheetsConfig, setGoogleSheetsConfig] = useState({
    sheet_url: '',
    enabled: false
  });

  // New multi-channel integrations
  const [facebookConfig, setFacebookConfig] = useState({
    access_token: '',
    page_id: '',
    verify_token: '',
    enabled: false
  });
  const [whatsappConfig, setWhatsappConfig] = useState({
    access_token: '',
    phone_number_id: '',
    verify_token: '',
    enabled: false
  });
  const [slackConfig, setSlackConfig] = useState({
    webhook_url: '',
    enabled: false
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setIntegrations(data || []);
      populateFormData(data || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast({
        title: "Error",
        description: "Failed to load integrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const populateFormData = (integrationsData: Integration[]) => {
    integrationsData.forEach(integration => {
      switch (integration.integration_type) {
        case 'zapier':
          setZapierWebhook(integration.config?.webhook_url || '');
          break;
        case 'email':
          setEmailNotifications({
            enabled: integration.is_active,
            recipients: integration.config?.recipients || '',
            subject: integration.config?.subject || 'New Lead Captured'
          });
          break;
        case 'hubspot':
          setHubspotConfig({
            api_key: integration.config?.api_key || '',
            enabled: integration.is_active
          });
          break;
        case 'google_sheets':
          setGoogleSheetsConfig({
            sheet_url: integration.config?.sheet_url || '',
            enabled: integration.is_active
          });
          break;
        case 'facebook_messenger':
          setFacebookConfig({
            access_token: integration.config?.access_token || '',
            page_id: integration.config?.page_id || '',
            verify_token: integration.config?.verify_token || '',
            enabled: integration.is_active
          });
          break;
        case 'whatsapp_business':
          setWhatsappConfig({
            access_token: integration.config?.access_token || '',
            phone_number_id: integration.config?.phone_number_id || '',
            verify_token: integration.config?.verify_token || '',
            enabled: integration.is_active
          });
          break;
        case 'slack':
          setSlackConfig({
            webhook_url: integration.config?.webhook_url || '',
            enabled: integration.is_active
          });
          break;
      }
    });
  };

  const saveIntegration = async (type: string, name: string, config: any, enabled: boolean) => {
    try {
      // First check if integration exists
      const existingIntegration = integrations.find(i => i.integration_type === type);

      if (existingIntegration) {
        // Update existing
        const { error } = await supabase
          .from('integrations')
          .update({
            name,
            config,
            is_active: enabled
          })
          .eq('id', existingIntegration.id);

        if (error) throw error;
      } else {
        // Create new
        const { data: workspaceData } = await supabase
          .from('workspaces')
          .select('id')
          .limit(1)
          .single();

        if (!workspaceData) throw new Error('No workspace found');

        const { error } = await supabase
          .from('integrations')
          .insert({
            workspace_id: workspaceData.id,
            integration_type: type as any,
            name,
            config,
            is_active: enabled
          });

        if (error) throw error;
      }

      await fetchIntegrations();
      
      toast({
        title: "Success",
        description: `${name} integration saved successfully`,
      });
    } catch (error) {
      console.error('Error saving integration:', error);
      toast({
        title: "Error",
        description: `Failed to save ${name} integration`,
        variant: "destructive",
      });
    }
  };

  const testZapierWebhook = async () => {
    if (!zapierWebhook) {
      toast({
        title: "Error",
        description: "Please enter a Zapier webhook URL",
        variant: "destructive",
      });
      return;
    }

    setTestingIntegration('zapier');
    try {
      const response = await fetch(zapierWebhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          lead: {
            name: "Test User",
            email: "test@example.com",
            phone: "+1234567890",
            company: "Test Company",
            chatbot: "Test Bot"
          }
        }),
      });

      toast({
        title: "Test Sent",
        description: "Test webhook sent to Zapier. Check your Zap's history to confirm it was received.",
      });
    } catch (error) {
      console.error("Error testing webhook:", error);
      toast({
        title: "Error",
        description: "Failed to send test webhook. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setTestingIntegration(null);
    }
  };

  const testEmailNotification = async () => {
    if (!emailNotifications.recipients) {
      toast({
        title: "Error",
        description: "Please enter email recipients",
        variant: "destructive",
      });
      return;
    }

    setTestingIntegration('email');
    try {
      const { error } = await supabase.functions.invoke('send-lead-notification', {
        body: {
          test: true,
          recipients: emailNotifications.recipients.split(',').map(e => e.trim()),
          subject: emailNotifications.subject,
          lead: {
            name: "Test User",
            email: "test@example.com",
            phone: "+1234567890",
            company: "Test Company",
            chatbot: "Test Bot"
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: "Test notification sent successfully",
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setTestingIntegration(null);
    }
  };

  const getIntegrationStatus = (type: string) => {
    const integration = integrations.find(i => i.integration_type === type);
    return integration?.is_active || false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading integrations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/leads" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Lead Integrations</h1>
          </div>
          <Badge variant="outline">
            {integrations.filter(i => i.is_active).length} Active
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Connect Your Tools</h2>
          <p className="text-muted-foreground">
            Automatically send your leads to your favorite CRM and marketing tools.
          </p>
        </div>

        <Tabs defaultValue="zapier" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 text-xs">
            <TabsTrigger value="zapier" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Zapier
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Email
            </TabsTrigger>
            <TabsTrigger value="facebook" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Facebook
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="slack" className="flex items-center gap-1">
              <Slack className="h-3 w-3" />
              Slack
            </TabsTrigger>
            <TabsTrigger value="hubspot" className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              HubSpot
            </TabsTrigger>
            <TabsTrigger value="sheets" className="flex items-center gap-1">
              <FileSpreadsheet className="h-3 w-3" />
              Sheets
            </TabsTrigger>
          </TabsList>

          {/* Zapier Integration */}
          <TabsContent value="zapier">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Zapier Integration
                    </CardTitle>
                    <CardDescription>
                      Send leads to thousands of apps through Zapier webhooks
                    </CardDescription>
                  </div>
                  {getIntegrationStatus('zapier') && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="zapier-webhook">Webhook URL</Label>
                  <Input
                    id="zapier-webhook"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={zapierWebhook}
                    onChange={(e) => setZapierWebhook(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Create a Zap with a webhook trigger and paste the URL here
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={testZapierWebhook}
                    variant="outline"
                    disabled={testingIntegration === 'zapier'}
                  >
                    {testingIntegration === 'zapier' ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Test Webhook
                  </Button>
                  <Button
                    onClick={() => saveIntegration(
                      'zapier',
                      'Zapier Webhook',
                      { webhook_url: zapierWebhook },
                      !!zapierWebhook
                    )}
                    disabled={!zapierWebhook}
                  >
                    Save Integration
                  </Button>
                </div>

                <Separator />

                <div className="text-sm text-muted-foreground space-y-2">
                  <h4 className="font-medium text-foreground">Setup Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to <a href="https://zapier.com" target="_blank" className="text-primary hover:underline">zapier.com</a> and create a new Zap</li>
                    <li>Choose "Webhooks by Zapier" as your trigger app</li>
                    <li>Select "Catch Hook" as the trigger event</li>
                    <li>Copy the webhook URL and paste it above</li>
                    <li>Connect your desired action app (Gmail, Slack, HubSpot, etc.)</li>
                    <li>Test the webhook using the button above</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Notifications */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Notifications
                    </CardTitle>
                    <CardDescription>
                      Get notified via email when new leads are captured
                    </CardDescription>
                  </div>
                  {getIntegrationStatus('email') && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send emails when new leads are captured
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications.enabled}
                    onCheckedChange={(checked) => 
                      setEmailNotifications(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-recipients">Recipients</Label>
                  <Input
                    id="email-recipients"
                    placeholder="your-email@company.com, team@company.com"
                    value={emailNotifications.recipients}
                    onChange={(e) => 
                      setEmailNotifications(prev => ({ ...prev, recipients: e.target.value }))
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Separate multiple emails with commas
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-subject">Email Subject</Label>
                  <Input
                    id="email-subject"
                    value={emailNotifications.subject}
                    onChange={(e) => 
                      setEmailNotifications(prev => ({ ...prev, subject: e.target.value }))
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={testEmailNotification}
                    variant="outline"
                    disabled={testingIntegration === 'email' || !emailNotifications.recipients}
                  >
                    {testingIntegration === 'email' ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send Test Email
                  </Button>
                  <Button
                    onClick={() => saveIntegration(
                      'email',
                      'Email Notifications',
                      {
                        recipients: emailNotifications.recipients,
                        subject: emailNotifications.subject
                      },
                      emailNotifications.enabled
                    )}
                    disabled={!emailNotifications.recipients}
                  >
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Facebook Messenger Integration */}
          <TabsContent value="facebook">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Facebook Messenger
                    </CardTitle>
                    <CardDescription>
                      Connect your Facebook Page to receive messages
                    </CardDescription>
                  </div>
                  {getIntegrationStatus('facebook_messenger') && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fb-page-id">Page ID</Label>
                    <Input
                      id="fb-page-id"
                      placeholder="Your Facebook Page ID"
                      value={facebookConfig.page_id}
                      onChange={(e) => setFacebookConfig(prev => ({ ...prev, page_id: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fb-access-token">Page Access Token</Label>
                    <Input
                      id="fb-access-token"
                      type="password"
                      placeholder="Your Page Access Token"
                      value={facebookConfig.access_token}
                      onChange={(e) => setFacebookConfig(prev => ({ ...prev, access_token: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fb-verify-token">Verify Token</Label>
                  <Input
                    id="fb-verify-token"
                    placeholder="Create a unique verify token"
                    value={facebookConfig.verify_token}
                    onChange={(e) => setFacebookConfig(prev => ({ ...prev, verify_token: e.target.value }))}
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium">Webhook URL</h4>
                  <code className="text-sm bg-muted p-2 rounded block">
                    https://jsyqavxvspkqitrwbeay.functions.supabase.co/facebook-messenger-webhook
                  </code>
                  <p className="text-sm text-muted-foreground">
                    Use this URL when setting up your Facebook webhook
                  </p>
                </div>

                <Button
                  onClick={() => saveIntegration(
                    'facebook_messenger',
                    'Facebook Messenger',
                    {
                      access_token: facebookConfig.access_token,
                      page_id: facebookConfig.page_id,
                      verify_token: facebookConfig.verify_token
                    },
                    !!(facebookConfig.access_token && facebookConfig.page_id)
                  )}
                  disabled={!facebookConfig.access_token || !facebookConfig.page_id}
                >
                  Save Integration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Business Integration */}
          <TabsContent value="whatsapp">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      WhatsApp Business
                    </CardTitle>
                    <CardDescription>
                      Connect WhatsApp Business API for messaging
                    </CardDescription>
                  </div>
                  {getIntegrationStatus('whatsapp_business') && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wa-phone-id">Phone Number ID</Label>
                    <Input
                      id="wa-phone-id"
                      placeholder="Your WhatsApp Phone Number ID"
                      value={whatsappConfig.phone_number_id}
                      onChange={(e) => setWhatsappConfig(prev => ({ ...prev, phone_number_id: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wa-access-token">Access Token</Label>
                    <Input
                      id="wa-access-token"
                      type="password"
                      placeholder="Your WhatsApp Access Token"
                      value={whatsappConfig.access_token}
                      onChange={(e) => setWhatsappConfig(prev => ({ ...prev, access_token: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wa-verify-token">Verify Token</Label>
                  <Input
                    id="wa-verify-token"
                    placeholder="Create a unique verify token"
                    value={whatsappConfig.verify_token}
                    onChange={(e) => setWhatsappConfig(prev => ({ ...prev, verify_token: e.target.value }))}
                  />
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium">Webhook URL</h4>
                  <code className="text-sm bg-muted p-2 rounded block">
                    https://jsyqavxvspkqitrwbeay.functions.supabase.co/whatsapp-business-webhook
                  </code>
                  <p className="text-sm text-muted-foreground">
                    Use this URL when setting up your WhatsApp webhook
                  </p>
                </div>

                <Button
                  onClick={() => saveIntegration(
                    'whatsapp_business',
                    'WhatsApp Business',
                    {
                      access_token: whatsappConfig.access_token,
                      phone_number_id: whatsappConfig.phone_number_id,
                      verify_token: whatsappConfig.verify_token
                    },
                    !!(whatsappConfig.access_token && whatsappConfig.phone_number_id)
                  )}
                  disabled={!whatsappConfig.access_token || !whatsappConfig.phone_number_id}
                >
                  Save Integration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Slack Integration */}
          <TabsContent value="slack">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Slack className="h-5 w-5" />
                      Slack Notifications
                    </CardTitle>
                    <CardDescription>
                      Send lead notifications to your Slack channels
                    </CardDescription>
                  </div>
                  {getIntegrationStatus('slack') && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                  <Input
                    id="slack-webhook"
                    placeholder="https://hooks.slack.com/services/..."
                    value={slackConfig.webhook_url}
                    onChange={(e) => setSlackConfig(prev => ({ ...prev, webhook_url: e.target.value }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Create a Slack app and incoming webhook to get this URL
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      if (!slackConfig.webhook_url) {
                        toast({
                          title: "Error",
                          description: "Please enter a Slack webhook URL",
                          variant: "destructive",
                        });
                        return;
                      }

                      setTestingIntegration('slack');
                      try {
                        const { data: workspaceData } = await supabase
                          .from('workspaces')
                          .select('id')
                          .limit(1)
                          .single();

                        const { error } = await supabase.functions.invoke('slack-notifications', {
                          body: {
                            workspace_id: workspaceData?.id,
                            test: true,
                            lead: {
                              name: "Test User",
                              email: "test@example.com",
                              phone: "+1234567890",
                              company: "Test Company",
                              chatbot: "Test Bot"
                            }
                          }
                        });

                        if (error) throw error;

                        toast({
                          title: "Test Sent",
                          description: "Test notification sent to Slack successfully",
                        });
                      } catch (error) {
                        console.error("Error testing Slack:", error);
                        toast({
                          title: "Error",
                          description: "Failed to send test notification",
                          variant: "destructive",
                        });
                      } finally {
                        setTestingIntegration(null);
                      }
                    }}
                    variant="outline"
                    disabled={testingIntegration === 'slack' || !slackConfig.webhook_url}
                  >
                    {testingIntegration === 'slack' ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Test Notification
                  </Button>
                  <Button
                    onClick={() => saveIntegration(
                      'slack',
                      'Slack Notifications',
                      { webhook_url: slackConfig.webhook_url },
                      !!slackConfig.webhook_url
                    )}
                    disabled={!slackConfig.webhook_url}
                  >
                    Save Integration
                  </Button>
                </div>

                <Separator />

                <div className="text-sm text-muted-foreground space-y-2">
                  <h4 className="font-medium text-foreground">Setup Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to <a href="https://api.slack.com/apps" target="_blank" className="text-primary hover:underline">api.slack.com/apps</a> and create a new app</li>
                    <li>Choose "From scratch" and select your workspace</li>
                    <li>Go to "Incoming Webhooks" and activate them</li>
                    <li>Click "Add New Webhook to Workspace" and select a channel</li>
                    <li>Copy the webhook URL and paste it above</li>
                    <li>Test the integration using the button above</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HubSpot Integration */}
          <TabsContent value="hubspot">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5" />
                      HubSpot Integration
                    </CardTitle>
                    <CardDescription>
                      Automatically create contacts in HubSpot CRM
                    </CardDescription>
                  </div>
                  {getIntegrationStatus('hubspot') && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">Coming Soon</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    HubSpot integration is currently under development. For now, you can use Zapier to connect to HubSpot.
                  </p>
                </div>

                <div className="space-y-2 opacity-50">
                  <Label htmlFor="hubspot-key">HubSpot API Key</Label>
                  <Input
                    id="hubspot-key"
                    type="password"
                    placeholder="pat-na1-..."
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">
                    Get your API key from HubSpot Settings → Integrations → API Key
                  </p>
                </div>

                <Button disabled className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure HubSpot (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Google Sheets Integration */}
          <TabsContent value="sheets">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5" />
                      Google Sheets Integration
                    </CardTitle>
                    <CardDescription>
                      Automatically add leads to a Google Sheets spreadsheet
                    </CardDescription>
                  </div>
                  {getIntegrationStatus('google_sheets') && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">Coming Soon</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Google Sheets integration is currently under development. For now, you can use Zapier to connect to Google Sheets.
                  </p>
                </div>

                <div className="space-y-2 opacity-50">
                  <Label htmlFor="sheets-url">Google Sheets URL</Label>
                  <Input
                    id="sheets-url"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">
                    Share your Google Sheet and paste the URL here
                  </p>
                </div>

                <Button disabled className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure Google Sheets (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default LeadIntegrations;