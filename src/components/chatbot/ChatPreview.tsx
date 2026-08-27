import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Send, Bot, User, Minimize2, ExternalLink } from 'lucide-react';
import { FlowButton, safeExternalUrl, normalizeFlowButton } from '@/lib/buttonLink';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { supabase } from '@/integrations/supabase/client';

interface Chatbot {
  id: string;
  name: string; 
  welcome_message: string;
  fallback_message: string;
  widget_config: any;
  ai_enabled?: boolean;
  ai_model?: string | null;
  ai_prompt?: string | null;
}

interface ChatbotMessage {
  id: string;
  message_key: string;
  message_text: string;
  message_type: 'text' | 'image' | 'file' | 'form' | 'button' | 'youtube_video' | 'uploaded_video' | 'video_intro';
  next_message_key: string | null;
  conditions: any;
  buttons: any;
  collect_lead_info: boolean;
  video_url?: string;
  video_thumbnail?: string;
  video_duration?: number;
  video_autoplay?: boolean;
  video_controls?: boolean;
}

interface ConversationMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
  buttons?: FlowButton[];
  isForm?: boolean;
  formFields?: string[];
  messageType?: 'text' | 'image' | 'file' | 'form' | 'button' | 'youtube_video' | 'uploaded_video' | 'video_intro';
  videoUrl?: string;
  videoAutoplay?: boolean;
  videoControls?: boolean;
}

interface ChatPreviewProps {
  chatbot: Chatbot;
  messages: ChatbotMessage[];
  onClose: () => void;
}

