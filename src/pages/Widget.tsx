import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Bot, 
  User, 
  Send, 
  X, 
  Minimize2, 
  MessageCircle,
  Phone,
  Mail,
  Building,
  UserIcon
} from 'lucide-react';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
import AvatarChatbot from '@/components/avatar/AvatarChatbot';
import { VideoFlowWidget } from '@/components/chatbot/VideoFlowWidget';

interface Chatbot {
  id: string;
  name: string;
  welcome_message: string;
  fallback_message: string;
  widget_config: any;
  
}

interface ChatbotMessage {
  id: string;
  message_key: string;
  message_text: string;
  message_type: string;
  buttons: any;
  collect_lead_info: boolean;
  conditions: any;
  video_url?: string;
  video_type?: string;
  video_thumbnail?: string;
  video_duration?: number;
  video_autoplay?: boolean;
  video_controls?: boolean;
  video_layout?: string;
  interactive_elements?: any;
  video_chapters?: any;
}

interface ConversationMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
  buttons?: { text: string; next_key: string }[];
  isForm?: boolean;
  formFields?: string[];
  hasVideo?: boolean;
  videoProps?: {
    type: 'uploaded' | 'video_intro';
    url: string;
    autoplay?: boolean;
    controls?: boolean;
    layout?: string;
    interactive_elements?: any[];
    chapters?: any[];
  };
}

const Widget = () => {
  const [searchParams] = useSearchParams();
  const chatbotId = searchParams.get('chatbotId') || searchParams.get('id');
  const widgetType = searchParams.get('type');
  const isEmbedded = searchParams.get('embedded') === 'true';

  // When embedded, make the document transparent so no white box shows behind the bubble
  useEffect(() => {
    if (!isEmbedded) return;
    const targets = [
      document.documentElement,
      document.body,
      document.getElementById('root'),
    ].filter(Boolean) as HTMLElement[];
    const previous = targets.map((el) => el.style.background);
    const hadBgClass = targets.map((el) => el.classList.contains('bg-background'));
    targets.forEach((el) => {
      el.style.background = 'transparent';
      el.classList.remove('bg-background');
    });
    return () => {
      targets.forEach((el, i) => {
        el.style.background = previous[i];
        if (hadBgClass[i]) el.classList.add('bg-background');
      });
    };
  }, [isEmbedded]);

  // If it's a video bot, render VideoFlowWidget
  if (widgetType === 'video' && chatbotId) {
    return (
      <div className={isEmbedded ? 'h-full' : 'min-h-screen'}>
        <VideoFlowWidget chatbotId={chatbotId} />
      </div>
    );
  }
  
  // If it's an avatar chatbot, render that component
  if (widgetType === 'avatar' && chatbotId) {
    return (
      <div className={isEmbedded ? 'h-full' : 'min-h-screen bg-background'}>
        <AvatarChatbot chatbotId={chatbotId} />
      </div>
    );
  }
  
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentMessageKey, setCurrentMessageKey] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [visitorId] = useState(() => {
    // Generate or retrieve visitor ID from localStorage
    const stored = localStorage.getItem('chatbot_visitor_id');
    if (stored) return stored;
    const newId = crypto.randomUUID();
    localStorage.setItem('chatbot_visitor_id', newId);
    return newId;
  });
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatbotId) {
      fetchChatbot();
      fetchMessages();
    }
  }, [chatbotId]);

  // Tell the embedding page how much space the widget needs
  useEffect(() => {
    if (window.parent === window) return; // not embedded
    const size = !chatbot
      ? { width: 0, height: 0 }
      : !isOpen
        ? { width: 80, height: 80 }
        : isMinimized
          ? { width: 384, height: 72 }
          : { width: 384, height: 560 };
    window.parent.postMessage({ type: 'SUPPORTBOTS_RESIZE', ...size }, '*');
  }, [chatbot, isOpen, isMinimized]);


  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current && conversation.length > 0) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }, 100);
      }
    }
  }, [conversation]);

  const fetchChatbot = async () => {
    if (!chatbotId) return;

    try {
      const { data, error } = await supabase.rpc('get_chatbot_widget_config', {
        _chatbot_id: chatbotId,
      });

      if (error) throw error;
      setChatbot((data?.[0] ?? null) as Chatbot | null);
    } catch (error) {
      console.error('Error fetching chatbot:', error);
    }
  };

  const fetchMessages = async () => {
    if (!chatbotId) return;

    try {
      const { data, error } = await supabase.rpc('get_chatbot_widget_messages', {
        _chatbot_id: chatbotId,
      });

      if (error) throw error;
      setMessages((data || []) as ChatbotMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const createConversation = async () => {
    if (!chatbotId || conversationId) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          chatbot_id: chatbotId,
          visitor_id: visitorId,
          visitor_info: {
            user_agent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer
          }
        })
        .select()
        .single();

      if (error) throw error;
      setConversationId(data.id);
      
      // Track conversation started event
      await supabase.from('analytics_events').insert({
        chatbot_id: chatbotId,
        conversation_id: data.id,
        event_type: 'conversation_started',
        visitor_id: visitorId
      });

      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const saveMessage = async (sender: 'bot' | 'user', text: string, convId?: string) => {
    const targetConvId = convId || conversationId;
    if (!targetConvId) return;

    try {
      await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: targetConvId,
          sender,
          message_text: text
        });

      // Track message sent event
      await supabase.from('analytics_events').insert({
        chatbot_id: chatbotId!,
        conversation_id: targetConvId,
        event_type: 'message_sent',
        event_data: { sender, message_length: text.length },
        visitor_id: visitorId
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const initializeChat = async () => {
    if (!chatbot || conversation.length > 0) return;

    const convId = await createConversation();
    
    // Add welcome message
    const welcomeMessage: ConversationMessage = {
      id: 'welcome',
      sender: 'bot',
      text: chatbot.welcome_message,
      timestamp: new Date()
    };

    setConversation([welcomeMessage]);
    if (convId) {
      await saveMessage('bot', chatbot.welcome_message, convId);
    }

    // Find and send first flow message
    const startMessage = messages.find(msg => msg.message_key === 'start') || messages[0];
    if (startMessage) {
      setTimeout(() => {
        setCurrentMessageKey(startMessage.message_key);
        sendBotMessage(startMessage, convId);
      }, 1000);
    }
  };

  const findMessage = (messageKey: string): ChatbotMessage | undefined => {
    return messages.find(msg => msg.message_key === messageKey);
  };

  const sendBotMessage = async (message: ChatbotMessage, convId?: string) => {
    const hasVideo = ['youtube_video', 'uploaded_video', 'video_intro'].includes(message.message_type);
    
    const newMessage: ConversationMessage = {
      id: Date.now().toString(),
      sender: 'bot',
      text: message.message_text,
      timestamp: new Date(),
      buttons: message.buttons ? message.buttons : undefined,
      isForm: message.collect_lead_info,
      formFields: message.collect_lead_info && message.conditions?.lead_fields ? message.conditions.lead_fields : undefined,
      hasVideo,
      videoProps: hasVideo ? {
        type: message.video_type === 'video_intro' ? 'video_intro' : 'uploaded',
        url: message.video_url!,
        autoplay: message.video_autoplay,
        controls: message.video_controls,
        layout: message.video_layout,
        interactive_elements: message.interactive_elements,
        chapters: message.video_chapters
      } : undefined
    };

    setConversation(prev => [...prev, newMessage]);
    await saveMessage('bot', message.message_text, convId);
  };

  const [isTyping, setIsTyping] = useState(false);

  const handleUserMessage = async (text: string, nextKey?: string) => {
    // Add user message to conversation
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);
    setCurrentInput('');
    await saveMessage('user', text);

    // Button path: follow the flow
    if (nextKey) {
      setTimeout(async () => {
        const nextMessage = findMessage(nextKey);
        if (nextMessage) {
          setCurrentMessageKey(nextKey);
          await sendBotMessage(nextMessage);
        } else {
          setCurrentMessageKey(null);
        }
      }, 500);
      return;
    }

    // Free-text path: use AI when enabled, otherwise fallback
    const aiEnabled = (chatbot as any)?.ai_enabled;
    if (aiEnabled && chatbotId) {
      setIsTyping(true);
      try {
        const history = [...conversation, userMessage].slice(-12).map(m => ({
          sender: m.sender,
          text: m.text,
        }));
        const { data, error } = await supabase.functions.invoke('generate-chat-response', {
          body: { chatbotId, message: text, history },
        });
        if (error) throw error;

        let replyText: string;
        if (data?.limitReached) {
          replyText = "This assistant has reached its monthly message limit. Please try again next month or contact the site owner.";
        } else if (data?.reply) {
          replyText = data.reply;
        } else {
          replyText = chatbot?.fallback_message || "I didn't understand that.";
        }
        const aiMessage: ConversationMessage = {
          id: Date.now().toString(),
          sender: 'bot',
          text: replyText,
          timestamp: new Date(),
        };
        setConversation(prev => [...prev, aiMessage]);
        await saveMessage('bot', replyText);
      } catch (e) {
        console.error('AI response error:', e);
        const errMessage: ConversationMessage = {
          id: Date.now().toString(),
          sender: 'bot',
          text: chatbot?.fallback_message || "Sorry, something went wrong.",
          timestamp: new Date(),
        };
        setConversation(prev => [...prev, errMessage]);
        await saveMessage('bot', errMessage.text);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    setTimeout(async () => {
      const fallbackMessage: ConversationMessage = {
        id: Date.now().toString(),
        sender: 'bot',
        text: chatbot?.fallback_message || "I didn't understand that.",
        timestamp: new Date()
      };
      setConversation(prev => [...prev, fallbackMessage]);
      await saveMessage('bot', fallbackMessage.text);
    }, 400);
  };

  const handleButtonClick = (button: { text: string; next_key: string }) => {
    handleUserMessage(button.text, button.next_key);
  };

  const handleFormSubmit = async (formData: Record<string, string>) => {
    // Save lead data
    if (conversationId && chatbotId) {
      try {
        const { data: chatbotData } = await supabase
          .from('chatbots')
          .select('workspace_id')
          .eq('id', chatbotId)
          .single();

        if (chatbotData) {
          await supabase.from('leads').insert({
            conversation_id: conversationId,
            chatbot_id: chatbotId,
            workspace_id: chatbotData.workspace_id,
            email: formData.email || null,
            phone: formData.phone || null,
            name: formData.name || null,
            company: formData.company || null,
            additional_data: formData
          });

          // Track lead captured event
          await supabase.from('analytics_events').insert({
            chatbot_id: chatbotId,
            conversation_id: conversationId,
            event_type: 'lead_captured',
            event_data: { fields: Object.keys(formData) },
            visitor_id: visitorId
          });
        }
      } catch (error) {
        console.error('Error saving lead:', error);
      }
    }

    const formText = Object.entries(formData)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    handleUserMessage(`Thank you for providing your information!`);
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

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && conversation.length === 0) {
      initializeChat();
    }
  };

  const renderMessage = (message: ConversationMessage) => (
    <div
      key={message.id}
      className={`flex gap-3 mb-4 ${message.sender === 'user' ? 'justify-end' : ''}`}
    >
      {message.sender === 'bot' && (
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: chatbot?.widget_config?.color || '#3B82F6' }}
        >
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-first' : ''}`}>
        <div
          className={`rounded-lg px-3 py-2 ${
            message.sender === 'bot'
              ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
              : 'text-white ml-auto'
          }`}
          style={message.sender === 'user' ? { 
            backgroundColor: chatbot?.widget_config?.color || '#3B82F6' 
          } : {}}
        >
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        </div>

        {/* Video Content */}
        {message.hasVideo && message.videoProps && (
          <div className="mt-3">
            <VideoPlayer
              type={message.videoProps.type}
              url={message.videoProps.url}
              autoplay={message.videoProps.autoplay}
              controls={message.videoProps.controls !== false}
              layout={message.videoProps.layout as any}
              chatbotId={chatbotId || undefined}
              conversationId={conversationId || undefined}
              visitorId={visitorId}
              interactiveElements={message.videoProps.interactive_elements}
              chapters={message.videoProps.chapters}
              className="max-w-full"
            />
          </div>
        )}
        
        {message.buttons && message.buttons.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.buttons.map((button, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="mr-2 mb-1 text-xs"
                onClick={() => handleButtonClick(button)}
              >
                {button.text}
              </Button>
            ))}
          </div>
        )}

        {message.isForm && message.formFields && (
          <LeadForm 
            fields={message.formFields}
            onSubmit={handleFormSubmit}
            accentColor={chatbot?.widget_config?.color || '#3B82F6'}
          />
        )}
        
        <div className="text-xs text-gray-500 mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      {message.sender === 'user' && (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </div>
      )}
    </div>
  );

  if (!chatbot) {
    return null; // Don't render if chatbot not found or inactive
  }

  const position = chatbot.widget_config?.position || 'bottom-right';
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  return (
    <div className={`fixed ${positionClasses[position as keyof typeof positionClasses]} z-50`}>
      {!isOpen ? (
        // Chat Bubble
        <Button
          onClick={toggleChat}
          className="rounded-full w-14 h-14 shadow-lg hover:scale-105 transition-transform"
          style={{ backgroundColor: chatbot.widget_config?.color || '#3B82F6' }}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      ) : (
        // Chat Window
        <Card className="w-[368px] h-[544px] shadow-xl border-0 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
          {/* Header */}
          <div 
            className="px-4 py-3 flex items-center justify-between text-white"
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
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 p-1 h-auto"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  if (window.parent !== window) {
                    window.parent.postMessage({ type: 'SUPPORTBOTS_CLOSE' }, '*');
                  }
                }}
                className="text-white hover:bg-white/20 p-1 h-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4 h-64 md:h-80" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {conversation.map(renderMessage)}
                  {isTyping && (
                    <div className="flex gap-3 mb-4">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: chatbot?.widget_config?.color || '#3B82F6' }}
                      >
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-800">
                        <span className="inline-flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <Input
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="sm"
                    className="px-3"
                    style={{ backgroundColor: chatbot.widget_config?.color || '#3B82F6' }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

// Lead Form Component
const LeadForm: React.FC<{
  fields: string[];
  onSubmit: (data: Record<string, string>) => void;
  accentColor: string;
}> = ({ fields, onSubmit, accentColor }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const fieldConfig = {
    name: { label: 'Name', icon: UserIcon, type: 'text' },
    email: { label: 'Email', icon: Mail, type: 'email' },
    phone: { label: 'Phone', icon: Phone, type: 'tel' },
    company: { label: 'Company', icon: Building, type: 'text' }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 bg-gray-50 dark:bg-gray-800 p-3 rounded">
      <p className="text-sm font-medium">Please provide your information:</p>
      {fields.map((field) => {
        const config = fieldConfig[field as keyof typeof fieldConfig];
        if (!config) return null;
        
        const Icon = config.icon;
        
        return (
          <div key={field} className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Icon className="h-4 w-4 text-gray-500" />
            </div>
            <Input
              type={config.type}
              placeholder={config.label}
              value={formData[field] || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
              required
              className="pl-10 bg-white dark:bg-gray-900 text-sm"
            />
          </div>
        );
      })}
      <Button 
        type="submit" 
        size="sm" 
        className="w-full"
        style={{ backgroundColor: accentColor }}
      >
        Submit
      </Button>
    </form>
  );
};

export default Widget;