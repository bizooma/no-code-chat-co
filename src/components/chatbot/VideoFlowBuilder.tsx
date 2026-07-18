import React, { useCallback, useState, useImperativeHandle, forwardRef } from 'react';
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
  Handle,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, MessageSquare, FormInput, CheckCircle, Plus, UserPlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VideoUpload } from '@/components/video/VideoUpload';

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
  lead_fields?: Array<{
    id: string;
    label: string;
    field_type: 'text' | 'email' | 'phone' | 'textarea';
    required: boolean;
  }>;
}

const nodeTypes = {
  video_question: VideoQuestionNode,
  multiple_choice: MultipleChoiceNode,
  text_response: TextResponseNode,
  lead_capture: LeadCaptureNode,
  end: EndNode,
};

// Shared: render the small vertical thumbnail
function NodeThumb({ url, thumbnail }: { url?: string; thumbnail?: string }) {
  return (
    <div className="w-32 aspect-[9/16] mx-auto bg-muted rounded overflow-hidden mb-2">
      {url && thumbnail ? (
        <img src={thumbnail} alt="Video" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Video className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// Response row with its own source handle so canvas edges wire per-response.
function ResponseRow({ response }: { response: { id: string; text: string } }) {
  return (
    <div className="relative text-xs bg-secondary px-2 py-1 rounded pr-4">
      {response.text}
      <Handle
        type="source"
        position={Position.Right}
        id={response.id}
        className="!bg-primary !w-3 !h-3"
        style={{ right: -6, top: '50%' }}
      />
    </div>
  );
}

function VideoQuestionNode({ data, selected }: { data: VideoNodeData; selected: boolean }) {
  const responses = data.responses ?? [];
  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-primary !w-3 !h-3" />
      <Card className={`min-w-[250px] p-4 ${selected ? 'ring-2 ring-primary' : ''}`}>
        <div className="flex items-center gap-2 mb-2">
          <Video className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{data.title || 'Video + Question'}</h3>
        </div>
        <NodeThumb url={data.video_url} thumbnail={data.video_thumbnail} />
        {responses.length > 0 ? (
          <div className="mt-2 space-y-1">
            {responses.map((r) => (
              <ResponseRow key={r.id} response={r} />
            ))}
          </div>
        ) : (
          <Handle type="source" position={Position.Right} className="!bg-primary !w-3 !h-3" />
        )}
      </Card>
    </>
  );
}

function MultipleChoiceNode({ data, selected }: { data: VideoNodeData; selected: boolean }) {
  const responses = data.responses ?? [];
  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-primary !w-3 !h-3" />
      <Card className={`min-w-[200px] p-4 ${selected ? 'ring-2 ring-primary' : ''}`}>
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{data.title || 'Video + Buttons'}</h3>
        </div>
        <NodeThumb url={data.video_url} thumbnail={data.video_thumbnail} />
        {responses.length > 0 ? (
          <div className="space-y-1">
            {responses.map((r) => (
              <ResponseRow key={r.id} response={r} />
            ))}
          </div>
        ) : (
          <Handle type="source" position={Position.Right} className="!bg-primary !w-3 !h-3" />
        )}
      </Card>
    </>
  );
}

function TextResponseNode({ data, selected }: { data: VideoNodeData; selected: boolean }) {
  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-primary !w-3 !h-3" />
      <Card className={`min-w-[200px] p-4 ${selected ? 'ring-2 ring-primary' : ''}`}>
        <div className="flex items-center gap-2 mb-2">
          <FormInput className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{data.title || 'Video + Text Input'}</h3>
        </div>
        <NodeThumb url={data.video_url} thumbnail={data.video_thumbnail} />
      </Card>
      <Handle type="source" position={Position.Right} id="default" className="!bg-primary !w-3 !h-3" />
    </>
  );
}

function LeadCaptureNode({ data, selected }: { data: VideoNodeData; selected: boolean }) {
  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-primary !w-3 !h-3" />
      <Card className={`min-w-[200px] p-4 ${selected ? 'ring-2 ring-primary' : ''}`}>
        <div className="flex items-center gap-2 mb-2">
          <UserPlus className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{data.title || 'Video + Lead Form'}</h3>
        </div>
        <NodeThumb url={data.video_url} thumbnail={data.video_thumbnail} />
        {data.lead_fields && data.lead_fields.length > 0 && (
          <div className="space-y-1">
            {data.lead_fields.map((field) => (
              <div key={field.id} className="text-xs bg-secondary px-2 py-1 rounded">
                {field.label} ({field.field_type})
              </div>
            ))}
          </div>
        )}
      </Card>
      <Handle type="source" position={Position.Right} id="default" className="!bg-primary !w-3 !h-3" />
    </>
  );
}

function EndNode({ data, selected }: { data: VideoNodeData; selected: boolean }) {
  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-primary !w-3 !h-3" />
      <Card className={`min-w-[150px] p-4 ${selected ? 'ring-2 ring-primary' : ''}`}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{data.title || 'End'}</h3>
        </div>
        <NodeThumb url={data.video_url} thumbnail={data.video_thumbnail} />
      </Card>
    </>
  );
}

