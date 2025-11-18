import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Complaint {
  id: string;
  complaint_number: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  user_id: string;
  studentName?: string;
}

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    const { data } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      const complaintsWithNames = await Promise.all(
        data.map(async (complaint) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", complaint.user_id)
            .single();
          
          return {
            ...complaint,
            studentName: profile?.full_name || "Unknown",
          };
        })
      );
      setComplaints(complaintsWithNames);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "default";
      case "In Progress": return "secondary";
      case "Resolved": return "outline";
      default: return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "destructive";
      case "Medium": return "default";
      case "Low": return "secondary";
      default: return "outline";
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints.map((complaint) => (
              <TableRow key={complaint.id}>
                <TableCell className="font-mono text-xs">{complaint.complaint_number}</TableCell>
                <TableCell>{complaint.studentName}</TableCell>
                <TableCell className="max-w-xs truncate">{complaint.title}</TableCell>
                <TableCell>{complaint.category}</TableCell>
                <TableCell>
                  <Badge variant={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(complaint.status)}>{complaint.status}</Badge>
                </TableCell>
                <TableCell>{format(new Date(complaint.created_at), "MMM dd, yyyy")}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/complaint/${complaint.id}`)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminComplaints;
