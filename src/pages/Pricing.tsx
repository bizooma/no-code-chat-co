import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Star, 
  Crown, 
  Zap,
  BarChart3,
  Users,
  MessageSquare,
  Bot,
  Shield,
  Headphones,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  priceId?: string;
  productId?: string;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  buttonText: string;
  buttonVariant: 'default' | 'outline' | 'secondary';
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    features: [
      '1 chatbot',
      '100 conversations/month',
      'Basic templates',
      'Email support',
      'Basic analytics'
    ],
    icon: <Bot className="h-6 w-6" />,
    buttonText: 'Current Plan',
    buttonVariant: 'outline'
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 29,
    priceId: 'price_1SB46ZEV6sbsDlR8ZxYoI5TO',
    productId: 'prod_T7Ih26ZMAehp3r',
    description: 'Perfect for growing businesses',
    popular: true,
    features: [
      'Unlimited chatbots',
      'Unlimited conversations (fair use)',
      'Advanced analytics',
      'Lead integrations',
      'Custom branding',
      'Priority email support',
      'Zapier integration',
      'Export data'
    ],
    icon: <Star className="h-6 w-6" />,
    buttonText: 'Upgrade to Pro',
    buttonVariant: 'default'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    priceId: 'price_1SB48dEV6sbsDlR8hvA4pB3F',
    productId: 'prod_T7IkTHwZAItNtS',
    description: 'For large organizations',
    features: [
      'Everything in Professional',
      'White-label options',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'Advanced security',
      'Custom training'
    ],
    icon: <Crown className="h-6 w-6" />,
    buttonText: 'Contact Sales',
    buttonVariant: 'secondary'
  }
];

const Pricing = () => {
  const { user, subscription } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    // Handle success/error messages from Stripe redirects
    if (searchParams.get('success') === 'true') {
      toast({
        title: "Payment Successful!",
        description: "Your subscription has been activated. Welcome to CatchJar!",
      });
    } else if (searchParams.get('canceled') === 'true') {
      toast({
        title: "Payment Canceled",
        description: "No charges were made. You can try again anytime.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleUpgrade = async (tier: PricingTier) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upgrade your plan.",
        variant: "destructive",
      });
      return;
    }

    if (!tier.priceId) {
      toast({
        title: "Coming Soon",
        description: "This plan will be available soon. Contact us for early access.",
      });
      return;
    }

    setLoading(tier.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: tier.priceId }
      });

      if (error) throw error;

      if (data?.url) {
        // Open checkout in new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    setLoading('manage');
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const getCurrentPlanButton = (tier: PricingTier) => {
    const isCurrentPlan = subscription?.tier === tier.id;
    const isSubscribed = subscription?.subscribed;
    
    if (isCurrentPlan && isSubscribed) {
      return (
        <Button 
          onClick={handleManageSubscription}
          variant="outline" 
          className="w-full"
          disabled={loading === 'manage'}
        >
          {loading === 'manage' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="mr-2 h-4 w-4" />
          )}
          Manage Subscription
        </Button>
      );
    }

    if (tier.id === 'free' && (!isSubscribed || subscription?.tier === 'free')) {
      return (
        <Button variant="outline" className="w-full" disabled>
          Current Plan
        </Button>
      );
    }

    return (
      <Button
        onClick={() => handleUpgrade(tier)}
        variant={tier.buttonVariant}
        className="w-full"
        disabled={loading === tier.id}
      >
        {loading === tier.id ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {tier.buttonText}
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Pricing Plans</h1>
          </div>
          {user && subscription?.subscribed && (
            <Badge variant="secondary">
              Current: {subscription.tier?.charAt(0).toUpperCase() + subscription.tier?.slice(1)}
            </Badge>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Perfect Plan
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start free and scale as you grow. All plans include our core features to help you build better customer relationships.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {pricingTiers.map((tier) => {
            const isCurrentPlan = subscription?.tier === tier.id;
            const isPopular = tier.popular;
            
            return (
              <Card 
                key={tier.id} 
                className={`relative ${isCurrentPlan ? 'ring-2 ring-primary' : ''} ${isPopular ? 'border-primary shadow-lg' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Current Plan
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className="flex items-center justify-center mb-4">
                    {tier.icon}
                  </div>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {tier.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${tier.price}</span>
                    {tier.price > 0 && <span className="text-muted-foreground">/month</span>}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-4">
                    {getCurrentPlanButton(tier)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="bg-card border border-border rounded-lg p-8 mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">Feature Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Core Features</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Chatbot Builder</div>
                <div>Conversation Management</div>
                <div>Lead Capture</div>
                <div>Basic Templates</div>
                <div>Email Support</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-center">Free</h4>
              <div className="space-y-2 text-center">
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-center">Professional</h4>
              <div className="space-y-2 text-center">
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-center">Enterprise</h4>
              <div className="space-y-2 text-center">
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
              </div>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Advanced Features</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Advanced Analytics</div>
                <div>Integrations</div>
                <div>Custom Branding</div>
                <div>API Access</div>
                <div>Priority Support</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-center opacity-0">Free</h4>
              <div className="space-y-2 text-center">
                <div className="h-4 w-4 mx-auto" />
                <div className="h-4 w-4 mx-auto" />
                <div className="h-4 w-4 mx-auto" />
                <div className="h-4 w-4 mx-auto" />
                <div className="h-4 w-4 mx-auto" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-center opacity-0">Professional</h4>
              <div className="space-y-2 text-center">
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
                <div className="h-4 w-4 mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-center opacity-0">Enterprise</h4>
              <div className="space-y-2 text-center">
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
                <Check className="h-4 w-4 text-primary mx-auto" />
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Frequently Asked Questions</h3>
          <p className="text-muted-foreground mb-8">
            Have questions? We're here to help.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade, downgrade, or cancel your subscription at any time. 
                  Changes take effect at your next billing cycle.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our Free plan lets you explore all core features. No credit card required to get started.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards, debit cards, and digital wallets through our secure Stripe integration.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We offer a 30-day money-back guarantee for all paid plans. 
                  Contact support if you're not satisfied.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;