import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Target, 
  BarChart3,
  Download,
  Star,
  Eye,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface TemplateMetric {
  template_id: string;
  template_name: string;
  category: string;
  total_deployments: number;
  total_conversations: number;
  total_leads: number;
  avg_conversation_length: number;
  lead_conversion_rate: number;
  performance_score: number;
  last_30_days_deployments: number;
  growth_rate: number;
}

const TemplateMetrics = () => {
  const [metricsData, setMetricsData] = useState<TemplateMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    fetchTemplateMetrics();
  }, [selectedPeriod]);

  const fetchTemplateMetrics = async () => {
    setLoading(true);
    try {
      // Fetch templates with their usage statistics
      const { data: templates, error: templatesError } = await supabase
        .from('chatbot_templates')
        .select('*')
        .eq('is_active', true);

      if (templatesError) throw templatesError;

      // For each template, calculate metrics
      const metricsPromises = templates.map(async (template) => {
        // Get chatbots created from this template (we'll need to add a template_id field)
        const { data: chatbots } = await supabase
          .from('chatbots')
          .select('id, name, created_at')
          .ilike('name', `%${template.name}%`); // Approximate matching for now

        const chatbotIds = chatbots?.map(c => c.id) || [];

        // Get conversations for these chatbots
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id, chatbot_id, lead_captured, created_at')
          .in('chatbot_id', chatbotIds);

        // Get leads generated
        const { data: leads } = await supabase
          .from('leads')
          .select('id, chatbot_id, created_at')
          .in('chatbot_id', chatbotIds);

        // Calculate metrics
        const totalDeployments = chatbots?.length || 0;
        const totalConversations = conversations?.length || 0;
        const totalLeads = leads?.length || 0;
        const leadConversionRate = totalConversations > 0 ? (totalLeads / totalConversations) * 100 : 0;

        // Calculate growth rate (last 30 days vs previous 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentDeployments = chatbots?.filter(c => 
          new Date(c.created_at) >= thirtyDaysAgo
        ).length || 0;

        const growthRate = totalDeployments > 0 ? ((recentDeployments / totalDeployments) * 100) : 0;

        // Performance score (composite metric)
        const performanceScore = Math.min(100, 
          (leadConversionRate * 0.4) + 
          (Math.min(totalDeployments / 10, 10) * 0.3) + 
          (Math.min(totalConversations / 100, 10) * 0.3)
        );

        return {
          template_id: template.id,
          template_name: template.name,
          category: template.category,
          total_deployments: totalDeployments,
          total_conversations: totalConversations,
          total_leads: totalLeads,
          avg_conversation_length: totalConversations > 0 ? Math.round(totalConversations / totalDeployments * 10) / 10 : 0,
          lead_conversion_rate: Math.round(leadConversionRate * 100) / 100,
          performance_score: Math.round(performanceScore * 100) / 100,
          last_30_days_deployments: recentDeployments,
          growth_rate: Math.round(growthRate * 100) / 100
        };
      });

      const metrics = await Promise.all(metricsPromises);
      setMetricsData(metrics.sort((a, b) => b.performance_score - a.performance_score));
    } catch (error) {
      console.error('Error fetching template metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const topPerformingTemplates = metricsData.slice(0, 5);
  const categoryPerformance = metricsData.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = {
        category: template.category,
        total_deployments: 0,
        total_leads: 0,
        avg_conversion_rate: 0,
        template_count: 0
      };
    }
    acc[template.category].total_deployments += template.total_deployments;
    acc[template.category].total_leads += template.total_leads;
    acc[template.category].avg_conversion_rate += template.lead_conversion_rate;
    acc[template.category].template_count += 1;
    return acc;
  }, {} as Record<string, any>);

  // Calculate average conversion rates by category
  Object.values(categoryPerformance).forEach((cat: any) => {
    cat.avg_conversion_rate = cat.avg_conversion_rate / cat.template_count;
  });

  const chartData = Object.values(categoryPerformance);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalDeployments = metricsData.reduce((sum, t) => sum + t.total_deployments, 0);
  const totalConversations = metricsData.reduce((sum, t) => sum + t.total_conversations, 0);
  const totalLeads = metricsData.reduce((sum, t) => sum + t.total_leads, 0);
  const avgConversionRate = metricsData.length > 0 
    ? metricsData.reduce((sum, t) => sum + t.lead_conversion_rate, 0) / metricsData.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Deployments</p>
                <p className="text-2xl font-bold">{totalDeployments.toLocaleString()}</p>
              </div>
              <Download className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversations</p>
                <p className="text-2xl font-bold">{totalConversations.toLocaleString()}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leads Generated</p>
                <p className="text-2xl font-bold">{totalLeads.toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Conversion</p>
                <p className="text-2xl font-bold">{avgConversionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList>
          <TabsTrigger value="performance">Top Performers</TabsTrigger>
          <TabsTrigger value="category">By Category</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Templates</CardTitle>
              <CardDescription>
                Templates ranked by overall performance score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformingTemplates.map((template, index) => (
                  <div key={template.template_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <span className="text-sm font-semibold">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{template.template_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{template.category}</Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{template.performance_score}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium">{template.total_deployments}</div>
                          <div className="text-muted-foreground">Deployments</div>
                        </div>
                        <div>
                          <div className="font-medium">{template.total_leads}</div>
                          <div className="text-muted-foreground">Leads</div>
                        </div>
                        <div>
                          <div className="font-medium">{template.lead_conversion_rate.toFixed(1)}%</div>
                          <div className="text-muted-foreground">Conversion</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Category</CardTitle>
              <CardDescription>
                Compare template performance across different industries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_deployments" fill="#3b82f6" name="Deployments" />
                    <Bar dataKey="total_leads" fill="#10b981" name="Leads" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Growth Trends</CardTitle>
              <CardDescription>
                Template deployment and performance trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="avg_conversion_rate" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Avg Conversion Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TemplateMetrics;