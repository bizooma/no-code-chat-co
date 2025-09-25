import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from './VideoPlayer';
import { 
  Monitor, 
  Smartphone, 
  Maximize2, 
  Grid2X2,
  Layers
} from 'lucide-react';

interface VideoLayoutPreviewProps {
  selectedLayout: string;
  onLayoutChange: (layout: string) => void;
}

const layouts = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Classic 16:9 video player',
    icon: Monitor,
    preview: 'aspect-video',
    recommended: 'General content, tutorials'
  },
  {
    id: 'portrait',
    name: 'Portrait',
    description: 'Mobile-optimized 9:16 format',
    icon: Smartphone,
    preview: 'aspect-[9/16] max-w-sm',
    recommended: 'Mobile users, spokesperson videos'
  },
  {
    id: 'landscape',
    name: 'Landscape',
    description: 'Ultra-wide 21:9 cinematic',
    icon: Maximize2,
    preview: 'aspect-[21/9]',
    recommended: 'Cinematic content, presentations'
  },
  {
    id: 'split',
    name: 'Split Screen',
    description: 'Side-by-side dual content',
    icon: Grid2X2,
    preview: 'aspect-video',
    recommended: 'Comparison videos, before/after'
  },
  {
    id: 'overlay',
    name: 'Overlay',
    description: 'Interactive overlay elements',
    icon: Layers,
    preview: 'aspect-video',
    recommended: 'Interactive content, CTAs'
  }
];

export const VideoLayoutPreview: React.FC<VideoLayoutPreviewProps> = ({
  selectedLayout,
  onLayoutChange
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Video Layout</h3>
        <p className="text-sm text-muted-foreground">
          Choose how your videos will be displayed to optimize for your audience and content type.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {layouts.map((layout) => {
          const Icon = layout.icon;
          const isSelected = selectedLayout === layout.id;
          
          return (
            <Card 
              key={layout.id}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'ring-2 ring-video-primary border-video-primary bg-video-primary/5' 
                  : 'hover:border-video-primary/50'
              }`}
              onClick={() => onLayoutChange(layout.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-video-primary" />
                    <CardTitle className="text-base">{layout.name}</CardTitle>
                  </div>
                  {isSelected && (
                    <Badge className="bg-video-primary text-white">Selected</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{layout.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Layout Preview */}
                <div className="flex justify-center">
                  <div 
                    className={`bg-gradient-to-br from-video-primary/20 to-video-accent/20 rounded-lg ${layout.preview} w-full max-w-[200px] border-2 border-dashed border-video-primary/30 flex items-center justify-center`}
                  >
                    <Icon className="h-8 w-8 text-video-primary/60" />
                  </div>
                </div>

                {/* Recommended Use */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Best for:</span> {layout.recommended}
                  </p>
                </div>
                
                {/* Select Button */}
                <Button 
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayoutChange(layout.id);
                  }}
                >
                  {isSelected ? 'Selected' : 'Select Layout'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Live Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Live Preview
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Preview how your selected layout will look with actual content.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <VideoPlayer
                type="youtube"
                url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                layout={selectedLayout as any}
                controls={true}
                className="shadow-video"
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Layout: <span className="font-medium capitalize">{selectedLayout}</span>
              </span>
              <Badge variant="outline" className="text-xs">
                {layouts.find(l => l.id === selectedLayout)?.name || 'Standard'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};