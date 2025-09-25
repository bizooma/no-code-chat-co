import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Bot, MessageSquare, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UsageData {
  chatbots: { used: number; limit: number };
  conversations: { used: number; limit: number };
  leads: { used: number; limit: number };
}

const SubscriptionUsage: React.FC<{ usage?: UsageData }> = ({ 
  usage = { 
    chatbots: { used: 0, limit: 1 }, 
    conversations: { used: 0, limit: 100 },
    leads: { used: 0, limit: 50 }
  }
}) => {
  const { subscription } = useAuth();

  const getPlanLimits = () => {
    switch (subscription?.tier) {
      case 'professional':
        return {
          chatbots: { limit: 'Unlimited' },
          conversations: { limit: 'Unlimited' },
          leads: { limit: 'Unlimited' }
        };
      case 'enterprise':
        return {
          chatbots: { limit: 'Unlimited' },
          conversations: { limit: 'Unlimited' },
          leads: { limit: 'Unlimited' }
        };
      default:
        return {
          chatbots: { limit: 1 },
          conversations: { limit: 100 },
          leads: { limit: 50 }
        };
    }
  };

  const limits = getPlanLimits();
  const isFreePlan = !subscription?.subscribed || subscription?.tier === 'free';

  const getUsagePercentage = (used: number, limit: number | string) => {
    if (typeof limit === 'string') return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!isFreePlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                {subscription?.tier === 'professional' ? 'Professional' : 'Enterprise'}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Unlimited everything • Premium support
              </p>
            </div>
            <Link to="/pricing">
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Usage & Limits
          </div>
          <Badge variant="outline">Free Plan</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chatbots Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Chatbots
            </span>
            <span className="text-sm text-muted-foreground">
              {usage.chatbots.used} / {limits.chatbots.limit}
            </span>
          </div>
          <Progress 
            value={getUsagePercentage(usage.chatbots.used, usage.chatbots.limit)} 
            className="h-2"
          />
        </div>

        {/* Conversations Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversations (Monthly)
            </span>
            <span className="text-sm text-muted-foreground">
              {usage.conversations.used} / {limits.conversations.limit}
            </span>
          </div>
          <Progress 
            value={getUsagePercentage(usage.conversations.used, usage.conversations.limit)} 
            className="h-2"
          />
          {getUsagePercentage(usage.conversations.used, usage.conversations.limit as number) > 80 && (
            <p className="text-xs text-orange-600 mt-1">
              You're approaching your monthly limit
            </p>
          )}
        </div>

        {/* Leads Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Leads (Monthly)
            </span>
            <span className="text-sm text-muted-foreground">
              {usage.leads.used} / {limits.leads.limit}
            </span>
          </div>
          <Progress 
            value={getUsagePercentage(usage.leads.used, usage.leads.limit)} 
            className="h-2"
          />
        </div>

        {/* Upgrade CTA */}
        <div className="pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Need more? Upgrade for unlimited everything
            </p>
            <Link to="/pricing">
              <Button size="sm" className="w-full">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade Now
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionUsage;