import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send, StopCircle, Video, MessageCircle } from 'lucide-react';
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
  VoiceEmotion,
} from '@heygen/streaming-avatar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AvatarChatbotProps {
  chatbotId: string;
  onClose?: () => void;
}

const AvatarChatbot: React.FC<AvatarChatbotProps> = ({ chatbotId, onClose }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatbot, setChatbot] = useState<any>(null);
  const [visitorId] = useState(() => `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionStartTime = useRef<number>(0);

  // Fetch chatbot configuration
  useEffect(() => {
    const fetchChatbot = async () => {
      const { data, error } = await supabase
        .from('avatar_chatbots')
        .select('*')
        .eq('id', chatbotId)
        .single();

      if (error) {
        console.error('Error fetching chatbot:', error);
        toast({
          title: 'Error',
          description: 'Failed to load chatbot configuration',
          variant: 'destructive',
        });
        return;
      }

      setChatbot(data);
    };

    fetchChatbot();
  }, [chatbotId, toast]);

  const startSession = async () => {
    if (!chatbot) return;

    setIsLoading(true);
    try {
      // Get HeyGen token
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('generate-heygen-token');

      if (tokenError || !tokenData?.token) {
        throw new Error('Failed to get HeyGen token');
      }

      // Initialize avatar
      const avatar = new StreamingAvatar({
        token: tokenData.token,
      });

      avatarRef.current = avatar;

      // Set up event listeners
      avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
        console.log('Avatar started talking');
        setIsSpeaking(true);
      });

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log('Avatar stopped talking');
        setIsSpeaking(false);
      });

      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log('Stream ready:', event);
        if (event.detail && videoRef.current) {
          videoRef.current.srcObject = event.detail;
          videoRef.current.play();
        }
      });

      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('Stream disconnected');
        endSession();
      });

      // Start avatar session
      const session = await avatar.createStartAvatar({
        avatarName: chatbot.avatar_id,
        quality: AvatarQuality.High,
        voice: {
          voiceId: chatbot.voice_id,
        },
      });

      setSessionData(session);
      setSessionActive(true);
      sessionStartTime.current = Date.now();

      toast({
        title: 'Connected',
        description: 'Avatar session started successfully',
      });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start avatar session',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = async () => {
    if (avatarRef.current) {
      await avatarRef.current.stopAvatar();
      avatarRef.current = null;
    }

    // Save conversation
    if (messages.length > 0) {
      const sessionDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      
      await supabase.functions.invoke('save-avatar-conversation', {
        body: {
          conversationId,
          chatbotId,
          visitorId,
          messages,
          sessionDuration,
        },
      });
    }

    setSessionActive(false);
    setSessionData(null);
    setIsSpeaking(false);

    toast({
      title: 'Session Ended',
      description: 'Avatar session has been closed',
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionActive || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get AI response
      const { data: aiData, error: aiError } = await supabase.functions.invoke('process-avatar-message', {
        body: {
          message: userMessage.content,
          chatbotId,
          conversationHistory: messages,
        },
      });

      if (aiError || !aiData?.response) {
        throw new Error('Failed to get AI response');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: aiData.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Make avatar speak the response
      if (avatarRef.current && sessionData) {
        await avatarRef.current.speak({
          text: aiData.response,
          taskType: TaskType.REPEAT,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">
              {chatbot?.name || 'Avatar Chatbot'}
            </h2>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>

        {/* Video Display */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!sessionActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center space-y-4">
                <Video className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Start a session to begin</p>
              </div>
            </div>
          )}
          {isSpeaking && sessionActive && (
            <div className="absolute bottom-4 left-4">
              <div className="flex items-center gap-2 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Speaking
              </div>
            </div>
          )}
        </div>

        {/* Session Controls */}
        <div className="flex justify-center gap-2">
          {!sessionActive ? (
            <Button
              onClick={startSession}
              disabled={isLoading || !chatbot}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Start Session
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={endSession}
              variant="destructive"
              size="lg"
            >
              <StopCircle className="mr-2 h-4 w-4" />
              End Session
            </Button>
          )}
        </div>

        {/* Chat History */}
        {sessionActive && (
          <>
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Conversation</h3>
              </div>
              <ScrollArea className="h-64 w-full border rounded-lg p-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {msg.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading || !sessionActive}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim() || !sessionActive}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default AvatarChatbot;
