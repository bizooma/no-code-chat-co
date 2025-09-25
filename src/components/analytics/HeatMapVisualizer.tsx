import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MousePointer, 
  Eye, 
  Clock, 
  BarChart3,
  Download,
  Settings,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HeatMapData {
  id: string;
  chatbot_id: string;
  conversation_id?: string;
  visitor_id: string;
  video_url: string;
  interaction_data: {
    x: number;
    y: number;
    timestamp: number;
    type: 'click' | 'hover' | 'scroll';
    duration?: number;
  };
  viewport_size: {
    width: number;
    height: number;
  };
  created_at: string;
}

interface HeatMapVisualizerProps {
  chatbotId: string;
  videoUrl?: string;
}

export const HeatMapVisualizer: React.FC<HeatMapVisualizerProps> = ({
  chatbotId,
  videoUrl
}) => {
  const [heatMapData, setHeatMapData] = useState<HeatMapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string>(videoUrl || 'all');
  const [viewMode, setViewMode] = useState<'clicks' | 'hovers' | 'combined'>('combined');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHeatMapData();
  }, [chatbotId, selectedVideo]);

  useEffect(() => {
    if (heatMapData.length > 0) {
      renderHeatMap();
    }
  }, [heatMapData, viewMode]);

  const fetchHeatMapData = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('video_heatmaps')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (selectedVideo !== 'all') {
        query = query.eq('video_url', selectedVideo);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHeatMapData((data || []) as HeatMapData[]);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHeatMap = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (!canvas || !container || heatMapData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to container size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter data based on view mode
    const filteredData = heatMapData.filter(item => {
      if (viewMode === 'clicks') return item.interaction_data.type === 'click';
      if (viewMode === 'hovers') return item.interaction_data.type === 'hover';
      return true; // combined
    });

    // Create intensity map
    const intensityMap: { [key: string]: number } = {};
    const gridSize = 20;

    filteredData.forEach(item => {
      const { x, y } = item.interaction_data;
      const { width, height } = item.viewport_size;
      
      // Normalize coordinates to canvas size
      const normalizedX = (x / width) * canvas.width;
      const normalizedY = (y / height) * canvas.height;
      
      // Grid coordinates
      const gridX = Math.floor(normalizedX / gridSize) * gridSize;
      const gridY = Math.floor(normalizedY / gridSize) * gridSize;
      const key = `${gridX},${gridY}`;
      
      intensityMap[key] = (intensityMap[key] || 0) + 1;
    });

    // Find max intensity for normalization
    const maxIntensity = Math.max(...Object.values(intensityMap), 1);

    // Draw heatmap
    Object.entries(intensityMap).forEach(([key, intensity]) => {
      const [x, y] = key.split(',').map(Number);
      const normalizedIntensity = intensity / maxIntensity;
      
      // Color gradient from blue (low) to red (high)
      const hue = (1 - normalizedIntensity) * 240; // 240 = blue, 0 = red
      const saturation = 70;
      const lightness = 50;
      const alpha = normalizedIntensity * 0.8;
      
      ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
      ctx.fillRect(x, y, gridSize, gridSize);
    });

    // Add individual interaction points for recent activity
    const recentData = filteredData.slice(0, 50);
    recentData.forEach(item => {
      const { x, y, type } = item.interaction_data;
      const { width, height } = item.viewport_size;
      
      const normalizedX = (x / width) * canvas.width;
      const normalizedY = (y / height) * canvas.height;
      
      ctx.beginPath();
      ctx.arc(normalizedX, normalizedY, type === 'click' ? 4 : 2, 0, 2 * Math.PI);
      ctx.fillStyle = type === 'click' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
      ctx.strokeStyle = type === 'click' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  };

  const getInteractionSummary = () => {
    const totalInteractions = heatMapData.length;
    const clicks = heatMapData.filter(item => item.interaction_data.type === 'click').length;
    const hovers = heatMapData.filter(item => item.interaction_data.type === 'hover').length;
    const uniqueVisitors = new Set(heatMapData.map(item => item.visitor_id)).size;

    return { totalInteractions, clicks, hovers, uniqueVisitors };
  };

  const getVideoUrls = () => {
    const urls = new Set(heatMapData.map(item => item.video_url));
    return Array.from(urls);
  };

  const exportHeatMapData = () => {
    const dataStr = JSON.stringify(heatMapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `heatmap-data-${chatbotId}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const summary = getInteractionSummary();
  const videoUrls = getVideoUrls();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <MousePointer className="h-6 w-6 text-video-primary" />
            Video Interaction Heatmaps
          </h2>
          <p className="text-muted-foreground">
            Visual representation of where users click and interact with your videos
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportHeatMapData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{summary.totalInteractions}</p>
                <p className="text-sm text-muted-foreground">Total Interactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{summary.clicks}</p>
                <p className="text-sm text-muted-foreground">Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{summary.hovers}</p>
                <p className="text-sm text-muted-foreground">Hovers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{summary.uniqueVisitors}</p>
                <p className="text-sm text-muted-foreground">Unique Visitors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Interaction Heatmap
            <div className="flex items-center gap-2">
              <select
                value={selectedVideo}
                onChange={(e) => setSelectedVideo(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">All Videos</option>
                {videoUrls.map((url, index) => (
                  <option key={index} value={url}>
                    {url.split('/').pop()?.substring(0, 30)}...
                  </option>
                ))}
              </select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <TabsList className="mb-4">
              <TabsTrigger value="combined">All Interactions</TabsTrigger>
              <TabsTrigger value="clicks">Clicks Only</TabsTrigger>
              <TabsTrigger value="hovers">Hovers Only</TabsTrigger>
            </TabsList>

            <TabsContent value={viewMode} className="space-y-4">
              {heatMapData.length > 0 ? (
                <div>
                  <div 
                    ref={containerRef}
                    className="relative w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden"
                  >
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                    <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span>Low Activity</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span>High Activity</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>
                      Showing {heatMapData.length} interactions across {summary.uniqueVisitors} unique visitors.
                      Warmer colors indicate higher interaction density.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <MousePointer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Interaction Data Yet</h3>
                  <p className="text-muted-foreground">
                    Interaction heatmaps will appear here once users start engaging with your videos
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};