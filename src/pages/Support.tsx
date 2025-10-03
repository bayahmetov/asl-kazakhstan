import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageCircle, Clock, CheckCircle, AlertCircle, Send, FileText, Paperclip, Download, Trash2, X, BookOpen, HelpCircle, LifeBuoy, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  created_at: string;
  updated_at: string;
  recipient_id?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
}

interface TicketReply {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  profiles?: {
    full_name: string;
    role: string;
  };
}

interface SupportTopic {
  id: string;
  title: string;
  content: string;
  category: string;
  display_order: number;
}

const Support = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [topics, setTopics] = useState<SupportTopic[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [potentialRecipients, setPotentialRecipients] = useState<Array<{ id: string; full_name: string; role: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    priority: "normal",
    category: "technical",
    recipientId: "",
    file: null as File | null
  });

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from("support_topics")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets((data || []) as SupportTicket[]);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from("support_replies")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      const userIds = [...new Set(data?.map(r => r.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', userIds);
      
      const enrichedReplies = data?.map(reply => ({
        ...reply,
        profiles: profilesData?.find(p => p.id === reply.user_id)
      })) || [];
      
      setReplies(enrichedReplies as TicketReply[]);
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  useEffect(() => {
    fetchTopics();
    if (user) {
      fetchTickets();
      checkUserRole();
    }
  }, [user]);

  const checkUserRole = async () => {
    if (!user) return;
    
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'instructor')
      .maybeSingle();
    
    const userIsInstructor = !!roleData;
    setIsInstructor(userIsInstructor);
    
    if (userIsInstructor) {
      // Fetch admins and other instructors
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'instructor']);
      
      if (rolesData) {
        const userIds = rolesData.map(r => r.user_id).filter(id => id !== user.id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        
        if (profilesData) {
          const enriched = profilesData.map(p => ({
            ...p,
            role: rolesData.find(r => r.user_id === p.id)?.role || 'instructor'
          }));
          setPotentialRecipients(enriched);
        }
      }
    }
  };

  useEffect(() => {
    if (selectedTicket) {
      fetchReplies(selectedTicket.id);
    } else {
      setReplies([]);
      setReplyMessage("");
      setReplyFile(null);
    }
  }, [selectedTicket]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      let fileUrl = null;
      let fileName = null;
      let fileType = null;
      let fileSize = null;

      if (formData.file) {
        const filePath = `${user.id}/${Date.now()}-${formData.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("support-attachments")
          .upload(filePath, formData.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("support-attachments")
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = formData.file.name;
        fileType = formData.file.type;
        fileSize = formData.file.size;
      }

      const { error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: formData.subject,
          message: formData.message,
          priority: formData.priority,
          category: formData.category,
          recipient_id: formData.recipientId || null,
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType,
          file_size: fileSize,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Support ticket created successfully",
      });

      setFormData({
        subject: "",
        message: "",
        priority: "normal",
        category: "technical",
        recipientId: "",
        file: null
      });
      if (createFileInputRef.current) createFileInputRef.current.value = "";
      setIsCreateDialogOpen(false);
      fetchTickets();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
    }
  };

  const handleCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      setFormData({ ...formData, file });
    }
  };

  const handleReply = async () => {
    if ((!replyMessage.trim() && !replyFile) || !selectedTicket) return;

    try {
      let fileUrl = null;
      let fileName = null;
      let fileType = null;
      let fileSize = null;

      if (replyFile) {
        const filePath = `${user?.id}/${Date.now()}-${replyFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("support-attachments")
          .upload(filePath, replyFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("support-attachments")
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = replyFile.name;
        fileType = replyFile.type;
        fileSize = replyFile.size;
      }

      const { error } = await supabase
        .from("support_replies")
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user?.id,
          message: replyMessage || "File attachment",
          is_admin_reply: false,
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType,
          file_size: fileSize,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reply sent successfully",
      });

      setReplyMessage("");
      setReplyFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchReplies(selectedTicket.id);
    } catch (error) {
      console.error("Error sending reply:", error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: "closed" })
        .eq("id", ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket closed successfully",
      });

      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: "closed" });
      }
    } catch (error) {
      console.error("Error closing ticket:", error);
      toast({
        title: "Error",
        description: "Failed to close ticket",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      const { error: repliesError } = await supabase
        .from("support_replies")
        .delete()
        .eq("ticket_id", ticketId);

      if (repliesError) throw repliesError;

      const { error: ticketError } = await supabase
        .from("support_tickets")
        .delete()
        .eq("id", ticketId);

      if (ticketError) throw ticketError;

      toast({
        title: "Success",
        description: "Ticket deleted successfully",
      });

      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setIsDetailDialogOpen(false);
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast({
        title: "Error",
        description: "Failed to delete ticket",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      setReplyFile(file);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="h-4 w-4" />;
      case "in_progress":
        return <MessageCircle className="h-4 w-4" />;
      case "closed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "border-primary/50 bg-primary/5 text-primary";
      case "in_progress":
        return "border-yellow-500/50 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400";
      case "closed":
        return "border-green-500/50 bg-green-500/5 text-green-600 dark:text-green-400";
      default:
        return "border-muted-foreground/50 bg-muted/5 text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "border-muted-foreground/50 bg-muted/5 text-muted-foreground";
      case "normal":
        return "border-primary/50 bg-primary/5 text-primary";
      case "high":
        return "border-orange-500/50 bg-orange-500/5 text-orange-600 dark:text-orange-400";
      case "urgent":
        return "border-destructive/50 bg-destructive/5 text-destructive";
      default:
        return "border-muted-foreground/50 bg-muted/5 text-muted-foreground";
    }
  };

  const renderFileAttachment = (reply: TicketReply) => {
    if (!reply.file_url) return null;

    const isImage = reply.file_type?.startsWith("image/");
    const isVideo = reply.file_type?.startsWith("video/");

    return (
      <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border">
        {isImage && (
          <img 
            src={reply.file_url} 
            alt={reply.file_name} 
            className="max-w-full h-auto rounded-md max-h-64 object-contain"
          />
        )}
        {isVideo && (
          <video 
            src={reply.file_url} 
            controls 
            className="max-w-full h-auto rounded-md max-h-64"
          />
        )}
        <div className="flex items-center gap-2 mt-2">
          <FileText className="h-4 w-4" />
          <span className="text-sm">{reply.file_name}</span>
          <span className="text-xs text-muted-foreground">({formatFileSize(reply.file_size)})</span>
          <a href={reply.file_url} download className="ml-auto">
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    );
  };

  const topicsByCategory = topics.reduce((acc, topic) => {
    const category = topic.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(topic);
    return acc;
  }, {} as Record<string, SupportTopic[]>);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto py-16 px-4">
          <Card className="max-w-2xl mx-auto border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <LifeBuoy className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground mb-6">Please log in to access the support center and manage your tickets</p>
              <Button size="lg" asChild>
                <a href="/auth">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const openTickets = tickets.filter(t => t.status !== 'closed');
  const closedTickets = tickets.filter(t => t.status === 'closed');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-12 px-4 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <LifeBuoy className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Support Center
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get help quickly with our knowledge base or create a support ticket for personalized assistance
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{openTickets.length}</p>
                  <p className="text-sm text-muted-foreground">Open Tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{closedTickets.length}</p>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{topics.length}</p>
                  <p className="text-sm text-muted-foreground">FAQ Articles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <CardTitle>Frequently Asked Questions</CardTitle>
            </div>
            <CardDescription>
              Find answers to common questions before creating a support ticket
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No FAQ articles available yet</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(topicsByCategory).map(([category, categoryTopics]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <h3 className="text-sm font-semibold text-primary mb-2 px-4">
                      {category}
                    </h3>
                    {categoryTopics.map((topic) => (
                      <AccordionItem key={topic.id} value={topic.id} className="border-border/50">
                        <AccordionTrigger className="text-left hover:text-primary transition-colors">
                          {topic.title}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground leading-relaxed">{topic.content}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </div>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Tickets Section */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle>My Support Tickets</CardTitle>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Create Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Support Ticket</DialogTitle>
                    <DialogDescription>
                      Describe your issue and we'll get back to you as soon as possible
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateTicket} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Brief description of your issue"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value) => setFormData({ ...formData, priority: value })}
                        >
                          <SelectTrigger id="priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger id="category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="billing">Billing</SelectItem>
                            <SelectItem value="course">Course</SelectItem>
                            <SelectItem value="account">Account</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {isInstructor && potentialRecipients.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="recipient">Send To (Optional)</Label>
                        <Select
                          value={formData.recipientId}
                          onValueChange={(value) => setFormData({ ...formData, recipientId: value })}
                        >
                          <SelectTrigger id="recipient">
                            <SelectValue placeholder="Admin (default)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Admin (default)</SelectItem>
                            {potentialRecipients.map((recipient) => (
                              <SelectItem key={recipient.id} value={recipient.id}>
                                {recipient.full_name} ({recipient.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Provide detailed information about your issue"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={6}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="file">Attachment (Optional)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="file"
                          type="file"
                          ref={createFileInputRef}
                          onChange={handleCreateFileChange}
                          className="cursor-pointer"
                        />
                        {formData.file && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFormData({ ...formData, file: null });
                              if (createFileInputRef.current) createFileInputRef.current.value = "";
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {formData.file && (
                        <p className="text-sm text-muted-foreground">
                          {formData.file.name} ({formatFileSize(formData.file.size)})
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">Max file size: 10MB</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create Ticket</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>
              Track and manage all your support requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tickets yet</h3>
                <p className="text-muted-foreground mb-6">Create your first support ticket to get help</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Create First Ticket
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="open" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                  <TabsTrigger value="open" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Open ({openTickets.length})
                  </TabsTrigger>
                  <TabsTrigger value="closed" className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Closed ({closedTickets.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="open" className="space-y-3">
                  {openTickets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>All caught up! No open tickets.</p>
                    </div>
                  ) : (
                    openTickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        className="cursor-pointer hover:shadow-md transition-all duration-200 border-border/50 hover:border-primary/50"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold mb-2 truncate">{ticket.subject}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {ticket.message}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className={getStatusColor(ticket.status)}>
                                  {getStatusIcon(ticket.status)}
                                  <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                                </Badge>
                                <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                                  <span className="capitalize">{ticket.priority}</span>
                                </Badge>
                                {ticket.category && (
                                  <Badge variant="outline" className="border-muted-foreground/50 bg-muted/5">
                                    {ticket.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground text-right shrink-0">
                              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
                
                <TabsContent value="closed" className="space-y-3">
                  {closedTickets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No closed tickets yet</p>
                    </div>
                  ) : (
                    closedTickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        className="cursor-pointer hover:shadow-md transition-all duration-200 border-border/50 hover:border-primary/50 opacity-75"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold mb-2 truncate">{ticket.subject}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {ticket.message}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className={getStatusColor(ticket.status)}>
                                  {getStatusIcon(ticket.status)}
                                  <span className="ml-1">Closed</span>
                                </Badge>
                                <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                                  <span className="capitalize">{ticket.priority}</span>
                                </Badge>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground text-right shrink-0">
                              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Ticket Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle className="text-xl mb-2">{selectedTicket?.subject}</DialogTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={getStatusColor(selectedTicket?.status || '')}>
                      {getStatusIcon(selectedTicket?.status || '')}
                      <span className="ml-1 capitalize">{selectedTicket?.status.replace('_', ' ')}</span>
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(selectedTicket?.priority || '')}>
                      <span className="capitalize">{selectedTicket?.priority}</span>
                    </Badge>
                    {selectedTicket?.category && (
                      <Badge variant="outline">{selectedTicket.category}</Badge>
                    )}
                  </div>
                </div>
                {selectedTicket?.status !== 'closed' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectedTicket && handleCloseTicket(selectedTicket.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Close
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Ticket?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your ticket and all replies.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => selectedTicket && handleDeleteTicket(selectedTicket.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {/* Original Message */}
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">You</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedTicket?.message}</p>
                      {selectedTicket?.file_url && (
                        <div className="mt-3">
                          {renderFileAttachment({
                            id: 'ticket-file',
                            ticket_id: selectedTicket.id,
                            user_id: user?.id || '',
                            message: '',
                            is_admin_reply: false,
                            created_at: selectedTicket.created_at,
                            file_url: selectedTicket.file_url,
                            file_name: selectedTicket.file_name,
                            file_type: selectedTicket.file_type,
                            file_size: selectedTicket.file_size
                          })}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {selectedTicket && formatDistanceToNow(new Date(selectedTicket.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`p-4 rounded-lg border ${
                      reply.is_admin_reply
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-muted/50 border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        reply.is_admin_reply ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        {reply.is_admin_reply ? (
                          <LifeBuoy className="h-4 w-4 text-primary" />
                        ) : (
                          <MessageCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">
                            {reply.is_admin_reply ? 'Support Team' : 'You'}
                          </p>
                          {reply.is_admin_reply && (
                            <Badge variant="secondary" className="text-xs">Admin</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reply.message}</p>
                        {renderFileAttachment(reply)}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Reply Input */}
            {selectedTicket?.status !== 'closed' && (
              <div className="border-t pt-4 space-y-3">
                <Textarea
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,video/*,.pdf,.doc,.docx"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach
                    </Button>
                    {replyFile && (
                      <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1 rounded-md">
                        <FileText className="h-4 w-4" />
                        <span className="truncate max-w-[200px]">{replyFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => {
                            setReplyFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleReply}
                    disabled={!replyMessage.trim() && !replyFile}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Support;