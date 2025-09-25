import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Search, 
  Filter, 
  Globe, 
  MessageSquare,
  Phone,
  Slack,
  Clock,
  User,
  Bot
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  chatbot_id: string;
  visitor_id: string;
  channel: string;
  status: 'active' | 'ended' | 'transferred_to_human';
  started_at: string;
  ended_at?: string;
  lead_captured: boolean;
  chatbots: {
    name: string;
  };
  conversation_messages: Array<{
    id: string;
    sender: string;
    message_text: string;
    created_at: string;
    channel: string;
  }>;
}

const ConversationList: React.FC = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended' | 'transferred_to_human'>('all');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      let query = supabase
        .from('conversations')
        .select(`
          id,
          chatbot_id,
          visitor_id,
          channel,
          status,
          started_at,
          ended_at,
          lead_captured,
          chatbots!inner(name),
          conversation_messages(id, sender, message_text, created_at, channel)
        `)
        .order('started_at', { ascending: false });

      if (channelFilter !== 'all') {
        query = query.eq('channel', channelFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'active' | 'ended' | 'transferred_to_human');
      }

      const { data, error } = await query;

      if (error) throw error;

      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'website':
        return <Globe className="h-4 w-4" />;
      case 'facebook':
        return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp':
        return <Phone className="h-4 w-4" />;
      case 'slack':
        return <Slack className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'website':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'facebook':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'whatsapp':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'slack':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getLastMessage = (messages: any[]) => {
    if (!messages || messages.length === 0) return null;
    return messages
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  };

  const filteredConversations = conversations.filter(conversation => {
    const searchLower = searchTerm.toLowerCase();
    return (
      conversation.visitor_id.toLowerCase().includes(searchLower) ||
      conversation.chatbots.name.toLowerCase().includes(searchLower) ||
      conversation.conversation_messages.some(msg => 
        msg.message_text.toLowerCase().includes(searchLower)
      )
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Conversations</h2>
          <p className="text-muted-foreground">Manage conversations across all channels</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="slack">Slack</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'ended' | 'transferred_to_human') => setStatusFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conversations List */}
      <div className="space-y-4">
        {filteredConversations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No conversations found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm ? 'Try adjusting your search or filters' : 'Conversations will appear here as visitors interact with your chatbots'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredConversations.map((conversation) => {
            const lastMessage = getLastMessage(conversation.conversation_messages);
            return (
              <Card key={conversation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="secondary" 
                          className={`${getChannelColor(conversation.channel)} flex items-center gap-1`}
                        >
                          {getChannelIcon(conversation.channel)}
                          {conversation.channel}
                        </Badge>
                        
                        <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'}>
                          {conversation.status}
                        </Badge>
                        
                        {conversation.lead_captured && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Lead Captured
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <User className="h-3 w-3" />
                        <span>Visitor: {conversation.visitor_id}</span>
                        <span>•</span>
                        <Bot className="h-3 w-3" />
                        <span>Bot: {conversation.chatbots.name}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(conversation.started_at))} ago</span>
                      </div>
                      
                      {lastMessage && (
                        <div className="bg-muted/50 rounded-md p-3 mt-2">
                          <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">
                            {lastMessage.sender === 'bot' ? 'Bot' : 'User'}
                          </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(lastMessage.created_at))} ago
                            </span>
                          </div>
                          <p className="text-sm line-clamp-2">{lastMessage.message_text}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className="text-sm text-muted-foreground">
                        {conversation.conversation_messages.length} messages
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;