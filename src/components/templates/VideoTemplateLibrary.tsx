import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Video, 
  Play, 
  Search, 
  Filter,
  Star,
  Download,
  Eye,
  Users,
  Briefcase,
  Home,
  ShoppingBag,
  GraduationCap,
  Heart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VideoPlayer } from '@/components/video/VideoPlayer';

interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  industry_tags: string[];
  video_enabled: boolean;
  sample_videos: any[];
  template_config: any;
  preview_image?: string;
  is_active: boolean;
}

interface VideoTemplateLibraryProps {
  onTemplateSelect: (template: VideoTemplate) => void;
  onPreview: (template: VideoTemplate) => void;
}

const industryIcons = {
  law: Briefcase,
  'professional_services': Users,
  'real_estate': Home,
  'e_commerce': ShoppingBag,
  'education': GraduationCap,
  'healthcare': Heart,
  'technology': Video,
  'finance': Briefcase
};

export const VideoTemplateLibrary: React.FC<VideoTemplateLibraryProps> = ({
  onTemplateSelect,
  onPreview
}) => {
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<VideoTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedIndustry]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chatbot_templates')
        .select('*')
        .eq('is_active', true)
        .eq('video_enabled', true)
        .order('name');

      if (error) throw error;
      setTemplates((data || []) as VideoTemplate[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.industry_tags.some(tag => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (selectedIndustry !== 'all') {
      filtered = filtered.filter(template =>
        template.industry_tags.includes(selectedIndustry)
      );
    }

    setFilteredTemplates(filtered);
  };

  const getUniqueIndustries = () => {
    const industries = new Set<string>();
    templates.forEach(template => {
      template.industry_tags.forEach(tag => industries.add(tag));
    });
    return Array.from(industries);
  };

  const handleUseTemplate = (template: VideoTemplate) => {
    onTemplateSelect(template);
  };

  const renderTemplateCard = (template: VideoTemplate) => {
    const IconComponent = industryIcons[template.industry_tags[0] as keyof typeof industryIcons] || Video;
    
    return (
      <Card 
        key={template.id} 
        className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
        onClick={() => setSelectedTemplate(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-video-primary/10 rounded-lg">
                <IconComponent className="h-5 w-5 text-video-primary" />
              </div>
              <div>
                <CardTitle className="text-base group-hover:text-video-primary transition-colors">
                  {template.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {template.description}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-video-primary/10 text-video-primary">
              <Video className="h-3 w-3 mr-1" />
              Video
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Industry Tags */}
          <div className="flex flex-wrap gap-1">
            {template.industry_tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag.replace('_', ' ').toUpperCase()}
              </Badge>
            ))}
            {template.industry_tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{template.industry_tags.length - 3} more
              </Badge>
            )}
          </div>

          {/* Sample Videos Preview */}
          {template.sample_videos && template.sample_videos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Sample Videos:</p>
              <div className="grid grid-cols-2 gap-2">
                {template.sample_videos.slice(0, 2).map((video, index) => (
                  <div 
                    key={index}
                    className="aspect-video bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground"
                  >
                    <Play className="h-4 w-4" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(template);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-video-primary hover:bg-video-primary-glow"
              onClick={(e) => {
                e.stopPropagation();
                handleUseTemplate(template);
              }}
            >
              <Download className="h-4 w-4 mr-1" />
              Use Template
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Video-Enhanced Templates</h2>
        <p className="text-muted-foreground mt-1">
          Professional chatbot templates with integrated video content for various industries
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={selectedIndustry} onValueChange={setSelectedIndustry} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All Industries</TabsTrigger>
            {getUniqueIndustries().slice(0, 3).map((industry) => (
              <TabsTrigger key={industry} value={industry} className="hidden sm:flex">
                {industry.replace('_', ' ')}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(renderTemplateCard)}
      </div>

      {/* No Results */}
      {filteredTemplates.length === 0 && !loading && (
        <div className="text-center py-12">
          <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No templates found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or industry filters
          </p>
        </div>
      )}

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{selectedTemplate.name}</CardTitle>
                  <p className="text-muted-foreground mt-1">{selectedTemplate.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTemplate(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Sample Videos */}
              {selectedTemplate.sample_videos && selectedTemplate.sample_videos.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Sample Videos</h4>
                  <div className="grid gap-4">
                    {selectedTemplate.sample_videos.map((video, index) => (
                      <div key={index} className="space-y-2">
                        <h5 className="text-sm font-medium">{video.title}</h5>
                        <VideoPlayer
                          type={video.type}
                          url={video.url}
                          layout={video.layout}
                          controls={true}
                          className="max-w-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Template Configuration */}
              <div>
                <h4 className="font-medium mb-3">Template Features</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-video-primary" />
                    <span>Video Integration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-video-primary" />
                    <span>Interactive Elements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-video-primary" />
                    <span>Lead Capture</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-video-primary" />
                    <span>Analytics Tracking</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Close
                </Button>
                <Button
                  className="bg-video-primary hover:bg-video-primary-glow"
                  onClick={() => {
                    handleUseTemplate(selectedTemplate);
                    setSelectedTemplate(null);
                  }}
                >
                  Use This Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};