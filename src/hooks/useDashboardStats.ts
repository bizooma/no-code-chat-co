import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalBots: number;
  standardBots: number;
  avatarBots: number;
  videoBots: number;
  totalLeads: number;
  totalConversations: number;
}

interface ChatbotItem {
  id: string;
  name: string;
  type: 'standard' | 'avatar' | 'video';
  status: string;
  created_at: string;
  video_config?: any;
}

interface LeadItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  created_at: string;
  chatbot_name: string | null;
  source: string;
}

export const useDashboardStats = (workspaceId: string | undefined) => {
  return useQuery({
    queryKey: ['dashboard-stats', workspaceId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!workspaceId) {
        return { 
          totalBots: 0, 
          standardBots: 0,
          avatarBots: 0,
          videoBots: 0,
          totalLeads: 0, 
          totalConversations: 0 
        };
      }

      // Fetch total chatbots with breakdown
      const [chatbotsData, avatarBotsResult] = await Promise.all([
        supabase
          .from('chatbots')
          .select('chatbot_type')
          .eq('workspace_id', workspaceId),
        supabase
          .from('avatar_chatbots')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId),
      ]);

      const standardBotsCount = chatbotsData.data?.filter(b => !b.chatbot_type || b.chatbot_type === 'standard').length || 0;
      const videoBotsCount = chatbotsData.data?.filter(b => b.chatbot_type === 'video_bot').length || 0;
      const avatarBotsCount = avatarBotsResult.count || 0;
      const totalBots = standardBotsCount + videoBotsCount + avatarBotsCount;

      // Fetch total leads
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      // Fetch bot IDs first, then count conversations
      const { data: standardBotsData } = await supabase
        .from('chatbots')
        .select('id')
        .eq('workspace_id', workspaceId);

      const { data: avatarBotsData } = await supabase
        .from('avatar_chatbots')
        .select('id')
        .eq('workspace_id', workspaceId);

      const standardBotIds = standardBotsData?.map(b => b.id) || [];
      const avatarBotIds = avatarBotsData?.map(b => b.id) || [];

      let standardConvoCount = 0;
      let avatarConvoCount = 0;

      if (standardBotIds.length > 0) {
        const { count } = await supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .in('chatbot_id', standardBotIds);
        standardConvoCount = count || 0;
      }

      if (avatarBotIds.length > 0) {
        const { count } = await supabase
          .from('avatar_conversations')
          .select('id', { count: 'exact', head: true })
          .in('chatbot_id', avatarBotIds);
        avatarConvoCount = count || 0;
      }

      const totalConversations = standardConvoCount + avatarConvoCount;

      return {
        totalBots,
        standardBots: standardBotsCount,
        avatarBots: avatarBotsCount,
        videoBots: videoBotsCount,
        totalLeads: totalLeads || 0,
        totalConversations,
      };
    },
    enabled: !!workspaceId,
    staleTime: 30000, // Cache for 30 seconds
  });
};

export const useRecentChatbots = (workspaceId: string | undefined, limit: number = 5) => {
  return useQuery({
    queryKey: ['recent-chatbots', workspaceId, limit],
    queryFn: async (): Promise<ChatbotItem[]> => {
      if (!workspaceId) return [];

      const [standardBots, avatarBots] = await Promise.all([
        supabase
          .from('chatbots')
          .select('id, name, status, created_at, chatbot_type, video_config')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('avatar_chatbots')
          .select('id, name, created_at')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(limit),
      ]);

      const standardItems: ChatbotItem[] = (standardBots.data || []).map(bot => ({
        id: bot.id,
        name: bot.name,
        type: bot.chatbot_type === 'video_bot' ? 'video' as const : 'standard' as const,
        status: bot.status,
        created_at: bot.created_at,
        video_config: bot.video_config,
      }));

      const avatarItems: ChatbotItem[] = (avatarBots.data || []).map(bot => ({
        id: bot.id,
        name: bot.name,
        type: 'avatar' as const,
        status: 'active',
        created_at: bot.created_at,
      }));

      // Combine and sort by created_at
      const combined = [...standardItems, ...avatarItems]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      return combined;
    },
    enabled: !!workspaceId,
    staleTime: 30000,
  });
};

export const useRecentLeads = (workspaceId: string | undefined, limit: number = 5) => {
  return useQuery({
    queryKey: ['recent-leads', workspaceId, limit],
    queryFn: async (): Promise<LeadItem[]> => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          email,
          phone,
          company,
          status,
          created_at,
          source,
          chatbot_id,
          chatbots(name)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: lead.status,
        created_at: lead.created_at,
        source: lead.source,
        chatbot_name: (lead.chatbots as any)?.name || null,
      }));
    },
    enabled: !!workspaceId,
    staleTime: 30000,
  });
};
