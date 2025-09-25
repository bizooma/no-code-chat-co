import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Eye, 
  Clock, 
  TrendingUp,
  Users,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface VideoAnalyticsProps {
  chatbotId: string;
}

interface VideoStat {
  video_url: string;
  video_type: string;
  total_views: number;
  unique_viewers: number;
  total_playtime: number;
  avg_completion_rate: number;
  interactions: number;
  conversions: number;
}

interface VideoEvent {
  id: string;
  event_type: string;
  event_data: any;
  timestamp: string;
  completion_rate: number;
  session_duration: number;
  visitor_id: string;
}

export const VideoAnalytics: React.FC<VideoAnalyticsProps> = ({ chatbotId }) => {
  const [stats, setStats] = useState<VideoStat[]>([]);
  const [events, setEvents] = useState<VideoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    fetchVideoAnalytics();
  }, [chatbotId, timeRange]);

  const fetchVideoAnalytics = async () => {
    try {
      setLoading(true);
      
      const timeFilter = getTimeFilter();
      
      // Fetch video statistics
      const { data: statsData, error: statsError } = await supabase
        .from('video_analytics')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .gte('created_at', timeFilter);

      if (statsError) throw statsError;

      // Process statistics
      const processedStats = processVideoStats(statsData || []);
      setStats(processedStats);

      // Fetch recent events
      const { data: eventsData, error: eventsError } = await supabase
        .from('video_analytics')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .gte('created_at', timeFilter)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

    } catch (error) {
      console.error('Error fetching video analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const processVideoStats = (data: any[]): VideoStat[] => {
    const groupedData = data.reduce((acc, event) => {
      const key = `${event.video_url}-${event.video_type}`;
      
      if (!acc[key]) {
        acc[key] = {
          video_url: event.video_url,
          video_type: event.video_type,
          views: new Set(),
          unique_viewers: new Set(),
          total_playtime: 0,
          completion_rates: [],
          interactions: 0,
          conversions: 0
        };
      }

      const stats = acc[key];
      
      if (event.event_type === 'video_started') {
        stats.views.add(event.id);
        stats.unique_viewers.add(event.visitor_id);
      }
      
      if (event.session_duration) {
        stats.total_playtime += event.session_duration;
      }
      
      if (event.completion_rate) {
        stats.completion_rates.push(event.completion_rate);
      }
      
      if (event.event_type === 'video_interaction') {
        stats.interactions++;
      }
      
      if (event.event_type === 'video_ended' && event.completion_rate >= 80) {
        stats.conversions++;
      }

      return acc;
    }, {});

    return Object.values(groupedData).map((stats: any) => ({
      video_url: stats.video_url,
      video_type: stats.video_type,
      total_views: stats.views.size,
      unique_viewers: stats.unique_viewers.size,
      total_playtime: stats.total_playtime,
      avg_completion_rate: stats.completion_rates.length > 0 
        ? stats.completion_rates.reduce((a: number, b: number) => a + b, 0) / stats.completion_rates.length 
        : 0,
      interactions: stats.interactions,
      conversions: stats.conversions
    }));
  };

  const getTotalStats = () => {
    return stats.reduce((acc, stat) => ({
      total_views: acc.total_views + stat.total_views,
      unique_viewers: acc.unique_viewers + stat.unique_viewers,
      total_playtime: acc.total_playtime + stat.total_playtime,
      avg_completion_rate: stats.length > 0 
        ? stats.reduce((sum, s) => sum + s.avg_completion_rate, 0) / stats.length 
        : 0,
      interactions: acc.interactions + stat.interactions,
      conversions: acc.conversions + stat.conversions
    }), { total_views: 0, unique_viewers: 0, total_playtime: 0, avg_completion_rate: 0, interactions: 0, conversions: 0 });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'video_started':
      case 'video_played':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'video_paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'video_ended':
        return <SkipForward className="h-4 w-4 text-blue-500" />;
      case 'video_interaction':
        return <Target className="h-4 w-4 text-purple-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const totalStats = getTotalStats();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Video Analytics</h2>
        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '24h' ? 'Last 24h' : range === '7d' ? 'Last 7 days' : 'Last 30 days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalStats.total_views}</p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalStats.unique_viewers}</p>
                <p className="text-sm text-muted-foreground">Unique Viewers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{formatDuration(totalStats.total_playtime)}</p>
                <p className="text-sm text-muted-foreground">Watch Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{Math.round(totalStats.avg_completion_rate)}%</p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalStats.interactions}</p>
                <p className="text-sm text-muted-foreground">Interactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalStats.conversions}</p>
                <p className="text-sm text-muted-foreground">Conversions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="videos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="videos">Video Performance</TabsTrigger>
          <TabsTrigger value="events">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{stat.video_url.split('/').pop()}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {stat.video_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {stat.total_views} views • {stat.unique_viewers} unique
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Watch Time</p>
                    <p className="font-medium">{formatDuration(stat.total_playtime)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completion</p>
                    <p className="font-medium">{Math.round(stat.avg_completion_rate)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interactions</p>
                    <p className="font-medium">{stat.interactions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conversions</p>
                    <p className="font-medium">{stat.conversions}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completion Rate</span>
                    <span>{Math.round(stat.avg_completion_rate)}%</span>
                  </div>
                  <Progress value={stat.avg_completion_rate} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Video Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.slice(0, 20).map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    {getEventIcon(event.event_type)}
                    <div className="flex-1">
                      <p className="font-medium capitalize">
                        {event.event_type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      {event.completion_rate && (
                        <Badge variant="outline">
                          {Math.round(event.completion_rate)}% complete
                        </Badge>
                      )}
                      {event.session_duration && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDuration(event.session_duration)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};