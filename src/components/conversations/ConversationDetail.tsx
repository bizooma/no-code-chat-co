import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft,
  Send, 
  Globe, 
  MessageSquare,
  Phone,
  Slack,
  Clock,
  User,
  Bot,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ConversationDetailProps {
  conversationId: string;
  onBack: () => void;
}

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
    platform_metadata?: any;
  }>;
}

const ConversationDetail: React.FC<ConversationDetailProps> = ({ conversationId, onBack }) => {
  const { toast } = useToast();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchConversation();
  }, [conversationId]);

  const fetchConversation = async () => {
    try {
      const { data, error } = await supabase
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
          conversation_messages(id, sender, message_text, created_at, channel, platform_metadata)
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      setConversation(data as Conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversation.id,
          sender: 'agent',
          message_text: newMessage,
          channel: conversation.channel
        });

      if (error) throw error;

      setNewMessage('');
      await fetchConversation(); // Refresh messages

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
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
        return <Globe className="h-4 w-4" />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading conversation...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">Conversation not found</h3>
        <p className="text-muted-foreground mb-4">The requested conversation could not be found.</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Conversations
        </Button>
      </div>
    );
  }

  const sortedMessages = conversation.conversation_messages.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Conversation Details</h1>
            <p className="text-muted-foreground">
              {conversation.chatbots.name} • Visitor {conversation.visitor_id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
              <CheckCircle className="mr-1 h-3 w-3" />
              Lead Captured
            </Badge>
          )}
        </div>
      </div>

      {/* Conversation Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Conversation Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Started:</span>
            <span>{new Date(conversation.started_at).toLocaleString()}</span>
            <span className="text-muted-foreground">
              ({formatDistanceToNow(new Date(conversation.started_at))} ago)
            </span>
          </div>
          
          {conversation.ended_at && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Ended:</span>
              <span>{new Date(conversation.ended_at).toLocaleString()}</span>
              <span className="text-muted-foreground">
                ({formatDistanceToNow(new Date(conversation.ended_at))} ago)
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Messages:</span>
            <span>{conversation.conversation_messages.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>
            Conversation history between the bot and visitor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {sortedMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === 'user' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div className={`max-w-xs lg:max-w-md ${
                  message.sender === 'user' ? 'order-1' : 'order-2'
                }`}>
                  <div className={`p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-muted text-foreground'
                      : message.sender === 'bot'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    <p className="text-sm">{message.message_text}</p>
                  </div>
                  
                  <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${
                    message.sender === 'user' ? 'justify-start' : 'justify-end'
                  }`}>
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-xs">
                        {message.sender === 'user' ? <User className="h-2 w-2" /> : 
                         message.sender === 'bot' ? <Bot className="h-2 w-2" /> : 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="capitalize">{message.sender}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(message.created_at))} ago</span>
                  </div>
                </div>
              </div>
            ))}
            
            {sortedMessages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No messages in this conversation yet.</p>
              </div>
            )}
          </div>

          {/* Send Message (only for active conversations) */}
          {conversation.status === 'active' && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <label className="text-sm font-medium">Send a message as agent</label>
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    rows={2}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || sending}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Messages sent as agent will be delivered through the conversation channel
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversationDetail;