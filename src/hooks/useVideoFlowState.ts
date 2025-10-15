import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FlowState {
  currentNodeId: string;
  visitedNodes: string[];
  responses: Record<string, any>;
  leadData: Record<string, any>;
  conversationId?: string;
}

interface VideoNode {
  id: string;
  title: string;
  video_url?: string;
  video_thumbnail?: string;
  description?: string;
  responses?: Array<{
    id: string;
    text: string;
    next_node_id: string | null;
  }>;
  type: string;
}

export const useVideoFlowState = (chatbotId: string, visitorId: string) => {
  const [state, setState] = useState<FlowState>({
    currentNodeId: '',
    visitedNodes: [],
    responses: {},
    leadData: {},
  });
  const [nodes, setNodes] = useState<Record<string, VideoNode>>({});
  const [loading, setLoading] = useState(false);

  const initializeFlow = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all nodes for this chatbot
      const { data: messages, error } = await supabase
        .from('chatbot_messages')
        .select('*')
        .eq('chatbot_id', chatbotId);

      if (error) throw error;

      // Convert to node map
      const nodeMap: Record<string, VideoNode> = {};
      messages?.forEach((msg) => {
        nodeMap[msg.id] = {
          id: msg.id,
          title: msg.message_key,
          video_url: msg.video_url || undefined,
          video_thumbnail: msg.video_thumbnail || undefined,
          description: msg.message_text,
          responses: (msg.buttons as any) || [],
          type: msg.message_type,
        };
      });

      setNodes(nodeMap);

      // Find start node (first node or node with no incoming connections)
      const startNode = messages?.[0];
      if (startNode) {
        setState((prev) => ({
          ...prev,
          currentNodeId: startNode.id,
          visitedNodes: [startNode.id],
        }));

        // Create conversation
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            chatbot_id: chatbotId,
            visitor_id: visitorId,
            status: 'active',
          })
          .select()
          .single();

        if (convError) throw convError;

        setState((prev) => ({ ...prev, conversationId: conversation.id }));

        // Track analytics
        await supabase.from('analytics_events').insert({
          chatbot_id: chatbotId,
          conversation_id: conversation.id,
          visitor_id: visitorId,
          event_type: 'conversation_started',
        });
      }
    } catch (error) {
      console.error('Error initializing flow:', error);
    } finally {
      setLoading(false);
    }
  }, [chatbotId, visitorId]);

  const moveToNextNode = useCallback(
    async (responseId: string) => {
      const currentNode = nodes[state.currentNodeId];
      if (!currentNode) return;

      const response = currentNode.responses?.find((r) => r.id === responseId);
      if (!response || !response.next_node_id) return;

      // Save response
      setState((prev) => ({
        ...prev,
        responses: {
          ...prev.responses,
          [state.currentNodeId]: responseId,
        },
      }));

      // Track message
      if (state.conversationId) {
        await supabase.from('conversation_messages').insert([{
          conversation_id: state.conversationId,
          sender: 'visitor',
          message_text: response.text,
          message_type: 'text',
        }] as any);

        // Track analytics
        await supabase.from('analytics_events').insert([{
          chatbot_id: chatbotId,
          conversation_id: state.conversationId,
          visitor_id: visitorId,
          event_type: 'button_clicked',
          event_data: {
            node_id: state.currentNodeId,
            response_id: responseId,
            response_text: response.text,
          },
        }] as any);
      }

      // Move to next node
      setState((prev) => ({
        ...prev,
        currentNodeId: response.next_node_id!,
        visitedNodes: [...prev.visitedNodes, response.next_node_id!],
      }));
    },
    [nodes, state, chatbotId, visitorId]
  );

  const captureResponse = useCallback(
    async (response: any) => {
      setState((prev) => ({
        ...prev,
        responses: {
          ...prev.responses,
          [state.currentNodeId]: response,
        },
      }));

      // Save to conversation
      if (state.conversationId) {
        await supabase.from('conversation_messages').insert([{
          conversation_id: state.conversationId,
          sender: 'visitor',
          message_text: typeof response === 'string' ? response : JSON.stringify(response),
          message_type: 'text',
        }] as any);
      }
    },
    [state]
  );

  const captureLeadData = useCallback(
    async (data: Record<string, any>) => {
      setState((prev) => ({
        ...prev,
        leadData: { ...prev.leadData, ...data },
      }));

      // Save lead to database
      if (state.conversationId) {
        const { data: workspaceData } = await supabase
          .from('chatbots')
          .select('workspace_id')
          .eq('id', chatbotId)
          .single();

        await supabase.from('leads').insert([{
          conversation_id: state.conversationId,
          chatbot_id: chatbotId,
          workspace_id: workspaceData?.workspace_id || '',
          name: data.name,
          email: data.email,
          phone: data.phone,
          additional_data: data,
          status: 'new',
        }] as any);
      }
    },
    [state, chatbotId]
  );

  const getCurrentNode = useCallback(() => {
    return nodes[state.currentNodeId];
  }, [nodes, state.currentNodeId]);

  return {
    state,
    loading,
    initializeFlow,
    moveToNextNode,
    captureResponse,
    captureLeadData,
    getCurrentNode,
  };
};