export const ChatPreview: React.FC<ChatPreviewProps> = ({
  chatbot,
  messages,
  onClose
}) => {
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentMessageKey, setCurrentMessageKey] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [leadData, setLeadData] = useState<Record<string, string>>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize conversation with welcome message
    setConversation([{
      id: 'welcome',
      sender: 'bot',
      text: chatbot.welcome_message,
      timestamp: new Date()
    }]);

    // Find and set the first message (usually 'start' or 'welcome')
    const startMessage = messages.find(msg => msg.message_key === 'start') || messages[0];
    if (startMessage) {
      setCurrentMessageKey(startMessage.message_key);
      setTimeout(() => {
        sendBotMessage(startMessage);
      }, 1000);
    }
  }, [chatbot, messages]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [conversation]);

  const findMessage = (messageKey: string): ChatbotMessage | undefined => {
    return messages.find(msg => msg.message_key === messageKey);
  };

  const sendBotMessage = (message: ChatbotMessage) => {
    const newMessage: ConversationMessage = {
      id: Date.now().toString(),
      sender: 'bot',
      text: message.message_text,
      timestamp: new Date(),
      buttons: message.buttons && Array.isArray(message.buttons) ? message.buttons : undefined,
      isForm: message.collect_lead_info,
      formFields: message.collect_lead_info && message.conditions?.lead_fields ? message.conditions.lead_fields : undefined,
      messageType: message.message_type,
      videoUrl: message.video_url,
      videoAutoplay: message.video_autoplay,
      videoControls: message.video_controls
    };

    setConversation(prev => [...prev, newMessage]);
  };

  const [isTyping, setIsTyping] = useState(false);

  const handleUserMessage = async (text: string, nextKey?: string) => {
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);
    setCurrentInput('');

    if (nextKey) {
      setTimeout(() => {
        const nextMessage = findMessage(nextKey);
        if (nextMessage) {
          setCurrentMessageKey(nextKey);
          sendBotMessage(nextMessage);
        } else {
          setCurrentMessageKey(null);
        }
      }, 500);
      return;
    }

    if (chatbot.ai_enabled) {
      setIsTyping(true);
      try {
        const history = [...conversation, userMessage].slice(-12).map(m => ({
          sender: m.sender,
          text: m.text,
        }));
        const { data, error } = await supabase.functions.invoke('generate-chat-response', {
          body: { chatbotId: chatbot.id, message: text, history },
        });
        if (error) throw error;
        const replyText = data?.limitReached
          ? "This assistant has reached its monthly message limit."
          : (data?.reply || chatbot.fallback_message);
        setConversation(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'bot',
          text: replyText,
          timestamp: new Date(),
        }]);
      } catch (e) {
        console.error('AI preview error:', e);
        setConversation(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'bot',
          text: chatbot.fallback_message,
          timestamp: new Date(),
        }]);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    setTimeout(() => {
      setConversation(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        text: chatbot.fallback_message,
        timestamp: new Date(),
      }]);
    }, 400);
  };

  const handleButtonClick = (button: FlowButton) => {
    handleUserMessage(button.text, button.next_key);
  };

  const handleFormSubmit = (formData: Record<string, string>) => {
    setLeadData(formData);
    const formText = Object.entries(formData)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    handleUserMessage(`Form submitted: ${formText}`);
  };

  const handleSendMessage = () => {
    if (currentInput.trim()) {
      handleUserMessage(currentInput.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message: ConversationMessage) => (
    <div
      key={message.id}
      className={`flex gap-3 mb-4 ${message.sender === 'user' ? 'justify-end' : ''}`}
    >
      {message.sender === 'bot' && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-first' : ''}`}>
        <div
          className={`rounded-lg px-3 py-2 ${
            message.sender === 'bot'
              ? 'bg-muted text-foreground'
              : 'bg-primary text-primary-foreground ml-auto'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        </div>

        {/* Video content for video message types */}
        {message.messageType && 
         (message.messageType === 'youtube_video' || 
          message.messageType === 'uploaded_video' || 
          message.messageType === 'video_intro') && 
         message.videoUrl && (
          <div className="mt-2">
            <VideoPlayer
              type={message.messageType === 'video_intro' ? 'video_intro' : 'uploaded'}
              url={message.videoUrl}
              autoplay={message.videoAutoplay}
              controls={message.videoControls}
              layout="portrait"
              className="max-w-sm"
              onVideoEnd={() => {
                // Continue to next message or chat flow after video ends
                if (message.messageType === 'video_intro') {
                  // Logic for continuing after intro video
                }
              }}
            />
          </div>
        )}
        
        {message.buttons && message.buttons.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.buttons.map((button, index) => (
              (() => {
                const href = safeExternalUrl(button.url);
                if (href) {
                  return (
                    <Button key={index} asChild variant="outline" size="sm" className="mr-2 mb-1">
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {button.text}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  );
                }
                if (button.url) return null;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="mr-2 mb-1"
                    onClick={() => handleButtonClick(button)}
                  >
                    {button.text}
                  </Button>
                );
              })()
            ))}
          </div>
        )}

        {message.isForm && message.formFields && (
          <LeadForm 
            fields={message.formFields}
            onSubmit={handleFormSubmit}
          />
        )}
        
        <div className="text-xs text-muted-foreground mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      {message.sender === 'user' && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );

  if (isMinimized) {
    return (
      <div className="absolute bottom-4 right-4">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-12 h-12"
          style={{ backgroundColor: chatbot.widget_config?.color || '#3B82F6' }}
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div 
        className="px-4 py-3 border-b flex items-center justify-between text-white"
        style={{ backgroundColor: chatbot.widget_config?.color || '#3B82F6' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-medium text-sm">{chatbot.name}</h3>
            <p className="text-xs opacity-80">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            className="text-white hover:bg-white/20 p-1 h-auto"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20 p-1 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {conversation.map(renderMessage)}
          {isTyping && (
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="rounded-lg px-3 py-2 bg-muted">
                <span className="inline-flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            size="sm"
            style={{ backgroundColor: chatbot.widget_config?.color || '#3B82F6' }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Lead Form Component
const LeadForm: React.FC<{
  fields: string[];
  onSubmit: (data: Record<string, string>) => void;
}> = ({ fields, onSubmit }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const fieldLabels = {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    company: 'Company'
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 bg-muted p-3 rounded">
      <p className="text-sm font-medium">Please provide your information:</p>
      {fields.map((field) => (
        <div key={field}>
          <Input
            placeholder={fieldLabels[field as keyof typeof fieldLabels] || field}
            value={formData[field] || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
            required
            className="bg-background"
          />
        </div>
      ))}
      <Button type="submit" size="sm" className="w-full">
        Submit
      </Button>
    </form>
  );
};