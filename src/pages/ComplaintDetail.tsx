import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, FileText, Image as ImageIcon, Paperclip, Send, User } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import AssignStaffDialog from "@/components/admin/AssignStaffDialog";

interface Complaint {
  id: string;
  complaint_number: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  assigned_to?: string;
}

interface Message {
  id: string;
  message: string;
  is_staff_response: boolean;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
}

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [assignedStaffName, setAssignedStaffName] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);


  useEffect(() => {
    const checkStaffStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        
        setIsStaff(roleData?.role === "staff" || roleData?.role === "admin");
      }
    };

    const fetchComplaintDetails = async () => {
      const { data: complaintData } = await supabase
        .from("complaints")
        .select("*")
        .eq("id", id)
        .single();

      if (complaintData) {
        setComplaint(complaintData);
        
        // Fetch assigned staff name
        if (complaintData.assigned_to) {
          const { data: staffProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", complaintData.assigned_to)
            .single();
          setAssignedStaffName(staffProfile?.full_name || null);
        }
      }

      const { data: messagesData } = await supabase
        .from("complaint_messages")
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .eq("complaint_id", id)
        .order("created_at", { ascending: true });

      if (messagesData) {
        setMessages(messagesData as any);
      }

      const { data: attachmentsData } = await supabase
        .from("complaint_attachments")
        .select("*")
        .eq("complaint_id", id);

      if (attachmentsData) {
        setAttachments(attachmentsData);
      }
    };

    checkStaffStatus();
    fetchComplaintDetails();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`complaint-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'complaint_messages',
          filter: `complaint_id=eq.${id}`
        },
        async (payload) => {
          // Fetch the profile for the new message
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", payload.new.user_id)
            .single();

          const newMessage = {
            ...payload.new,
            profiles: { full_name: profile?.full_name || "Unknown" }
          };

          setMessages((prev) => [...prev, newMessage as any]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("complaint_messages").insert({
      complaint_id: id,
      user_id: session.user.id,
      message: newMessage,
      is_staff_response: false,
    });

    if (error) {
      toast.error("Failed to send message");
      return;
    }

    setNewMessage("");
    toast.success("Message sent");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "destructive";
      case "In Progress":
        return "warning";
      case "Resolved":
        return "success";
      default:
        return "secondary";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "destructive";
      case "Medium":
        return "warning";
      default:
        return "secondary";
    }
  };

  if (!complaint) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-4xl mx-auto">
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Complaint Details</h1>
          </div>

          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">ID: #{complaint.complaint_number}</h2>
              <Badge variant={getStatusColor(complaint.status) as any}>{complaint.status}</Badge>
            </div>
            {isStaff && complaint && (
              <AssignStaffDialog
                complaintId={complaint.id}
                complaintNumber={complaint.complaint_number}
                complaintTitle={complaint.title}
                currentAssignedId={complaint.assigned_to}
                onAssigned={async () => {
                  const { data } = await supabase
                    .from("complaints")
                    .select("assigned_to")
                    .eq("id", id)
                    .single();
                  
                  if (data?.assigned_to) {
                    const { data: staffProfile } = await supabase
                      .from("profiles")
                      .select("full_name")
                      .eq("id", data.assigned_to)
                      .single();
                    setAssignedStaffName(staffProfile?.full_name || null);
                    setComplaint({ ...complaint, assigned_to: data.assigned_to });
                  }
                }}
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Category</p>
              <p className="font-medium">{complaint.category}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Priority</p>
              <Badge variant={getPriorityColor(complaint.priority) as any}>{complaint.priority}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Assigned To</p>
              <p className="font-medium flex items-center gap-1">
                {assignedStaffName ? (
                  <>
                    <User className="h-3 w-3" />
                    {assignedStaffName}
                  </>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-border">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-sm text-foreground">{complaint.description}</p>
        </div>

        {attachments.length > 0 && (
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold mb-3">Attachments</h3>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {attachment.file_name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <ImageIcon className="h-5 w-5 text-primary" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{attachment.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(attachment.file_size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4">
          <h3 className="font-semibold mb-4">Chat Thread</h3>
          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.is_staff_response ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.is_staff_response
                      ? "bg-muted"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {format(new Date(message.created_at), "h:mm a")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Paperclip className="h-10 w-10 p-2 text-muted-foreground cursor-pointer hover:text-foreground" />
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button size="icon" onClick={handleSendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ComplaintDetail;