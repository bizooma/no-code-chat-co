import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Minimize2, Video } from 'lucide-react';
import { useVideoFlowState } from '@/hooks/useVideoFlowState';
import { VideoPlayer } from '@/components/video/VideoPlayer';

enum WidgetState {
  MINIMIZED = 'minimized',
  PLAYING = 'playing',
  COLLECTING_LEAD = 'lead',
  COMPLETED = 'completed',
}

interface VideoFlowWidgetProps {
  chatbotId: string;
  position?: 'bottom-right' | 'bottom-left';
}

export const VideoFlowWidget = ({ chatbotId, position = 'bottom-right' }: VideoFlowWidgetProps) => {
  const [widgetState, setWidgetState] = useState<WidgetState>(WidgetState.MINIMIZED);
  const [visitorId] = useState(() => `visitor-${Date.now()}`);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '' });

  const { state, loading, initializeFlow, moveToNextNode, captureLeadData, getCurrentNode } = useVideoFlowState(
    chatbotId,
    visitorId
  );

  useEffect(() => {
    if (widgetState !== WidgetState.MINIMIZED && !state.currentNodeId) {
      initializeFlow();
    }
  }, [widgetState, state.currentNodeId, initializeFlow]);

  const currentNode = getCurrentNode();

  const handleOpen = () => {
    setWidgetState(WidgetState.PLAYING);
  };

  const handleMinimize = () => {
    setWidgetState(WidgetState.MINIMIZED);
  };

  const handleClose = () => {
    setWidgetState(WidgetState.MINIMIZED);
  };

  const handleResponseClick = async (responseId: string) => {
    await moveToNextNode(responseId);
    // Stay in PLAYING state to show next video with its buttons
  };

  const handleLeadSubmit = async () => {
    await captureLeadData(leadForm);
    setWidgetState(WidgetState.COMPLETED);
  };

  const positionClasses = position === 'bottom-right' 
    ? 'bottom-6 right-6' 
    : 'bottom-6 left-6';

  if (widgetState === WidgetState.MINIMIZED) {
    return (
      <div className={`fixed ${positionClasses} z-50`}>
        <Button
          size="lg"
          className="h-16 w-16 rounded-full shadow-lg"
          onClick={handleOpen}
        >
          <Video className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed ${positionClasses} z-50 w-96`}>
      <Card className="shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">{currentNode?.title || 'Video Bot'}</h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleMinimize}>
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading && (
            <div className="text-center py-8">Loading...</div>
          )}

          {!loading && widgetState === WidgetState.PLAYING && currentNode && (
            <div className="relative">
              {currentNode.video_url && (
                <div className="relative">
                  <VideoPlayer
                    type={currentNode.video_url.includes('youtube') ? 'youtube' : 'uploaded'}
                    url={currentNode.video_url}
                    autoplay
                    controls
                  />
                  
                  {/* Overlay Buttons - Shown during video playback */}
                  {currentNode.responses && currentNode.responses.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
                      <div className="space-y-2">
                        {currentNode.responses.map((response) => (
                          <Button
                            key={response.id}
                            className="w-full bg-white/95 hover:bg-white text-black font-medium shadow-lg backdrop-blur-sm"
                            onClick={() => handleResponseClick(response.id)}
                          >
                            {response.text}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {currentNode.description && (
                <p className="mt-4 text-sm text-muted-foreground">{currentNode.description}</p>
              )}
            </div>
          )}

          {widgetState === WidgetState.COLLECTING_LEAD && (
            <div className="space-y-4 mt-4">
              <h3 className="font-semibold">Get in Touch</h3>
              <Input
                placeholder="Your Name"
                value={leadForm.name}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
              />
              <Input
                type="email"
                placeholder="Your Email"
                value={leadForm.email}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
              />
              <Input
                type="tel"
                placeholder="Your Phone"
                value={leadForm.phone}
                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
              />
              <Button onClick={handleLeadSubmit} className="w-full">
                Submit
              </Button>
            </div>
          )}

          {widgetState === WidgetState.COMPLETED && (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
              <p className="text-sm text-muted-foreground">We'll be in touch soon.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
