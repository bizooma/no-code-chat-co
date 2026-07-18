import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FlowState {
  currentNodeId: string;
  visitedNodes: string[];
  responses: Record<string, any>;
  leadData: Record<string, any>;
  conversationId?: string;
  isComplete: boolean;
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
  lead_fields?: Array<{
    id: string;
    label: string;
    field_type: string;
    required: boolean;
  }>;
  type: string;
}

export const useVideoFlowState = (chatbotId: string, visitorId: string) => {
  const [state, setState] = useState<FlowState>({
    currentNodeId: '',
    visitedNodes: [],
    responses: {},
    leadData: {},
    isComplete: false,
  });
  const [nodes, setNodes] = useState<Record<string, VideoNode>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeFlow = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check for existing flow state from localStorage
      const savedState = localStorage.getItem(`video_flow_${chatbotId}_${visitorId}`);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setState(parsedState);
        console.log('[VIDEO-FLOW] Restored saved state:', parsedState);
      }
      
      // Fetch all nodes for this chatbot
      const { data: messages, error } = await supabase
        .from('chatbot_messages')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('created_at');

      if (error) throw error;

      if (!messages || messages.length === 0) {
        throw new Error('No flow nodes found for this chatbot');
      }

      // Convert to node map
      const nodeMap: Record<string, VideoNode> = {};
      messages.forEach((msg) => {
        const conditions = (msg.conditions as any) || {};
        const nodeType: string =
          conditions.node_type ||
          (msg.message_type === 'form' ? 'lead_capture' : msg.message_type);
        nodeMap[msg.id] = {
          id: msg.id,
          title: msg.message_key,
          video_url: msg.video_url || undefined,
          video_thumbnail: msg.video_thumbnail || undefined,
          description: msg.message_text,
          responses: (msg.buttons as any) || [],
          lead_fields:
            nodeType === 'lead_capture' ? conditions.lead_fields || [] : undefined,
          type: nodeType,
        };
      });

      setNodes(nodeMap);
      console.log('[VIDEO-FLOW] Loaded nodes:', Object.keys(nodeMap).length);

      // Find start node (first node or node with no incoming connections)
      const startNode = messages[0];
      if (startNode && !savedState) {
        setState((prev) => ({
          ...prev,
          currentNodeId: startNode.id,
          visitedNodes: [startNode.id],
        }));

        // Create conversation with visitor info
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            chatbot_id: chatbotId,
            visitor_id: visitorId,
            status: 'active',
            visitor_info: {
              user_agent: navigator.userAgent,
              screen_size: `${window.screen.width}x${window.screen.height}`,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              started_at: new Date().toISOString(),
            },
          })
          .select()
          .single();

        if (convError) throw convError;

        setState((prev) => ({ ...prev, conversationId: conversation.id }));
        console.log('[VIDEO-FLOW] Created conversation:', conversation.id);

        // Track analytics - conversation started
        await supabase.from('analytics_events').insert({
          chatbot_id: chatbotId,
          conversation_id: conversation.id,
          visitor_id: visitorId,
          event_type: 'conversation_started',
          event_data: {
            start_node: startNode.id,
            flow_type: 'video_bot',
          },
        });

        // Track first node view
        await supabase.from('conversation_messages').insert({
          conversation_id: conversation.id,
          sender: 'bot',
          message_text: startNode.message_text || startNode.message_key,
          message_type: startNode.message_type,
          metadata: {
            node_id: startNode.id,
            video_url: startNode.video_url,
          },
        } as any);
      }
    } catch (error: any) {
      console.error('[VIDEO-FLOW] Error initializing flow:', error);
      setError(error.message || 'Failed to initialize video flow');
    } finally {
      setLoading(false);
    }
  }, [chatbotId, visitorId]);

  const moveToNextNode = useCallback(
    async (responseId: string) => {
      const currentNode = nodes[state.currentNodeId];
      if (!currentNode) {
        console.error('[VIDEO-FLOW] Current node not found:', state.currentNodeId);
        return;
      }

      const response = currentNode.responses?.find((r) => r.id === responseId);
      if (!response || !response.next_node_id) {
        console.log('[VIDEO-FLOW] No next node, flow complete');
        setState((prev) => ({ ...prev, isComplete: true }));
        
        // Mark conversation as completed
        if (state.conversationId) {
          await supabase
            .from('conversations')
            .update({ status: 'ended', ended_at: new Date().toISOString() })
            .eq('id', state.conversationId);
            
          await supabase.from('analytics_events').insert([{
            chatbot_id: chatbotId,
            conversation_id: state.conversationId,
            visitor_id: visitorId,
            event_type: 'conversation_started',
            event_data: {
              total_nodes: state.visitedNodes.length,
              responses: Object.keys(state.responses).length,
              completed: true,
            },
          }] as any);
        }
        return;
      }

      // Save response to state
      const newState = {
        ...state,
        responses: {
          ...state.responses,
          [state.currentNodeId]: responseId,
        },
        currentNodeId: response.next_node_id,
        visitedNodes: [...state.visitedNodes, response.next_node_id],
      };
      
      setState(newState);
      
      // Persist state to localStorage
      localStorage.setItem(
        `video_flow_${chatbotId}_${visitorId}`,
        JSON.stringify(newState)
      );

      console.log('[VIDEO-FLOW] Moving to node:', response.next_node_id);

      // Track message
      if (state.conversationId) {
        await supabase.from('conversation_messages').insert([{
          conversation_id: state.conversationId,
          sender: 'visitor',
          message_text: response.text,
          message_type: 'text',
          metadata: {
            node_id: state.currentNodeId,
            response_id: responseId,
          },
        }] as any);

        // Track node view
        const nextNode = nodes[response.next_node_id];
        if (nextNode) {
          await supabase.from('conversation_messages').insert([{
            conversation_id: state.conversationId,
            sender: 'bot',
            message_text: nextNode.description || nextNode.title,
            message_type: nextNode.type,
            metadata: {
              node_id: nextNode.id,
              video_url: nextNode.video_url,
            },
          }] as any);
        }

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
            next_node_id: response.next_node_id,
          },
        }] as any);
      }
    },
    [nodes, state, chatbotId, visitorId]
  );

  const captureResponse = useCallback(
    async (response: any) => {
      const newState = {
        ...state,
        responses: {
          ...state.responses,
          [state.currentNodeId]: response,
        },
      };
      
      setState(newState);
      
      // Persist to localStorage
      localStorage.setItem(
        `video_flow_${chatbotId}_${visitorId}`,
        JSON.stringify(newState)
      );

      console.log('[VIDEO-FLOW] Captured response:', response);

      // Save to conversation
      if (state.conversationId) {
        await supabase.from('conversation_messages').insert([{
          conversation_id: state.conversationId,
          sender: 'visitor',
          message_text: typeof response === 'string' ? response : JSON.stringify(response),
          message_type: 'text',
          metadata: {
            node_id: state.currentNodeId,
          },
        }] as any);
        
        await supabase.from('analytics_events').insert([{
          chatbot_id: chatbotId,
          conversation_id: state.conversationId,
          visitor_id: visitorId,
          event_type: 'message_sent',
          event_data: {
            node_id: state.currentNodeId,
            response_length: typeof response === 'string' ? response.length : 0,
          },
        }] as any);
      }
    },
    [state, chatbotId, visitorId]
  );

  const captureLeadData = useCallback(
    async (data: Record<string, any>) => {
      const newState = {
        ...state,
        leadData: { ...state.leadData, ...data },
      };
      
      setState(newState);
      
      // Persist to localStorage
      localStorage.setItem(
        `video_flow_${chatbotId}_${visitorId}`,
        JSON.stringify(newState)
      );

      console.log('[VIDEO-FLOW] Captured lead data:', data);

      // Save lead to database
      if (state.conversationId) {
        const { data: workspaceData } = await supabase
          .from('chatbots')
          .select('workspace_id')
          .eq('id', chatbotId)
          .single();

        const { error: leadError } = await supabase.from('leads').insert([{
          conversation_id: state.conversationId,
          chatbot_id: chatbotId,
          workspace_id: workspaceData?.workspace_id || '',
          name: data.name,
          email: data.email,
          phone: data.phone,
          additional_data: data,
          status: 'new',
          source: 'video_bot',
        }] as any);

        if (leadError) {
          console.error('[VIDEO-FLOW] Error saving lead:', leadError);
        } else {
          console.log('[VIDEO-FLOW] Lead saved successfully');
          
          // Track lead captured event
          await supabase.from('analytics_events').insert([{
            chatbot_id: chatbotId,
            conversation_id: state.conversationId,
            visitor_id: visitorId,
            event_type: 'lead_captured',
            event_data: {
              node_id: state.currentNodeId,
              fields: Object.keys(data),
            },
          }] as any);
        }
      }
    },
    [state, chatbotId, visitorId]
  );

  const resetFlow = useCallback(() => {
    localStorage.removeItem(`video_flow_${chatbotId}_${visitorId}`);
    setState({
      currentNodeId: '',
      visitedNodes: [],
      responses: {},
      leadData: {},
      isComplete: false,
    });
    console.log('[VIDEO-FLOW] Flow reset');
  }, [chatbotId, visitorId]);

  const getCurrentNode = useCallback(() => {
    return nodes[state.currentNodeId];
  }, [nodes, state.currentNodeId]);

  return {
    state,
    loading,
    error,
    nodes,
    initializeFlow,
    moveToNextNode,
    captureResponse,
    captureLeadData,
    getCurrentNode,
    resetFlow,
  };
};
