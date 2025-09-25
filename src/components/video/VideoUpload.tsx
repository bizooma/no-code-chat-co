import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Upload, Video, Youtube, X, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VideoUploadProps {
  chatbotId: string;
  onVideoUpload?: (videoData: VideoData) => void;
  currentVideo?: VideoData | null;
}

interface VideoData {
  type: 'youtube' | 'uploaded';
  url: string;
  thumbnail?: string;
  duration?: number;
  autoplay: boolean;
  controls: boolean;
  title?: string;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  chatbotId,
  onVideoUpload,
  currentVideo
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [videoData, setVideoData] = useState<VideoData>(currentVideo || {
    type: 'youtube',
    url: '',
    autoplay: false,
    controls: true
  });

  const validateYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getYouTubeThumbnail = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  const handleYouTubeUrlChange = (url: string) => {
    const updatedVideoData = { ...videoData, url };
    
    if (validateYouTubeUrl(url)) {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        updatedVideoData.thumbnail = getYouTubeThumbnail(videoId);
      }
    }
    
    setVideoData(updatedVideoData);
    onVideoUpload?.(updatedVideoData);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload MP4, WebM, MOV, or AVI files only",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload videos smaller than 100MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${chatbotId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('chatbot-videos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from('chatbot-videos')
        .getPublicUrl(fileName);

      const updatedVideoData: VideoData = {
        type: 'uploaded',
        url: publicUrl.publicUrl,
        autoplay: videoData.autoplay,
        controls: videoData.controls,
        title: file.name
      };

      setVideoData(updatedVideoData);
      onVideoUpload?.(updatedVideoData);

      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleControlChange = (field: keyof VideoData, value: any) => {
    const updatedVideoData = { ...videoData, [field]: value };
    setVideoData(updatedVideoData);
    onVideoUpload?.(updatedVideoData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Video Type</Label>
          <Select 
            value={videoData.type} 
            onValueChange={(value: 'youtube' | 'uploaded') => handleControlChange('type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="youtube">
                <div className="flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  YouTube Video
                </div>
              </SelectItem>
              <SelectItem value="uploaded">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Video
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {videoData.type === 'youtube' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <Input
                id="youtube-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoData.url}
                onChange={(e) => handleYouTubeUrlChange(e.target.value)}
              />
              {videoData.url && !validateYouTubeUrl(videoData.url) && (
                <p className="text-sm text-destructive">Please enter a valid YouTube URL</p>
              )}
            </div>
            
            {videoData.thumbnail && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="relative aspect-video max-w-sm bg-muted rounded-md overflow-hidden">
                  <img 
                    src={videoData.thumbnail} 
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-12 w-12 text-white bg-black/50 rounded-full p-2" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Video File</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop your video file here, or click to browse
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Choose File
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Max file size: 100MB. Supported formats: MP4, WebM, MOV, AVI
                </p>
              </div>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {videoData.url && videoData.type === 'uploaded' && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <video 
                  src={videoData.url} 
                  className="w-full max-w-sm aspect-video bg-muted rounded-md"
                  controls
                />
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Playback Settings</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autoplay</Label>
              <p className="text-sm text-muted-foreground">
                Start playing automatically when chat opens
              </p>
            </div>
            <Switch
              checked={videoData.autoplay}
              onCheckedChange={(checked) => handleControlChange('autoplay', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Controls</Label>
              <p className="text-sm text-muted-foreground">
                Display play/pause and volume controls
              </p>
            </div>
            <Switch
              checked={videoData.controls}
              onCheckedChange={(checked) => handleControlChange('controls', checked)}
            />
          </div>
        </div>

        {videoData.url && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-1">Current Configuration:</p>
            <p className="text-sm text-muted-foreground">
              Type: {videoData.type === 'youtube' ? 'YouTube' : 'Uploaded'} | 
              Autoplay: {videoData.autoplay ? 'On' : 'Off'} | 
              Controls: {videoData.controls ? 'On' : 'Off'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};