interface VideoFlowBuilderProps {
  chatbotId: string;
  workspaceId?: string;
  onSave: (nodes: Node[], edges: Edge[]) => void;
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

export interface VideoFlowBuilderRef {
  save: () => Promise<void>;
  getCurrentFlow: () => { nodes: Node[]; edges: Edge[] };
}

export const VideoFlowBuilder = forwardRef<VideoFlowBuilderRef, VideoFlowBuilderProps>(
  ({ chatbotId, workspaceId, onSave, initialNodes = [], initialEdges = [] }, ref) => {
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
    (connection: Connection) => {
      // If the connection came from a response-specific handle, wire that
      // response's next_node_id so the runtime follows the same route.
      if (connection.sourceHandle && connection.source && connection.target) {
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id !== connection.source) return n;
            const responses = (n.data?.responses ?? []) as Array<{ id: string; next_node_id: string | null }>;
            if (!responses.some((r) => r.id === connection.sourceHandle)) return n;
            const updated = responses.map((r) =>
              r.id === connection.sourceHandle ? { ...r, next_node_id: connection.target! } : r
            );
            return { ...n, data: { ...n.data, responses: updated } };
          })
        );
      }
      setEdges((eds) => {
        // Ensure only one outgoing edge per (source, sourceHandle) pair
        const filtered = connection.sourceHandle
          ? eds.filter((e) => !(e.source === connection.source && e.sourceHandle === connection.sourceHandle))
          : eds;
        return addEdge(connection, filtered);
      });
    },
    []
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Expose save method to parent component via ref
  useImperativeHandle(ref, () => ({
    save: async () => {
      await onSave(nodes, edges);
    },
    getCurrentFlow: () => ({
      nodes,
      edges,
    }),
  }), [nodes, edges, onSave]);

  const addNode = (type: string) => {
    const defaultTitles: Record<string, string> = {
      'video_question': 'Video + Question',
      'multiple_choice': 'Video + Buttons',
      'text_response': 'Video + Text Input',
      'lead_capture': 'Video + Lead Form',
      'end': 'End Screen'
    };

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
      data: { 
        title: defaultTitles[type] || 'New Node',
        responses: type !== 'end' && type !== 'text_response' && type !== 'lead_capture' ? [] : undefined,
        lead_fields: type === 'lead_capture' ? [
          { id: 'field-name', label: 'Name', field_type: 'text', required: true },
          { id: 'field-email', label: 'Email', field_type: 'email', required: true },
        ] : undefined,
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

    // Keep canvas edges in sync when the target is changed via the dropdown
    if (field === 'next_node_id') {
      setEdges((eds) => {
        const withoutOld = eds.filter(
          (e) => !(e.source === selectedNode.id && e.sourceHandle === responseId)
        );
        if (!value) return withoutOld;
        return [
          ...withoutOld,
          {
            id: `${selectedNode.id}-${responseId}-${value}`,
            source: selectedNode.id,
            sourceHandle: responseId,
            target: value,
          },
        ];
      });
    }
  };

  const deleteResponse = (responseId: string) => {
    if (!selectedNode) return;
    const currentResponses = (selectedNode.data.responses || []) as any[];
    updateNodeData('responses', currentResponses.filter((r) => r.id !== responseId));
    setEdges((eds) =>
      eds.filter((e) => !(e.source === selectedNode.id && e.sourceHandle === responseId))
    );
  };

  const handleSave = () => {
    onSave(nodes, edges);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Left Sidebar - Node Palette */}
      <Card className="w-64 p-4 shrink-0">
        <h3 className="font-semibold mb-4">Add Nodes</h3>
        <p className="text-xs text-muted-foreground mb-3">All nodes support video. Add overlay elements:</p>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => addNode('video_question')}
          >
            <Video className="h-4 w-4 mr-2" />
            Video + Question
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => addNode('multiple_choice')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Video + Buttons
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => addNode('text_response')}
          >
            <FormInput className="h-4 w-4 mr-2" />
            Video + Text Input
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => addNode('lead_capture')}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Video + Lead Form
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => addNode('end')}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            End Screen
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
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' }
          }}
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

              {/* Video Upload - Available for ALL node types */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Video (Required)</Label>
                <VideoUpload
                  chatbotId={chatbotId}
                  workspaceId={workspaceId}
                  nodeId={selectedNode.id}
                  currentVideo={selectedNode.data.video_url ? {
                    type: 'uploaded',
                    url: selectedNode.data.video_url,
                    autoplay: false,
                    controls: true,
                    thumbnail: selectedNode.data.video_thumbnail
                  } : null}
                  onVideoUpload={(videoData) => {
                    updateNodeData('video_url', videoData.url);
                    if (videoData.thumbnail) {
                      updateNodeData('video_thumbnail', videoData.thumbnail);
                    }
                  }}
                />
              </div>

              {selectedNode.type === 'video_question' && (
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={selectedNode.data.description || ''}
                    onChange={(e) => updateNodeData('description', e.target.value)}
                  />
                </div>
              )}

              {selectedNode.type === 'lead_capture' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Form Fields</Label>
                    <Button size="sm" variant="outline" onClick={() => {
                      const newField = {
                        id: `field-${Date.now()}`,
                        label: 'New Field',
                        field_type: 'text' as const,
                        required: false,
                      };
                      const currentFields = (selectedNode.data.lead_fields || []) as any[];
                      updateNodeData('lead_fields', [...currentFields, newField]);
                    }}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {((selectedNode.data.lead_fields || []) as any[]).map((field) => (
                      <Card key={field.id} className="p-2 space-y-2">
                        <Input
                          value={field.label}
                          onChange={(e) => {
                            const currentFields = (selectedNode.data.lead_fields || []) as any[];
                            const updatedFields = currentFields.map((f) =>
                              f.id === field.id ? { ...f, label: e.target.value } : f
                            );
                            updateNodeData('lead_fields', updatedFields);
                          }}
                          placeholder="Field Label"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const currentFields = (selectedNode.data.lead_fields || []) as any[];
                            updateNodeData('lead_fields', currentFields.filter((f) => f.id !== field.id));
                          }}
                        >
                          Delete
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.type !== 'end' && selectedNode.type !== 'text_response' && selectedNode.type !== 'lead_capture' && (
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
});

VideoFlowBuilder.displayName = 'VideoFlowBuilder';
