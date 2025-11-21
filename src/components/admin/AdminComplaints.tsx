import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import BulkActions from "./BulkActions";
import AssignStaffDialog from "./AssignStaffDialog";

interface Complaint {
  id: string;
  complaint_number: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  user_id: string;
  assigned_to?: string;
  studentName?: string;
  assignedName?: string;
}

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
          
          let assignedName = undefined;
          if (complaint.assigned_to) {
            const { data: assignedProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", complaint.assigned_to)
              .single();
            assignedName = assignedProfile?.full_name;
          }
          
          return {
            ...complaint,
            studentName: profile?.full_name || "Unknown",
            assignedName,
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

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedIds(prev => 
      prev.length === complaints.length ? [] : complaints.map(c => c.id)
    );
  };

  const handleBulkComplete = () => {
    setSelectedIds([]);
    fetchComplaints();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complaints Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedIds.length > 0 && (
          <BulkActions selectedIds={selectedIds} onComplete={handleBulkComplete} />
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === complaints.length && complaints.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints.map((complaint) => (
              <TableRow key={complaint.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(complaint.id)}
                    onCheckedChange={() => toggleSelection(complaint.id)}
                  />
                </TableCell>
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
                <TableCell>
                  {complaint.assignedName ? (
                    <span className="text-sm">{complaint.assignedName}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>{format(new Date(complaint.created_at), "MMM dd, yyyy")}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <AssignStaffDialog
                      complaintId={complaint.id}
                      complaintNumber={complaint.complaint_number}
                      complaintTitle={complaint.title}
                      currentAssignedId={complaint.assigned_to}
                      onAssigned={fetchComplaints}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/complaint/${complaint.id}`)}
                    >
                      View
                    </Button>
                  </div>
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
