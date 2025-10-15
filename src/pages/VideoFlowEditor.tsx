import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { VideoFlowBuilder } from '@/components/chatbot/VideoFlowBuilder';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Node, Edge } from 'reactflow';

export default function VideoFlowEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chatbot, setChatbot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialNodes, setInitialNodes] = useState<Node[]>([]);
  const [initialEdges, setInitialEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (id) {
      fetchChatbot();
    }
  }, [id]);

  const fetchChatbot = async () => {
    try {
      const { data: chatbotData, error: chatbotError } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', id)
        .single();

      if (chatbotError) throw chatbotError;

      setChatbot(chatbotData);

      // Fetch existing flow nodes
      const { data: messagesData, error: messagesError } = await supabase
        .from('chatbot_messages')
        .select('*')
        .eq('chatbot_id', id);

      if (messagesError) throw messagesError;

      // Convert messages to ReactFlow nodes and edges
      if (messagesData && messagesData.length > 0) {
        const nodes: Node[] = messagesData.map((msg) => ({
          id: msg.id,
          type: msg.message_type.includes('video') ? 'video_question' : 'multiple_choice',
          position: msg.node_position as { x: number; y: number },
          data: {
            title: msg.message_key,
            video_url: msg.video_url,
            video_thumbnail: msg.video_thumbnail,
            description: msg.message_text,
            responses: msg.buttons || [],
          },
        }));

        const edges: Edge[] = [];
        messagesData.forEach((msg) => {
          if (msg.node_connections) {
            (msg.node_connections as any[]).forEach((conn: any) => {
              edges.push({
                id: `${msg.id}-${conn.target}`,
                source: msg.id,
                target: conn.target,
                label: conn.label,
              });
            });
          }
        });

        setInitialNodes(nodes);
        setInitialEdges(edges);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (nodes: Node[], edges: Edge[]) => {
    if (!id) return;

    try {
      // Delete existing messages
      await supabase.from('chatbot_messages').delete().eq('chatbot_id', id);

      // Convert nodes to chatbot_messages
      const messages = nodes.map((node) => ({
        chatbot_id: id,
        message_key: node.data.title,
        message_text: node.data.description || '',
        message_type: (node.data.video_url ? 'youtube_video' : 'text') as 'youtube_video' | 'text',
        video_url: node.data.video_url || null,
        video_thumbnail: node.data.video_thumbnail || null,
        buttons: node.data.responses || [],
        node_position: node.position as any,
        node_connections: edges
          .filter((edge) => edge.source === node.id)
          .map((edge) => ({
            target: edge.target,
            label: edge.label || '',
          })) as any,
      }));

      const { error } = await supabase.from('chatbot_messages').insert(messages);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Video flow saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/chatbots')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{chatbot?.name}</h1>
            <p className="text-sm text-muted-foreground">Video Bot Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </header>

      {/* Flow Builder */}
      <div className="flex-1">
        <VideoFlowBuilder
          chatbotId={id!}
          workspaceId={chatbot?.workspace_id}
          onSave={handleSave}
          initialNodes={initialNodes}
          initialEdges={initialEdges}
        />
      </div>
    </div>
  );
}
