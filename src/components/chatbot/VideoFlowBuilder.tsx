import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  NodeChange,
  EdgeChange,
  BackgroundVariant,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Video, MessageSquare, FormInput, CheckCircle, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VideoNodeData {
  title: string;
  video_url?: string;
  video_thumbnail?: string;
  description?: string;
  responses?: Array<{
    id: string;
    text: string;
    next_node_id: string | null;
  }>;
}

const nodeTypes = {
  video_question: VideoQuestionNode,
  multiple_choice: MultipleChoiceNode,
  text_response: TextResponseNode,
  end: EndNode,
};

function VideoQuestionNode({ data, selected }: { data: VideoNodeData; selected: boolean }) {
  return (
    <Card className={`min-w-[250px] p-4 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <Video className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">{data.title || 'Video Question'}</h3>
      </div>
      {data.video_url && (
        <div className="w-full h-32 bg-muted rounded flex items-center justify-center mb-2">
          <Video className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      {data.responses && data.responses.length > 0 && (
        <div className="mt-2 space-y-1">
          {data.responses.map((r) => (
            <div key={r.id} className="text-xs bg-secondary px-2 py-1 rounded">
              {r.text}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function MultipleChoiceNode({ data, selected }: { data: VideoNodeData; selected: boolean }) {
  return (
    <Card className={`min-w-[200px] p-4 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">{data.title || 'Multiple Choice'}</h3>
      </div>
      {data.responses && data.responses.length > 0 && (
        <div className="space-y-1">
          {data.responses.map((r) => (
            <div key={r.id} className="text-xs bg-secondary px-2 py-1 rounded">
              {r.text}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TextResponseNode({ data, selected }: { data: VideoNodeData; selected: boolean }) {
  return (
    <Card className={`min-w-[200px] p-4 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-center gap-2">
        <FormInput className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">{data.title || 'Text Response'}</h3>
      </div>
    </Card>
  );
}

function EndNode({ data, selected }: { data: VideoNodeData; selected: boolean }) {
  return (
    <Card className={`min-w-[150px] p-4 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">{data.title || 'End'}</h3>
      </div>
    </Card>
  );
}

interface VideoFlowBuilderProps {
  chatbotId: string;
  onSave: (nodes: Node[], edges: Edge[]) => void;
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

export const VideoFlowBuilder = ({ chatbotId, onSave, initialNodes = [], initialEdges = [] }: VideoFlowBuilderProps) => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes.length > 0 ? initialNodes : [
    {
      id: 'start',
      type: 'video_question',
      position: { x: 250, y: 100 },
      data: { title: 'Welcome', responses: [] },
    },
  ]);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
      data: { 
        title: type === 'end' ? 'End' : 'New Node',
        responses: type !== 'end' && type !== 'text_response' ? [] : undefined,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const updateNodeData = (field: string, value: any) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, [field]: value } }
          : node
      )
    );
    setSelectedNode((node) => node ? { ...node, data: { ...node.data, [field]: value } } : null);
  };

  const addResponse = () => {
    if (!selectedNode) return;
    const newResponse = {
      id: `response-${Date.now()}`,
      text: 'New Response',
      next_node_id: null,
    };
    const currentResponses = (selectedNode.data.responses || []) as any[];
    updateNodeData('responses', [...currentResponses, newResponse]);
  };

  const updateResponse = (responseId: string, field: string, value: any) => {
    if (!selectedNode) return;
    const currentResponses = (selectedNode.data.responses || []) as any[];
    const updatedResponses = currentResponses.map((r) =>
      r.id === responseId ? { ...r, [field]: value } : r
    );
    updateNodeData('responses', updatedResponses);
  };

  const deleteResponse = (responseId: string) => {
    if (!selectedNode) return;
    const currentResponses = (selectedNode.data.responses || []) as any[];
    updateNodeData('responses', currentResponses.filter((r) => r.id !== responseId));
  };

  const handleSave = () => {
    onSave(nodes, edges);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Left Sidebar - Node Palette */}
      <Card className="w-64 p-4 shrink-0">
        <h3 className="font-semibold mb-4">Add Nodes</h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => addNode('video_question')}
          >
            <Video className="h-4 w-4 mr-2" />
            Video Question
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => addNode('multiple_choice')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Multiple Choice
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => addNode('text_response')}
          >
            <FormInput className="h-4 w-4 mr-2" />
            Text Response
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => addNode('end')}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            End Node
          </Button>
        </div>
        <Button onClick={handleSave} className="w-full mt-4">
          Save Flow
        </Button>
      </Card>

      {/* Center - Canvas */}
      <div className="flex-1 bg-background border rounded-lg">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Right Sidebar - Node Editor */}
      {selectedNode && (
        <Card className="w-80 p-4 shrink-0">
          <ScrollArea className="h-full">
            <h3 className="font-semibold mb-4">Edit Node</h3>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={selectedNode.data.title || ''}
                  onChange={(e) => updateNodeData('title', e.target.value)}
                />
              </div>

              {(selectedNode.type === 'video_question') && (
                <>
                  <div>
                    <Label>Video URL</Label>
                    <Input
                      value={selectedNode.data.video_url || ''}
                      onChange={(e) => updateNodeData('video_url', e.target.value)}
                      placeholder="https://... or youtube.com/..."
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={selectedNode.data.description || ''}
                      onChange={(e) => updateNodeData('description', e.target.value)}
                    />
                  </div>
                </>
              )}

              {selectedNode.type !== 'end' && selectedNode.type !== 'text_response' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Responses</Label>
                    <Button size="sm" variant="outline" onClick={addResponse}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {((selectedNode.data.responses || []) as any[]).map((response) => (
                      <Card key={response.id} className="p-2">
                        <Input
                          value={response.text}
                          onChange={(e) => updateResponse(response.id, 'text', e.target.value)}
                          className="mb-2"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteResponse(response.id)}
                        >
                          Delete
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
};
