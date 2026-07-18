import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mic, PhoneOff, Video, MessageCircle } from "lucide-react";
import { createAgentManager } from "@d-id/client-sdk";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AvatarChatbotProps {
  chatbotId: string;
  onClose?: () => void;
}

const AvatarChatbot: React.FC<AvatarChatbotProps> = ({ chatbotId, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatbot, setChatbot] = useState<any>(null);
  const [visitorId] = useState(() => `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  const agentManagerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionStartTimeRef = useRef<number>(0);
  
  const { toast } = useToast();

  // Fetch chatbot configuration
  useEffect(() => {
    const fetchChatbot = async () => {
      const { data, error } = await supabase
        .rpc("get_avatar_widget_config", { _chatbot_id: chatbotId })
        .single();

      if (error) {
        console.error("Error fetching chatbot:", error);
        toast({
          title: "Error",
          description: "Failed to load chatbot configuration",
          variant: "destructive",
        });
        return;
      }

      setChatbot(data);
    };

    fetchChatbot();
  }, [chatbotId, toast]);

  // Start avatar session
  const startSession = async () => {
    if (!chatbot) {
      toast({
        title: "Error",
        description: "Chatbot configuration not found",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Fetch D-ID agent credentials from database
      const { data: chatbotData, error: fetchError } = await supabase
        .from('avatar_chatbots')
        .select('did_agent_id, did_client_key')
        .eq('id', chatbotId)
        .single();

      if (fetchError) {
        console.error("Error fetching D-ID credentials:", fetchError);
        throw new Error("Failed to fetch D-ID agent credentials");
      }

      if (!chatbotData?.did_agent_id || !chatbotData?.did_client_key) {
        toast({
          title: "Configuration Required",
          description: "Please save the chatbot configuration first to create the D-ID agent",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log("Initializing D-ID agent:", chatbotData.did_agent_id);

      // Initialize D-ID Agent Manager with stored credentials
      const agentManager = await createAgentManager(chatbotData.did_agent_id, {
        mode: 'functional' as any,
        auth: {
          type: 'key',
          clientKey: chatbotData.did_client_key
        } as any,
        callbacks: {
          onSrcObjectReady: (value: MediaStream) => {
            console.log("Video stream ready");
            if (videoRef.current) {
              videoRef.current.srcObject = value;
            }
          },
          onVideoStateChange: (state: string) => {
            console.log("Video state:", state);
            setIsSpeaking(state === "playing");
          },
          onConnectionStateChange: (state: string) => {
            console.log("Connection state:", state);
            if (state === "connected") {
              setIsSessionActive(true);
              sessionStartTimeRef.current = Date.now();
            } else if (state === "disconnected") {
              setIsSessionActive(false);
            }
          },
          onNewMessage: (messages: any[], type: string) => {
            console.log("New message:", type, messages);
            if (type === "answer" && messages.length > 0) {
              const lastMessage = messages[messages.length - 1];
              if (lastMessage.role === "assistant") {
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: lastMessage.content,
                    timestamp: new Date(),
                  },
                ]);
              }
            }
          },
          onError: (error: any, errorData: any) => {
            console.error("D-ID error:", error, errorData);
            toast({
              title: "Avatar Error",
              description: error?.message || "An error occurred with the avatar",
              variant: "destructive",
            });
          },
        },
        streamOptions: {
          compatibilityMode: "auto",
          streamWarmup: false,
        },
      });

      agentManagerRef.current = agentManager;

      // Connect to agent
      console.log("Connecting to D-ID agent...");
      await agentManager.connect();

      console.log("D-ID session started successfully");

      toast({
        title: "Session Started",
        description: "Avatar is ready to chat!",
      });
    } catch (error: any) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start avatar session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // End avatar session
  const endSession = async () => {
    if (!agentManagerRef.current) return;

    try {
      await agentManagerRef.current.disconnect();
      
      // Save conversation to database
      if (messages.length > 0) {
        const sessionDuration = Math.floor(
          (Date.now() - sessionStartTimeRef.current) / 1000
        );

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

      setIsSessionActive(false);
      agentManagerRef.current = null;

      toast({
        title: "Session Ended",
        description: "Avatar session has been closed",
      });
    } catch (error: any) {
      console.error("Error ending session:", error);
      toast({
        title: "Error",
        description: "Failed to end session properly",
        variant: "destructive",
      });
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !agentManagerRef.current || !isSessionActive) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send message to D-ID agent (it will use its LLM to respond)
      await agentManagerRef.current.chat(userMessage.content);

      console.log("Message sent to D-ID agent");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
            <h2 className="text-xl font-semibold">{chatbot?.name || "Avatar Chatbot"}</h2>
            {isSpeaking && (
              <span className="flex items-center gap-1 text-sm text-primary">
                <Mic className="w-4 h-4 animate-pulse" />
                Speaking...
              </span>
            )}
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
          
          {!isSessionActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center space-y-4">
                <Video className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Start a session to begin</p>
              </div>
            </div>
          )}

          {isSpeaking && isSessionActive && (
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
          {!isSessionActive ? (
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
              <PhoneOff className="mr-2 h-4 w-4" />
              End Session
            </Button>
          )}
        </div>

        {/* Chat History */}
        {isSessionActive && (
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
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
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
                disabled={isLoading || !isSessionActive}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim() || !isSessionActive}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send"
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
