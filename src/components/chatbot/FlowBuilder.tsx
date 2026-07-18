import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  MessageSquare, 
  Edit, 
  Trash2, 
  ArrowRight,
  Mail,
  Phone,
  User,
  Building,
  FileText,
  Video,
  Youtube,
  Play
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

interface FlowBuilderProps {
  chatbotId: string;
  messages: ChatbotMessage[];
  onMessagesUpdate: (messages: ChatbotMessage[]) => void;
}

interface NewMessageData {
  message_key: string;
  message_text: string;
  message_type: 'text' | 'form' | 'button' | 'youtube_video' | 'uploaded_video' | 'video_intro';
  buttons: { text: string; next_key: string }[];
  collect_lead_info: boolean;
  lead_fields: string[];
  video_url?: string;
  video_thumbnail?: string;
  video_autoplay?: boolean;
  video_controls?: boolean;
}

export const FlowBuilder: React.FC<FlowBuilderProps> = ({
  chatbotId,
  messages,
  onMessagesUpdate
}) => {
  const { toast } = useToast();
  const [editingMessage, setEditingMessage] = useState<ChatbotMessage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const emptyMessage: NewMessageData = {
    message_key: '',
    message_text: '',
    message_type: 'text',
    buttons: [],
    collect_lead_info: false,
    lead_fields: [],
    video_url: '',
    video_autoplay: false,
    video_controls: true,
  };
  const [newMessage, setNewMessage] = useState<NewMessageData>(emptyMessage);

  const openAddDialog = () => {
    setEditingMessage(null);
    setNewMessage(emptyMessage);
    setDialogOpen(true);
  };

  const openEditDialog = (msg: ChatbotMessage) => {
    setEditingMessage(msg);
    setNewMessage({
      message_key: msg.message_key,
      message_text: msg.message_text,
      message_type: (['text','form','button','youtube_video','uploaded_video','video_intro'].includes(msg.message_type)
        ? msg.message_type
        : 'text') as NewMessageData['message_type'],
      buttons: Array.isArray(msg.buttons) ? msg.buttons : [],
      collect_lead_info: !!msg.collect_lead_info,
      lead_fields: (msg.conditions && Array.isArray(msg.conditions.lead_fields)) ? msg.conditions.lead_fields : [],
      video_url: msg.video_url || '',
      video_autoplay: !!msg.video_autoplay,
      video_controls: msg.video_controls !== false,
    });
    setDialogOpen(true);
  };

  const saveMessage = async () => {
    if (!newMessage.message_key || !newMessage.message_text) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (messages.some(m => m.message_key === newMessage.message_key && m.id !== editingMessage?.id)) {
      toast({ title: "Error", description: "Message key must be unique", variant: "destructive" });
      return;
    }

    const payload = {
      chatbot_id: chatbotId,
      message_key: newMessage.message_key,
      message_text: newMessage.message_text,
      message_type: newMessage.message_type,
      buttons: newMessage.message_type === 'button' ? newMessage.buttons : null,
      collect_lead_info: newMessage.collect_lead_info,
      conditions: newMessage.collect_lead_info ? { lead_fields: newMessage.lead_fields } : null,
      video_url: newMessage.video_url || null,
      video_autoplay: newMessage.video_autoplay || false,
      video_controls: newMessage.video_controls !== false,
    };

    try {
      if (editingMessage) {
        const { error } = await supabase
          .from('chatbot_messages')
          .update(payload)
          .eq('id', editingMessage.id);
        if (error) throw error;
        onMessagesUpdate(messages.map(m => m.id === editingMessage.id ? { ...m, ...payload } as ChatbotMessage : m));
        toast({ title: "Success", description: "Message updated" });
      } else {
        const { data, error } = await supabase
          .from('chatbot_messages')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        onMessagesUpdate([...messages, data]);
        toast({ title: "Success", description: "Message added" });
      }
      setDialogOpen(false);
      setEditingMessage(null);
      setNewMessage(emptyMessage);
    } catch (err) {
      console.error('Error saving message:', err);
      toast({ title: "Error", description: "Failed to save message", variant: "destructive" });
    }
  };


  const updateMessage = async (messageId: string, updates: Partial<ChatbotMessage>) => {
    try {
      const { error } = await supabase
        .from('chatbot_messages')
        .update(updates)
        .eq('id', messageId);

      if (error) throw error;

      onMessagesUpdate(messages.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      ));

      toast({
        title: "Success",
        description: "Message updated successfully",
      });
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive",
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chatbot_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      onMessagesUpdate(messages.filter(msg => msg.id !== messageId));

      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const addButton = () => {
    setNewMessage(prev => ({
      ...prev,
      buttons: [...prev.buttons, { text: '', next_key: '' }]
    }));
  };

  const removeButton = (index: number) => {
    setNewMessage(prev => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index)
    }));
  };

  const updateButton = (index: number, field: 'text' | 'next_key', value: string) => {
    setNewMessage(prev => ({
      ...prev,
      buttons: prev.buttons.map((btn, i) => 
        i === index ? { ...btn, [field]: value } : btn
      )
    }));
  };

  const toggleLeadField = (field: string) => {
    setNewMessage(prev => ({
      ...prev,
      lead_fields: prev.lead_fields.includes(field)
        ? prev.lead_fields.filter(f => f !== field)
        : [...prev.lead_fields, field]
    }));
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'form': return <Mail className="h-4 w-4" />;
      case 'button': return <FileText className="h-4 w-4" />;
      case 'youtube_video': return <Youtube className="h-4 w-4" />;
      case 'uploaded_video': return <Video className="h-4 w-4" />;
      case 'video_intro': return <Play className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getNextMessage = (messageKey: string | null) => {
    if (!messageKey) return null;
    return messages.find(msg => msg.message_key === messageKey);
  };

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Conversation Flow</h2>
          <p className="text-sm text-muted-foreground">
            Design your chatbot's conversation flow with messages and user interactions
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingMessage(null); }}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMessage ? 'Edit Message' : 'Add New Message'}</DialogTitle>
              <DialogDescription>
                {editingMessage ? 'Update this message in your flow' : 'Create a new message in your chatbot flow'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="message_key">Message Key *</Label>
                  <Input
                    id="message_key"
                    placeholder="e.g., welcome, ask_name"
                    value={newMessage.message_key}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, message_key: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message_type">Message Type</Label>
                  <Select
                    value={newMessage.message_type}
                    onValueChange={(value: NewMessageData['message_type']) => 
                      setNewMessage(prev => ({ ...prev, message_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Message</SelectItem>
                      <SelectItem value="button">Button Options</SelectItem>
                      <SelectItem value="form">Lead Capture Form</SelectItem>
                      <SelectItem value="youtube_video">YouTube Video</SelectItem>
                      <SelectItem value="uploaded_video">Uploaded Video</SelectItem>
                      <SelectItem value="video_intro">Video Introduction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message_text">Message Text *</Label>
                <Textarea
                  id="message_text"
                  placeholder="Enter your message text here..."
                  value={newMessage.message_text}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, message_text: e.target.value }))}
                  rows={3}
                />
              </div>

              {newMessage.message_type === 'button' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Button Options</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addButton}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Button
                    </Button>
                  </div>
                  
                  {newMessage.buttons.map((button, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1 space-y-2">
                        <Label>Button Text</Label>
                        <Input
                          placeholder="Button text"
                          value={button.text}
                          onChange={(e) => updateButton(index, 'text', e.target.value)}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label>Next Message Key</Label>
                        <Input
                          placeholder="Next message key"
                          value={button.next_key}
                          onChange={(e) => updateButton(index, 'next_key', e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeButton(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {newMessage.message_type === 'form' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newMessage.collect_lead_info}
                      onCheckedChange={(checked) => 
                        setNewMessage(prev => ({ ...prev, collect_lead_info: checked }))
                      }
                    />
                    <Label>Collect Lead Information</Label>
                  </div>

                  {newMessage.collect_lead_info && (
                    <div className="space-y-2">
                      <Label>Lead Fields to Collect</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'name', label: 'Name', icon: User },
                          { key: 'email', label: 'Email', icon: Mail },
                          { key: 'phone', label: 'Phone', icon: Phone },
                          { key: 'company', label: 'Company', icon: Building },
                        ].map(({ key, label, icon: Icon }) => (
                          <div key={key} className="flex items-center space-x-2 p-2 border rounded">
                            <input
                              type="checkbox"
                              id={key}
                              checked={newMessage.lead_fields.includes(key)}
                              onChange={() => toggleLeadField(key)}
                            />
                            <Icon className="h-4 w-4" />
                            <Label htmlFor={key} className="text-sm">{label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

                {(newMessage.message_type === 'youtube_video' || 
                  newMessage.message_type === 'uploaded_video' || 
                  newMessage.message_type === 'video_intro') && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="video_url">Video URL</Label>
                      <Input
                        id="video_url"
                        placeholder={newMessage.message_type === 'youtube_video' 
                          ? "https://www.youtube.com/watch?v=..." 
                          : "Video file URL"}
                        value={newMessage.video_url || ''}
                        onChange={(e) => setNewMessage(prev => ({ ...prev, video_url: e.target.value }))}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newMessage.video_autoplay || false}
                          onCheckedChange={(checked) => 
                            setNewMessage(prev => ({ ...prev, video_autoplay: checked }))
                          }
                        />
                        <Label>Autoplay</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newMessage.video_controls !== false}
                          onCheckedChange={(checked) => 
                            setNewMessage(prev => ({ ...prev, video_controls: checked }))
                          }
                        />
                        <Label>Show Controls</Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveMessage}>
                {editingMessage ? 'Save Changes' : 'Add Message'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {messages.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">No messages yet</CardTitle>
            <p className="text-muted-foreground mb-4">
              Start building your chatbot conversation flow by adding your first message.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Message
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((message, index) => {
            const nextMessage = getNextMessage(message.next_message_key);
            
            return (
              <div key={message.id} className="relative">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getMessageIcon(message.message_type)}
                        <div>
                          <CardTitle className="text-base">{message.message_key}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{message.message_type}</Badge>
                            {message.collect_lead_info && (
                              <Badge variant="secondary">Lead Capture</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(message)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMessage(message.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">
                      {message.message_text}
                    </p>
                    
                    {message.buttons && Array.isArray(message.buttons) && message.buttons.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Button Options:</Label>
                        {message.buttons.map((button: any, btnIndex: number) => (
                          <div key={btnIndex} className="flex items-center gap-2 text-xs">
                            <Badge variant="outline">{button.text}</Badge>
                            <ArrowRight className="h-3 w-3" />
                            <span className="text-muted-foreground">{button.next_key || 'End'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {nextMessage && (
                  <div className="flex justify-center my-2">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};