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
import { MessageCircle, Clock, CheckCircle, AlertCircle, Send, FileText, Paperclip, Download, Trash2, X, BookOpen } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    priority: "normal",
    category: "general"
  });

  useEffect(() => {
    fetchTopics();
    if (user) {
      fetchTickets();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTicket) {
      fetchReplies(selectedTicket.id);
    } else {
      setReplies([]);
      setReplyMessage("");
      setReplyFile(null);
    }
  }, [selectedTicket]);

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
      
      // Fetch user profiles separately
      const userIds = [...new Set(data?.map(r => r.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', userIds);
      
      // Combine data
      const enrichedReplies = data?.map(reply => ({
        ...reply,
        profiles: profilesData?.find(p => p.id === reply.user_id)
      })) || [];
      
      setReplies(enrichedReplies as TicketReply[]);
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          ...formData,
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
        category: "general"
      });
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

  const handleReply = async () => {
    if ((!replyMessage.trim() && !replyFile) || !selectedTicket) return;

    try {
      let fileUrl = null;
      let fileName = null;
      let fileType = null;
      let fileSize = null;

      // Upload file if attached
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
      // Delete all replies first
      const { error: repliesError } = await supabase
        .from("support_replies")
        .delete()
        .eq("ticket_id", ticketId);

      if (repliesError) throw repliesError;

      // Delete the ticket
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
      // Limit file size to 10MB
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
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "in_progress":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "closed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      case "normal":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "urgent":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const renderFileAttachment = (reply: TicketReply) => {
    if (!reply.file_url) return null;

    const isImage = reply.file_type?.startsWith("image/");
    const isVideo = reply.file_type?.startsWith("video/");

    return (
      <div className="mt-2 p-3 bg-muted rounded-lg">
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

  // Group topics by category
  const topicsByCategory = topics.reduce((acc, topic) => {
    const category = topic.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(topic);
    return acc;
  }, {} as Record<string, SupportTopic[]>);

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">Please log in to access the support center</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openTickets = tickets.filter(t => t.status !== 'closed');
  const closedTickets = tickets.filter(t => t.status === 'closed');

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Support Center</h1>
        <p className="text-muted-foreground">Get help and browse common questions</p>
      </div>

      {/* FAQ Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <CardTitle>Frequently Asked Questions</CardTitle>
          </div>
          <CardDescription>
            Browse common topics and questions before creating a ticket
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(topicsByCategory).map(([category, categoryTopics]) => (
              <div key={category} className="mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-4">
                  {category}
                </h3>
                {categoryTopics.map((topic) => (
                  <AccordionItem key={topic.id} value={topic.id}>
                    <AccordionTrigger className="text-left">
                      {topic.title}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">{topic.content}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </div>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Tickets Section */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">My Tickets</h2>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <MessageCircle className="h-4 w-4 mr-2" />
              Create New Ticket
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                    <SelectTrigger>
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
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="course">Course</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Provide detailed information about your issue..."
                  rows={6}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full">
                Create Ticket
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="open" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="open">
            Open ({openTickets.length})
          </TabsTrigger>
          <TabsTrigger value="closed">
            Closed ({closedTickets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {openTickets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No open tickets</p>
              </CardContent>
            </Card>
          ) : (
            openTickets.map((ticket) => (
              <Card key={ticket.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusColor(ticket.status)}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                        <span className="capitalize">{ticket.priority}</span>
                      </Badge>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this ticket? This action cannot be undone.
                            All replies and attachments will be permanently removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <CardTitle 
                    className="text-lg cursor-pointer hover:text-primary transition-colors"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setIsDetailDialogOpen(true);
                    }}
                  >
                    {ticket.subject}
                  </CardTitle>
                  <CardDescription>
                    Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          {closedTickets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No closed tickets</p>
              </CardContent>
            </Card>
          ) : (
            closedTickets.map((ticket) => (
              <Card key={ticket.id} className="cursor-pointer hover:bg-accent/50 transition-colors opacity-75">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusColor(ticket.status)}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1 capitalize">{ticket.status}</span>
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                        <span className="capitalize">{ticket.priority}</span>
                      </Badge>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this ticket? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <CardTitle 
                    className="text-lg cursor-pointer hover:text-primary transition-colors"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setIsDetailDialogOpen(true);
                    }}
                  >
                    {ticket.subject}
                  </CardTitle>
                  <CardDescription>
                    Closed {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => {
        setIsDetailDialogOpen(open);
        if (!open) setSelectedTicket(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{selectedTicket?.subject}</DialogTitle>
              <div className="flex gap-2">
                {selectedTicket?.status !== 'closed' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Close Ticket
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Close Ticket</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to close this ticket? Closed tickets are read-only.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleCloseTicket(selectedTicket!.id)}>
                          Close
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this ticket? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteTicket(selectedTicket!.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <DialogDescription>
              <div className="flex gap-2 mt-2">
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
                {selectedTicket?.status === 'closed' && (
                  <Badge variant="outline" className="bg-muted">
                    Read-only (Closed)
                  </Badge>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 p-4 max-h-[60vh]">
            <div className="space-y-4">
              <Card className={selectedTicket?.status === 'closed' ? 'opacity-75' : ''}>
                <CardHeader>
                  <CardTitle className="text-base">Original Message</CardTitle>
                  <CardDescription>
                    {new Date(selectedTicket?.created_at || '').toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{selectedTicket?.message}</p>
                </CardContent>
              </Card>

              {replies.map((reply) => (
                <Card key={reply.id} className={reply.is_admin_reply ? "border-primary/50" : ""}>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {reply.profiles?.full_name || "Unknown User"}
                      {reply.is_admin_reply && (
                        <Badge variant="outline" className="ml-2">Admin</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{reply.message}</p>
                    {renderFileAttachment(reply)}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {selectedTicket?.status !== 'closed' && (
            <div className="border-t p-4">
              <div className="space-y-3">
                {replyFile && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <Paperclip className="h-4 w-4" />
                    <span className="text-sm flex-1">{replyFile.name}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(replyFile.size)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1"
                    rows={3}
                  />
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleReply} size="icon" disabled={!replyMessage.trim() && !replyFile}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {selectedTicket?.status === 'closed' && (
            <div className="border-t p-4 bg-muted/50">
              <p className="text-sm text-center text-muted-foreground">
                This ticket is closed. No further replies can be added.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;