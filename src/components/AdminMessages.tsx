import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, MessageCircle, User, Calendar, Tag, ExternalLink, Send, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  inquiry_type: string | null;
  created_at: string;
  user_id: string | null;
  replied: boolean;
  admin_reply: string | null;
  replied_at: string | null;
  replied_by: string | null;
}

export const AdminMessages = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
      
      // Set reply text if message is selected and has a reply
      if (selectedMessage) {
        const updatedMessage = data?.find(m => m.id === selectedMessage.id);
        if (updatedMessage) {
          setSelectedMessage(updatedMessage);
          setReplyText(updatedMessage.admin_reply || '');
        }
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async (messageId: string) => {
    if (!user || !replyText.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          replied: true,
          admin_reply: replyText,
          replied_at: new Date().toISOString(),
          replied_by: user.id
        })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Reply Sent",
        description: "Your reply has been sent to the user.",
      });

      setReplyText('');
      setSelectedMessage(null);
      fetchMessages();
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    }
  };

  const getInquiryTypeColor = (type: string | null) => {
    switch (type) {
      case 'general':
        return 'bg-blue-100 text-blue-800';
      case 'course':
        return 'bg-green-100 text-green-800';
      case 'technical':
        return 'bg-red-100 text-red-800';
      case 'partnership':
        return 'bg-purple-100 text-purple-800';
      case 'accessibility':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInquiryTypeLabel = (type: string | null) => {
    switch (type) {
      case 'general':
        return 'General Question';
      case 'course':
        return 'Course Information';
      case 'technical':
        return 'Technical Support';
      case 'partnership':
        return 'Partnership';
      case 'accessibility':
        return 'Accessibility';
      default:
        return 'Other';
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to real-time messages
    const channel = supabase
      .channel('admin-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          setMessages(prev => [payload.new as ContactMessage, ...prev]);
          toast({
            title: "New Message",
            description: `New contact form submission from ${payload.new.name}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading messages...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Contact Messages ({messages.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No contact messages yet</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={message.id}>
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="p-4 rounded-lg border hover:bg-muted cursor-pointer transition-colors">
                      <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium truncate">{message.name}</h3>
                              {message.inquiry_type && (
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${getInquiryTypeColor(message.inquiry_type)}`}
                                >
                                  {getInquiryTypeLabel(message.inquiry_type)}
                                </Badge>
                              )}
                              {message.replied && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Replied
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {message.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                              </div>
                            </div>
                            {message.subject && (
                              <p className="text-sm font-medium mb-1 text-foreground">
                                Subject: {message.subject}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {message.message}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <MessageCircle className="h-5 w-5" />
                          Message from {message.name}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="font-medium">Email:</Label>
                            <p className="mt-1">{message.email}</p>
                          </div>
                          <div>
                            <Label className="font-medium">Date:</Label>
                            <p className="mt-1">
                              {new Date(message.created_at).toLocaleDateString()} at{' '}
                              {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          {message.inquiry_type && (
                            <div>
                              <Label className="font-medium">Inquiry Type:</Label>
                              <p className="mt-1">
                                <Badge className={getInquiryTypeColor(message.inquiry_type)}>
                                  {getInquiryTypeLabel(message.inquiry_type)}
                                </Badge>
                              </p>
                            </div>
                          )}
                          {message.user_id && (
                            <div>
                              <Label className="font-medium">User Account:</Label>
                              <p className="mt-1 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Registered user
                              </p>
                            </div>
                          )}
                        </div>
                        {message.subject && (
                          <div>
                            <Label className="font-medium">Subject:</Label>
                            <p className="mt-1 text-foreground">{message.subject}</p>
                          </div>
                        )}
                        <div>
                          <Label className="font-medium">Message:</Label>
                          <div className="mt-2 p-4 bg-muted rounded-lg">
                            <p className="whitespace-pre-wrap">{message.message}</p>
                          </div>
                        </div>
                        
                        {message.admin_reply && (
                          <div>
                            <Label className="font-medium">Admin Reply:</Label>
                            <div className="mt-2 p-4 bg-primary/10 rounded-lg">
                              <p className="whitespace-pre-wrap">{message.admin_reply}</p>
                              {message.replied_at && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Replied {formatDistanceToNow(new Date(message.replied_at), { addSuffix: true })}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {!message.replied && (
                          <div className="space-y-2">
                            <Label>Send Reply</Label>
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type your reply..."
                              rows={4}
                            />
                            <Button 
                              onClick={() => handleReply(message.id)} 
                              disabled={!replyText.trim()}
                              className="w-full"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send Reply
                            </Button>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => window.open(`mailto:${message.email}?subject=Re: ${message.subject || 'Your message'}`)}
                            className="flex-1"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Reply via Email
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {index < messages.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};