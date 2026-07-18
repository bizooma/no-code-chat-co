import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Sankey, Rectangle
} from 'recharts';
import { TrendingDown, TrendingUp, Users, Play, CheckCircle, BarChart3 } from 'lucide-react';

interface VideoFlowAnalyticsProps {
  chatbotId: string;
  timeRange?: '24h' | '7d' | '30d' | 'all';
}

interface NodeMetrics {
  node_id: string;
  node_title: string;
  views: number;
  completions: number;
  dropoffs: number;
  avg_watch_time: number;
  responses: Record<string, number>;
}

interface PathData {
  from_node: string;
  to_node: string;
  count: number;
}

interface CompletionData {
  completed: number;
  partial: number;
  abandoned: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
];

export const VideoFlowAnalytics = ({ chatbotId, timeRange = '7d' }: VideoFlowAnalyticsProps) => {
  const [loading, setLoading] = useState(true);
  const [nodeMetrics, setNodeMetrics] = useState<NodeMetrics[]>([]);
  const [pathData, setPathData] = useState<PathData[]>([]);
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);
  const [engagementData, setEngagementData] = useState<any[]>([]);
  const [leadCaptureRate, setLeadCaptureRate] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, [chatbotId, timeRange]);

  const getTimeFilter = () => {
    const now = new Date();
    const filters: Record<string, string> = {
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      'all': new Date(0).toISOString(),
    };
    return filters[timeRange];
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const timeFilter = getTimeFilter();

      // Fetch all analytics events
      const { data: events } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .gte('created_at', timeFilter)
        .order('created_at', { ascending: true });

      // Fetch conversation messages for node tracking
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, status, started_at, ended_at')
        .eq('chatbot_id', chatbotId)
        .gte('started_at', timeFilter);

      const conversationIds = conversations?.map(c => c.id) || [];

      const { data: messages } = await supabase
        .from('conversation_messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: true });

      // Fetch video analytics
      const { data: videoAnalytics } = await supabase
        .from('video_analytics')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .gte('created_at', timeFilter);

      // Process metrics
      if (events && conversations && messages && videoAnalytics) {
        processNodeMetrics(messages, videoAnalytics, events);
        processPathData(messages);
        processCompletionData(conversations);
        processEngagementData(events);
        processLeadCaptureRate(events);
      }
    } catch (error) {
      console.error('[VIDEO-FLOW-ANALYTICS] Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processNodeMetrics = (messages: any[], videoAnalytics: any[], events: any[]) => {
    const nodeMap = new Map<string, NodeMetrics>();

    // Process messages to count views and track nodes
    messages.forEach(msg => {
      if (msg.sender === 'bot' && msg.metadata?.node_id) {
        const nodeId = msg.metadata.node_id;
        if (!nodeMap.has(nodeId)) {
          nodeMap.set(nodeId, {
            node_id: nodeId,
            node_title: msg.message_text || 'Untitled Node',
            views: 0,
            completions: 0,
            dropoffs: 0,
            avg_watch_time: 0,
            responses: {},
          });
        }
        const node = nodeMap.get(nodeId)!;
        node.views++;
      }
    });

    // Process video analytics for watch time
    const watchTimeMap = new Map<string, number[]>();
    videoAnalytics.forEach(va => {
      const nodeId = va.event_data?.node_id;
      if (nodeId) {
        if (!watchTimeMap.has(nodeId)) {
          watchTimeMap.set(nodeId, []);
        }
        if (va.session_duration) {
          watchTimeMap.get(nodeId)!.push(va.session_duration);
        }
      }
    });

    watchTimeMap.forEach((times, nodeId) => {
      const node = nodeMap.get(nodeId);
      if (node) {
        node.avg_watch_time = times.reduce((a, b) => a + b, 0) / times.length;
      }
    });

    // Process button clicks for response distribution
    events
      .filter(e => e.event_type === 'button_clicked')
      .forEach(event => {
        const nodeId = event.event_data?.node_id;
        const responseText = event.event_data?.response_text;
        if (nodeId && responseText) {
          const node = nodeMap.get(nodeId);
          if (node) {
            node.responses[responseText] = (node.responses[responseText] || 0) + 1;
          }
        }
      });

    // Calculate dropoffs (views without corresponding next action)
    const conversationNodeSequences = new Map<string, string[]>();
    messages.forEach(msg => {
      const convId = msg.conversation_id;
      const nodeId = msg.metadata?.node_id;
      if (nodeId) {
        if (!conversationNodeSequences.has(convId)) {
          conversationNodeSequences.set(convId, []);
        }
        conversationNodeSequences.get(convId)!.push(nodeId);
      }
    });

    conversationNodeSequences.forEach(sequence => {
      sequence.forEach((nodeId, index) => {
        const node = nodeMap.get(nodeId);
        if (node) {
          // If this is not the last node in sequence, it was completed
          if (index < sequence.length - 1) {
            node.completions++;
          } else {
            // Last node = potential dropoff
            node.dropoffs++;
          }
        }
      });
    });

    setNodeMetrics(Array.from(nodeMap.values()));
  };

  const processPathData = (messages: any[]) => {
    const pathMap = new Map<string, number>();
    const conversationPaths = new Map<string, string[]>();

    // Group messages by conversation
    messages.forEach(msg => {
      const convId = msg.conversation_id;
      const nodeId = msg.metadata?.node_id;
      if (nodeId) {
        if (!conversationPaths.has(convId)) {
          conversationPaths.set(convId, []);
        }
        conversationPaths.get(convId)!.push(nodeId);
      }
    });

    // Count transitions
    conversationPaths.forEach(path => {
      for (let i = 0; i < path.length - 1; i++) {
        const from = path[i];
        const to = path[i + 1];
        const key = `${from}->${to}`;
        pathMap.set(key, (pathMap.get(key) || 0) + 1);
      }
    });

    const paths: PathData[] = [];
    pathMap.forEach((count, key) => {
      const [from, to] = key.split('->');
      paths.push({ from_node: from, to_node: to, count });
    });

    setPathData(paths.sort((a, b) => b.count - a.count).slice(0, 20));
  };

  const processCompletionData = (conversations: any[]) => {
    let completed = 0;
    let partial = 0;
    let abandoned = 0;

    conversations.forEach(conv => {
      if (conv.status === 'ended' && conv.ended_at) {
        completed++;
      } else if (conv.status === 'active') {
        const startTime = new Date(conv.started_at).getTime();
        const now = Date.now();
        const timeDiff = now - startTime;
        // Consider abandoned if active for more than 1 hour
        if (timeDiff > 60 * 60 * 1000) {
          abandoned++;
        } else {
          partial++;
        }
      } else {
        partial++;
      }
    });

    setCompletionData({ completed, partial, abandoned });
  };

  const processEngagementData = (events: any[]) => {
    const dailyEngagement = new Map<string, { date: string; interactions: number; completions: number }>();

    events.forEach(event => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      if (!dailyEngagement.has(date)) {
        dailyEngagement.set(date, { date, interactions: 0, completions: 0 });
      }
      const day = dailyEngagement.get(date)!;
      
      if (event.event_type === 'button_clicked' || event.event_type === 'message_sent') {
        day.interactions++;
      }
      if (event.event_type === 'conversation_completed') {
        day.completions++;
      }
    });

    setEngagementData(
      Array.from(dailyEngagement.values()).sort((a, b) => a.date.localeCompare(b.date))
    );
  };

  const processLeadCaptureRate = (events: any[]) => {
    const leadFormViews = events.filter(e => 
      e.event_type === 'message_sent' && e.event_data?.node_type === 'form'
    ).length;
    
    const leadCaptures = events.filter(e => e.event_type === 'lead_captured').length;

    const rate = leadFormViews > 0 ? (leadCaptures / leadFormViews) * 100 : 0;
    setLeadCaptureRate(Math.round(rate));
  };

  const calculateDropoffRate = (node: NodeMetrics) => {
    if (node.views === 0) return 0;
    return Math.round((node.dropoffs / node.views) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const overviewMetrics = [
    {
      label: 'Total Interactions',
      value: nodeMetrics.reduce((sum, n) => sum + n.views, 0),
      icon: Play,
    },
    {
      label: 'Completion Rate',
      value: completionData ? `${Math.round((completionData.completed / (completionData.completed + completionData.partial + completionData.abandoned)) * 100)}%` : '0%',
      icon: CheckCircle,
    },
    {
      label: 'Lead Capture Rate',
      value: `${leadCaptureRate}%`,
      icon: Users,
    },
    {
      label: 'Avg. Watch Time',
      value: nodeMetrics.length > 0 
        ? `${Math.round(nodeMetrics.reduce((sum, n) => sum + n.avg_watch_time, 0) / nodeMetrics.length)}s`
        : '0s',
      icon: BarChart3,
    },
  ];

  const completionChartData = completionData ? [
    { name: 'Completed', value: completionData.completed, color: 'hsl(var(--primary))' },
    { name: 'Partial', value: completionData.partial, color: 'hsl(var(--secondary))' },
    { name: 'Abandoned', value: completionData.abandoned, color: 'hsl(var(--destructive))' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funnel">Funnel Analysis</TabsTrigger>
          <TabsTrigger value="paths">Flow Paths</TabsTrigger>
          <TabsTrigger value="completion">Completion</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        {/* Funnel Analysis */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Node Drop-off Analysis</CardTitle>
              <CardDescription>Where users are leaving your video flow</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={nodeMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="node_title" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    stroke="hsl(var(--foreground))"
                  />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="views" fill="hsl(var(--primary))" name="Views" />
                  <Bar dataKey="completions" fill="hsl(var(--secondary))" name="Completions" />
                  <Bar dataKey="dropoffs" fill="hsl(var(--destructive))" name="Drop-offs" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Distribution</CardTitle>
              <CardDescription>Most popular choices at each decision point</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {nodeMetrics.filter(n => Object.keys(n.responses).length > 0).map((node) => (
                <div key={node.node_id} className="space-y-2">
                  <h4 className="text-sm font-medium">{node.node_title}</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart
                      data={Object.entries(node.responses).map(([text, count]) => ({
                        response: text.length > 30 ? text.substring(0, 30) + '...' : text,
                        count,
                      }))}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--foreground))" />
                      <YAxis dataKey="response" type="category" width={150} stroke="hsl(var(--foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--accent))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flow Paths */}
        <TabsContent value="paths">
          <Card>
            <CardHeader>
              <CardTitle>Most Common Flow Paths</CardTitle>
              <CardDescription>Top 20 node transitions in your video flow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pathData.map((path, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <span className="text-sm">{path.from_node}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-sm">{path.to_node}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{path.count}</span>
                      <span className="text-xs text-muted-foreground">transitions</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completion Rate */}
        <TabsContent value="completion">
          <Card>
            <CardHeader>
              <CardTitle>Flow Completion Analysis</CardTitle>
              <CardDescription>Distribution of conversation outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={completionChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {completionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Over Time */}
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Over Time</CardTitle>
              <CardDescription>Daily interactions and completions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="interactions" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Interactions"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completions" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    name="Completions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
