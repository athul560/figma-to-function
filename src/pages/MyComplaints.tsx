import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Filter, MoreVertical, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Complaint {
  id: string;
  complaint_number: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
}

const MyComplaints = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    const fetchComplaints = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let query = supabase
        .from("complaints")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "All") {
        query = query.eq("status", statusFilter as "Open" | "In Progress" | "Resolved" | "Closed");
      }
      if (categoryFilter !== "All") {
        query = query.eq("category", categoryFilter as "Technical" | "Academics" | "Hostel" | "Canteen" | "Library" | "Admin" | "Other");
      }

      const { data } = await query;
      if (data) {
        setComplaints(data);
      }
    };

    fetchComplaints();
  }, [statusFilter, categoryFilter]);

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

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-4xl mx-auto">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">My Complaints</h1>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Status: All</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Category: All</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
                <SelectItem value="Academics">Academics</SelectItem>
                <SelectItem value="Hostel">Hostel</SelectItem>
                <SelectItem value="Canteen">Canteen</SelectItem>
                <SelectItem value="Library">Library</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {complaints.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Complaints Found</h3>
              <p className="text-muted-foreground text-sm">
                You haven't submitted any complaints yet, or none match your current filters.
              </p>
            </div>
          ) : (
            complaints.map((complaint) => (
              <Card
                key={complaint.id}
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/complaint/${complaint.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      #{complaint.complaint_number}
                    </p>
                    <h3 className="font-semibold">{complaint.title}</h3>
                  </div>
                  <Badge variant={getStatusColor(complaint.status) as any}>
                    {complaint.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Submitted: {format(new Date(complaint.created_at), "MMM dd, yyyy")}</span>
                  <Button size="sm">View Details →</Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default MyComplaints;