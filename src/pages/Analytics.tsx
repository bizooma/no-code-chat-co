import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar,
  Download, 
  TrendingUp, 
  TrendingDown,
  Users, 
  MessageSquare, 
  Target,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  RefreshCw,
  FileText,
  Zap
} from 'lucide-react';
import ConversionFunnel from '@/components/analytics/ConversionFunnel';
import PopularQuestions from '@/components/analytics/PopularQuestions';
import RealtimeDashboard from '@/components/analytics/RealtimeDashboard';
import PDFReport from '@/components/analytics/PDFReport';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  totalConversations: number;
  totalLeads: number;
  totalMessages: number;
  avgResponseTime: number;
  conversionRate: number;
  activeUsers: number;
  topChatbots: Array<{
    id: string;
    name: string;
    conversations: number;
    leads: number;
  }>;
  conversationTrends: Array<{
    date: string;
    conversations: number;
    leads: number;
  }>;
  messageDistribution: Array<{
    hour: number;
    messages: number;
  }>;
  leadSources: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  conversionFunnel: Array<{
    stage: string;
    count: number;
    percentage: number;
    dropoff?: number;
  }>;
  popularQuestions: Array<{
    question: string;
    count: number;
    percentage: number;
    trend?: 'up' | 'down' | 'stable';
  }>;
}

