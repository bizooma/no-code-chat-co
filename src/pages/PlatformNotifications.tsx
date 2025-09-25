import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Eye, EyeOff, Shield } from 'lucide-react';

interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

export default function PlatformNotifications() {
  const { isPlatformOwner, user } = useAuth();
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isPlatformOwner) {
      fetchNotifications();
    }
  }, [isPlatformOwner]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and message",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase
        .from('platform_notifications')
        .insert({
          title: title.trim(),
          message: message.trim(),
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Platform notification created successfully",
      });

      setTitle('');
      setMessage('');
      fetchNotifications();
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: "Error",
        description: "Failed to create notification",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleNotificationStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('platform_notifications')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Notification ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      fetchNotifications();
    } catch (error) {
      console.error('Error updating notification:', error);
      toast({
        title: "Error",
        description: "Failed to update notification status",
        variant: "destructive",
      });
    }
  };

  if (!isPlatformOwner) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Platform Notifications</h1>
          <p className="text-muted-foreground">
            Send platform-wide notifications to all users
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Create New Notification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Notification
            </CardTitle>
            <CardDescription>
              Send a notification to all platform users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notification-title">Title</Label>
              <Input
                id="notification-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notification title"
              />
            </div>
            <div>
              <Label htmlFor="notification-message">Message</Label>
              <Textarea
                id="notification-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter notification message"
                rows={4}
              />
            </div>
            <Button 
              onClick={createNotification} 
              disabled={creating || !title.trim() || !message.trim()}
            >
              {creating ? 'Creating...' : 'Send Notification'}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>
              Manage existing platform notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No notifications created yet
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={notification.is_active ? 'default' : 'secondary'}>
                          {notification.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Switch
                          checked={notification.is_active}
                          onCheckedChange={() => 
                            toggleNotificationStatus(notification.id, notification.is_active)
                          }
                        />
                        {notification.is_active ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground">{notification.message}</p>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
