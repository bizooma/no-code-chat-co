import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Link2, FileText, Loader2, Trash2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface KnowledgeSource {
  id: string;
  source_type: string;
  source_name: string;
  content: string;
  metadata: any;
  file_url: string | null;
  status: string;
  created_at: string;
}

interface KnowledgeBaseManagerProps {
  chatbotId: string;
}

export const KnowledgeBaseManager = ({ chatbotId }: KnowledgeBaseManagerProps) => {
  const { toast } = useToast();
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [previewSource, setPreviewSource] = useState<KnowledgeSource | null>(null);

  useEffect(() => {
    fetchSources();
  }, [chatbotId]);

  const fetchSources = async () => {
    const { data, error } = await supabase
      .from('avatar_knowledge_sources')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch knowledge sources",
        variant: "destructive",
      });
      return;
    }

    setSources(data || []);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|md|pdf|docx)$/)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a TXT, MD, PDF, or DOCX file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const filePath = `${chatbotId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatar-knowledge-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatar-knowledge-files')
        .getPublicUrl(filePath);

      const { data, error } = await supabase.functions.invoke('process-knowledge-source', {
        body: {
          chatbotId,
          sourceType: 'file',
          sourceName: file.name,
          sourceData: {
            fileUrl: publicUrl,
            filePath,
            fileSize: file.size,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "File uploaded and processed successfully",
      });

      fetchSources();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddText = async () => {
    if (!textInput.trim()) return;

    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('process-knowledge-source', {
        body: {
          chatbotId,
          sourceType: 'text',
          sourceName: `Text Entry ${new Date().toLocaleDateString()}`,
          sourceData: textInput,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Text added successfully",
      });

      setTextInput("");
      fetchSources();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add text",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;

    try {
      new URL(urlInput);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('process-knowledge-source', {
        body: {
          chatbotId,
          sourceType: 'url',
          sourceName: urlInput,
          sourceData: urlInput,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "URL content scraped successfully",
      });

      setUrlInput("");
      fetchSources();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to scrape URL",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    const { error } = await supabase
      .from('avatar_knowledge_sources')
      .delete()
      .eq('id', sourceId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete source",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Knowledge source deleted",
    });

    fetchSources();
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <Upload className="h-4 w-4" />;
      case 'url':
        return <Link2 className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="url">Add URLs</TabsTrigger>
          <TabsTrigger value="text">Manual Text</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Upload PDF, DOCX, TXT, or MD files (max 10MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8">
                <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button disabled={uploading} asChild>
                    <span>
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Choose File"
                      )}
                    </span>
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".txt,.md,.pdf,.docx"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add URL</CardTitle>
              <CardDescription>
                Scrape content from a website URL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="https://example.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <Button onClick={handleAddUrl} disabled={loading || !urlInput.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    Scrape URL
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Text</CardTitle>
              <CardDescription>
                Manually enter knowledge base content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your knowledge base content here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={8}
              />
              <Button onClick={handleAddText} disabled={loading || !textInput.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Add Text
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Knowledge Sources ({sources.length})</CardTitle>
          <CardDescription>
            Manage your bot's knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {sources.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No knowledge sources yet. Add your first one above.
              </p>
            ) : (
              <div className="space-y-2">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getSourceIcon(source.source_type)}
                      <div className="flex-1">
                        <p className="font-medium">{source.source_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(source.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={source.status === 'ready' ? 'default' : 'secondary'}>
                        {source.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewSource(source)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSource(source.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!previewSource} onOpenChange={() => setPreviewSource(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewSource?.source_name}</DialogTitle>
            <DialogDescription>
              {previewSource?.source_type === 'url' && previewSource.metadata?.url}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] p-4">
            <pre className="whitespace-pre-wrap text-sm">{previewSource?.content}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
