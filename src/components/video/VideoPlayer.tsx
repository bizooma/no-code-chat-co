import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipForward, SkipBack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface InteractiveElement {
  id: string;
  type: 'hotspot' | 'cta' | 'chapter';
  time: number;
  duration?: number;
  position: { x: number; y: number };
  content: {
    text: string;
    action?: string;
    url?: string;
  };
}

interface VideoPlayerProps {
  type: 'youtube' | 'uploaded' | 'video_intro';
  url: string;
  autoplay?: boolean;
  controls?: boolean;
  layout?: 'standard' | 'portrait' | 'landscape' | 'split' | 'overlay';
  className?: string;
  onVideoEnd?: () => void;
  muted?: boolean;
  chatbotId?: string;
  conversationId?: string;
  visitorId?: string;
  interactiveElements?: InteractiveElement[];
  chapters?: Array<{ time: number; title: string }>;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  type,
  url,
  autoplay = false,
  controls = true,
  layout = 'standard',
  className,
  onVideoEnd,
  muted = false,
  chatbotId,
  conversationId,
  visitorId,
  interactiveElements = [],
  chapters = []
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showInteractive, setShowInteractive] = useState<InteractiveElement[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Analytics tracking
  const trackVideoEvent = async (eventType: string, eventData?: any) => {
    if (!chatbotId) return;
    
    try {
      await supabase.from('video_analytics').insert({
        chatbot_id: chatbotId,
        conversation_id: conversationId,
        visitor_id: visitorId,
        video_url: url,
        video_type: type,
        event_type: eventType,
        event_data: eventData,
        session_duration: sessionStartTime ? Math.floor((Date.now() - sessionStartTime.getTime()) / 1000) : null,
        completion_rate: duration > 0 ? Math.round((currentTime / duration) * 100) : 0
      });
    } catch (error) {
      console.error('Error tracking video event:', error);
    }
  };

  useEffect(() => {
    if (autoplay && videoRef.current) {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
      setSessionStartTime(new Date());
      trackVideoEvent('video_started', { autoplay: true });
    }
  }, [autoplay]);

  // Track interactive elements based on current time
  useEffect(() => {
    const activeElements = interactiveElements.filter(element => {
      const endTime = element.duration ? element.time + element.duration : element.time + 5;
      return currentTime >= element.time && currentTime <= endTime;
    });
    setShowInteractive(activeElements);
  }, [currentTime, interactiveElements]);

  // Track heatmap interactions
  const trackHeatmapInteraction = async (event: React.MouseEvent, type: 'click' | 'hover') => {
    if (!chatbotId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    try {
      await supabase.from('video_heatmaps').insert({
        chatbot_id: chatbotId,
        conversation_id: conversationId,
        visitor_id: visitorId,
        video_url: url,
        interaction_data: {
          x,
          y,
          timestamp: currentTime,
          type,
          duration: type === 'hover' ? 1 : undefined
        },
        viewport_size: {
          width: rect.width,
          height: rect.height
        }
      });
    } catch (error) {
      console.error('Error tracking heatmap interaction:', error);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        trackVideoEvent('video_paused', { time: currentTime });
      } else {
        videoRef.current.play().catch(console.error);
        if (!sessionStartTime) {
          setSessionStartTime(new Date());
          trackVideoEvent('video_started', { autoplay: false });
        } else {
          trackVideoEvent('video_played', { time: currentTime });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
      trackVideoEvent('video_fullscreen', { entered: true });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
      trackVideoEvent('video_fullscreen', { entered: false });
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      trackVideoEvent('video_seeked', { from: currentTime, to: seconds });
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      const newTime = Math.min(videoRef.current.currentTime + 10, duration);
      seekTo(newTime);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      const newTime = Math.max(videoRef.current.currentTime - 10, 0);
      seekTo(newTime);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    trackVideoEvent('video_ended', { 
      completion_rate: 100,
      total_watch_time: sessionStartTime ? Math.floor((Date.now() - sessionStartTime.getTime()) / 1000) : 0
    });
    onVideoEnd?.();
  };

  const handleInteractiveClick = (element: InteractiveElement) => {
    trackVideoEvent('video_interaction', { 
      element_id: element.id, 
      element_type: element.type,
      time: currentTime 
    });
    
    if (element.content.url) {
      window.open(element.content.url, '_blank');
    }
  };

  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    const videoId = extractYouTubeId(url);
    if (!videoId) return url;
    
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      controls: controls ? '1' : '0',
      mute: muted ? '1' : '0',
      rel: '0',
      modestbranding: '1'
    });
    
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  // Layout-specific classes
  const getLayoutClasses = () => {
    const baseClasses = "relative bg-black rounded-lg overflow-hidden group";
    switch (layout) {
      case 'portrait':
        return cn(baseClasses, "aspect-[9/16] max-w-sm mx-auto", className);
      case 'landscape':
        return cn(baseClasses, "aspect-[21/9] w-full", className);
      case 'split':
        return cn(baseClasses, "aspect-video grid grid-cols-2 gap-2", className);
      case 'overlay':
        return cn(baseClasses, "aspect-video", className);
      default:
        return cn(baseClasses, "aspect-video", className);
    }
  };

  if (type === 'youtube') {
    return (
      <div 
        ref={containerRef}
        className={getLayoutClasses()}
      >
        <iframe
          src={getYouTubeEmbedUrl(url)}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video"
          onLoad={() => {
            if (autoplay) {
              setSessionStartTime(new Date());
              trackVideoEvent('video_started', { autoplay: true });
            }
          }}
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={getLayoutClasses()}
    >
      <video
        ref={videoRef}
        src={url}
        className="w-full h-full object-cover"
        muted={isMuted}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleVideoEnd}
        onTimeUpdate={(e) => {
          const video = e.target as HTMLVideoElement;
          setCurrentTime(video.currentTime);
          setDuration(video.duration);
        }}
        onLoadedMetadata={(e) => {
          const video = e.target as HTMLVideoElement;
          setDuration(video.duration);
        }}
        onClick={(e) => {
          togglePlay();
          trackHeatmapInteraction(e, 'click');
        }}
        onMouseMove={(e) => {
          // Track hover interactions periodically
          if (Math.random() < 0.1) { // Sample 10% of hover events
            trackHeatmapInteraction(e, 'hover');
          }
        }}
      />
      
      {/* Interactive Elements */}
      {showInteractive.map((element) => (
        <div
          key={element.id}
          className="absolute z-10 bg-primary/90 text-primary-foreground p-2 rounded-lg shadow-lg animate-pulse cursor-pointer"
          style={{
            left: `${element.position.x}%`,
            top: `${element.position.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
          onClick={() => handleInteractiveClick(element)}
        >
          <p className="text-xs font-medium">{element.content.text}</p>
          {element.content.action && (
            <p className="text-xs opacity-80">{element.content.action}</p>
          )}
        </div>
      ))}

      {/* Progress Bar */}
      {controls && duration > 0 && (
        <div className="absolute bottom-16 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-full bg-white/20 h-1 rounded-full">
            <div 
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          {chapters.length > 0 && (
            <div className="flex justify-between mt-1">
              {chapters.map((chapter, index) => (
                <button
                  key={index}
                  className="text-xs text-white/80 hover:text-white cursor-pointer"
                  onClick={() => seekTo(chapter.time)}
                >
                  {chapter.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {controls && (
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipBackward}
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipForward}
                  className="text-white hover:bg-white/20"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>

                <span className="text-xs text-white ml-2">
                  {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')} / {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="ghost"
            size="lg"
            onClick={togglePlay}
            className="text-white bg-black/50 hover:bg-black/70 rounded-full p-4"
          >
            <Play className="h-8 w-8" />
          </Button>
        </div>
      )}
    </div>
  );
};