const Analytics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalConversations: 0,
    totalLeads: 0,
    totalMessages: 0,
    avgResponseTime: 0,
    conversionRate: 0,
    activeUsers: 0,
    topChatbots: [],
    conversationTrends: [],
    messageDistribution: [],
    leadSources: [],
    statusDistribution: [],
    conversionFunnel: [],
    popularQuestions: []
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('7d');
  const [selectedChatbot, setSelectedChatbot] = useState<string>('all');
  const [chatbots, setChatbots] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    fetchAnalytics();
    fetchChatbots();
  }, [dateRange, selectedChatbot]);

  const fetchChatbots = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbots')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setChatbots(data || []);
    } catch (error) {
      console.error('Error fetching chatbots:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      // Build chatbot filter
      const chatbotFilter = selectedChatbot !== 'all' ? 
        `AND c.chatbot_id = '${selectedChatbot}'` : '';

      // Fetch conversation and lead data
      const { data: conversationData, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          chatbots(id, name),
          leads(id, status, created_at)
        `)
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString())
        .order('started_at', { ascending: false });

      if (convError) throw convError;

      // Fetch message data
      const { data: messageData, error: msgError } = await supabase
        .from('conversation_messages')
        .select(`
          *,
          conversations!inner(chatbot_id, started_at)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (msgError) throw msgError;

      // Fetch analytics events for popular questions
      const { data: analyticsEvents, error: eventsError } = await supabase
        .from('analytics_events')
        .select('event_data')
        .eq('event_type', 'message_sent')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (eventsError) console.warn('Could not fetch analytics events:', eventsError);

      // Process analytics data
      const processedData = processAnalyticsData(
        conversationData || [], 
        messageData || [], 
        analyticsEvents || []
      );
      setAnalytics(processedData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processAnalyticsData = (conversations: any[], messages: any[], events: any[] = []): AnalyticsData => {
    // Basic metrics
    const totalConversations = conversations.length;
    const totalLeads = conversations.filter(c => c.leads?.length > 0).length;
    const totalMessages = messages.length;
    const conversionRate = totalConversations > 0 ? (totalLeads / totalConversations) * 100 : 0;

    // Calculate average response time (simplified)
    const avgResponseTime = 2.5; // Mock data for now

    // Active users (unique visitor IDs)
    const activeUsers = new Set(conversations.map(c => c.visitor_id)).size;

    // Top chatbots
    const chatbotStats: Record<string, {id: string, name: string, conversations: number, leads: number}> = conversations.reduce((acc: any, conv) => {
      const botId = conv.chatbots?.id;
      const botName = conv.chatbots?.name || 'Unknown';
      
      if (!acc[botId]) {
        acc[botId] = { id: botId, name: botName, conversations: 0, leads: 0 };
      }
      
      acc[botId].conversations++;
      if (conv.leads?.length > 0) {
        acc[botId].leads++;
      }
      
      return acc;
    }, {});

    const topChatbots = Object.values(chatbotStats)
      .sort((a: any, b: any) => b.conversations - a.conversations)
      .slice(0, 5);

    // Conversation trends (daily data)
    const trendData: Record<string, {date: string, conversations: number, leads: number}> = conversations.reduce((acc: any, conv) => {
      const date = new Date(conv.started_at).toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = { date, conversations: 0, leads: 0 };
      }
      
      acc[date].conversations++;
      if (conv.leads?.length > 0) {
        acc[date].leads++;
      }
      
      return acc;
    }, {});

    const conversationTrends = Object.values(trendData).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Message distribution by hour
    const messageDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      messages: messages.filter(m => 
        new Date(m.created_at).getHours() === hour
      ).length
    }));

    // Lead sources
    const sourceStats: Record<string, number> = conversations.reduce((acc: Record<string, number>, conv) => {
      const source = conv.leads?.[0]?.source || 'No lead captured';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    const totalSources = Object.values(sourceStats).reduce((sum: number, count: number) => {
      return sum + count;
    }, 0);
    
    const leadSources = Object.entries(sourceStats).map(([source, count]: [string, number]) => ({
      source,
      count,
      percentage: totalSources > 0 ? (count / totalSources) * 100 : 0
    }));

    // Status distribution
    const statusStats: Record<string, number> = conversations.reduce((acc: Record<string, number>, conv) => {
      const status = conv.leads?.[0]?.status || 'no_lead';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusColors: Record<string, string> = {
      new: '#3B82F6',
      contacted: '#F59E0B',
      qualified: '#8B5CF6',
      converted: '#10B981',
      lost: '#EF4444',
      no_lead: '#6B7280'
    };

    const statusDistribution = Object.entries(statusStats).map(([status, count]: [string, number]) => ({
      status: status === 'no_lead' ? 'No Lead' : status.charAt(0).toUpperCase() + status.slice(1),
      count,
      color: statusColors[status] || '#6B7280'
    }));

    // Conversion Funnel Analysis
    const conversionFunnel = [
      { stage: 'Visitors', count: totalConversations, percentage: 100 },
      { stage: 'Started Conversation', count: totalConversations, percentage: 100, dropoff: 0 },
      { stage: 'Engaged (2+ messages)', count: Math.floor(totalConversations * 0.75), percentage: 75, dropoff: 25 },
      { stage: 'Provided Contact Info', count: totalLeads, percentage: conversionRate, dropoff: 75 - conversionRate },
      { stage: 'Qualified Lead', count: Math.floor(totalLeads * 0.6), percentage: conversionRate * 0.6, dropoff: conversionRate * 0.4 }
    ];

    // Popular Questions Analysis
    const questionCounts: Record<string, number> = {};
    events.forEach((event: any) => {
      if (event.event_data?.message) {
        const message = event.event_data.message.toLowerCase();
        // Simple keyword extraction for common questions
        const commonQuestions = [
          'pricing', 'cost', 'price', 'how much',
          'hours', 'when', 'time', 'schedule',
          'location', 'where', 'address',
          'contact', 'phone', 'email',
          'support', 'help', 'assistance',
          'features', 'what', 'how does',
          'demo', 'trial', 'test'
        ];
        
        commonQuestions.forEach(keyword => {
          if (message.includes(keyword)) {
            questionCounts[keyword] = (questionCounts[keyword] || 0) + 1;
          }
        });
      }
    });

    const totalQuestions = Object.values(questionCounts).reduce((sum, count) => sum + count, 0);
    const popularQuestions = Object.entries(questionCounts)
      .map(([question, count]) => ({
        question: `Questions about ${question}`,
        count,
        percentage: totalQuestions > 0 ? (count / totalQuestions) * 100 : 0,
        trend: 'stable' as const
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalConversations,
      totalLeads,
      totalMessages,
      avgResponseTime,
      conversionRate,
      activeUsers,
      topChatbots: topChatbots as any,
      conversationTrends: conversationTrends as any,
      messageDistribution,
      leadSources,
      statusDistribution,
      conversionFunnel,
      popularQuestions
    };
  };

  const exportData = async () => {
    try {
      const csvData = [
        ['Metric', 'Value'],
        ['Total Conversations', analytics.totalConversations],
        ['Total Leads', analytics.totalLeads],
        ['Total Messages', analytics.totalMessages],
        ['Conversion Rate', `${analytics.conversionRate.toFixed(2)}%`],
        ['Active Users', analytics.activeUsers],
        ['Avg Response Time', `${analytics.avgResponseTime}s`],
        ['', ''],
        ['Top Chatbots', ''],
        ...analytics.topChatbots.map(bot => [bot.name, `${bot.conversations} conversations, ${bot.leads} leads`])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `analytics-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Analytics data exported successfully",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export analytics data",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchAnalytics}
              disabled={refreshing}
            >
              {refreshing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <PDFReport 
              analytics={analytics} 
              dateRange={dateRange} 
              chatbotName={selectedChatbot !== 'all' ? chatbots.find(c => c.id === selectedChatbot)?.name : undefined}
            />
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedChatbot} onValueChange={setSelectedChatbot}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Chatbots</SelectItem>
              {chatbots.map(chatbot => (
                <SelectItem key={chatbot.id} value={chatbot.id}>
                  {chatbot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-8">
        {/* Real-time Dashboard */}
        <div className="mb-8">
          <RealtimeDashboard chatbotId={selectedChatbot} />
        </div>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversations</p>
                  <p className="text-2xl font-bold">{analytics.totalConversations}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Leads</p>
                  <p className="text-2xl font-bold">{analytics.totalLeads}</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Messages</p>
                  <p className="text-2xl font-bold">{analytics.totalMessages}</p>
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{analytics.activeUsers}</p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion</p>
                  <p className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                  <p className="text-2xl font-bold">{analytics.avgResponseTime}s</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Conversation Trends</CardTitle>
                  <CardDescription>Daily conversations and lead generation</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.conversationTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="conversations" stroke="#3B82F6" name="Conversations" />
                      <Line type="monotone" dataKey="leads" stroke="#10B981" name="Leads" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Message Activity</CardTitle>
                  <CardDescription>Messages by hour of day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.messageDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="messages" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Sources</CardTitle>
                  <CardDescription>Where your leads are coming from</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={analytics.leadSources}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ source, percentage }) => `${source}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics.leadSources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lead Status</CardTitle>
                  <CardDescription>Current status of all leads</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.statusDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Chatbots</CardTitle>
                <CardDescription>Chatbots with the most conversations and leads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topChatbots.map((chatbot, index) => (
                    <div key={chatbot.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">#{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{chatbot.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {chatbot.conversations} conversations • {chatbot.leads} leads
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {chatbot.conversations > 0 ? ((chatbot.leads / chatbot.conversations) * 100).toFixed(1) : 0}%
                        </p>
                        <p className="text-sm text-muted-foreground">conversion</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funnel" className="space-y-6">
            <ConversionFunnel data={analytics.conversionFunnel} />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PopularQuestions questions={analytics.popularQuestions} />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Performance Insights
                  </CardTitle>
                  <CardDescription>Key findings and recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.conversionRate >= 20 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-medium text-green-800">🎉 Excellent conversion rate!</p>
                        <p className="text-sm text-green-600">Your {analytics.conversionRate.toFixed(1)}% conversion rate is above industry average.</p>
                      </div>
                    )}
                    
                    {analytics.conversionRate < 10 && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="font-medium text-yellow-800">💡 Optimization opportunity</p>
                        <p className="text-sm text-yellow-600">Consider improving your chatbot flows to increase the {analytics.conversionRate.toFixed(1)}% conversion rate.</p>
                      </div>
                    )}
                    
                    {analytics.avgResponseTime > 5 && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="font-medium text-blue-800">⚡ Speed improvement</p>
                        <p className="text-sm text-blue-600">Response time of {analytics.avgResponseTime}s could be optimized for better user experience.</p>
                      </div>
                    )}
                    
                    {analytics.totalConversations > 100 && (
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="font-medium text-purple-800">📊 Rich data available</p>
                        <p className="text-sm text-purple-600">With {analytics.totalConversations} conversations, you have enough data for advanced analytics.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Analytics;