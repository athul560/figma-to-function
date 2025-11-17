import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Complaint {
  id: string;
  complaint_number: string;
  title: string;
  status: string;
  created_at: string;
}

const RecentComplaints = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    const fetchComplaints = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("complaints")
        .select("id, complaint_number, title, status, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (data) {
        setComplaints(data);
      }
    };

    fetchComplaints();
  }, []);

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
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Recent Complaints</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                Complaint ID
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                Title
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                Date
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => (
              <tr
                key={complaint.id}
                className="border-b border-border cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/complaint/${complaint.id}`)}
              >
                <td className="py-3 px-2 text-sm text-primary font-medium">
                  #{complaint.complaint_number}
                </td>
                <td className="py-3 px-2 text-sm">{complaint.title}</td>
                <td className="py-3 px-2 text-sm text-muted-foreground">
                  {format(new Date(complaint.created_at), "MMM dd, yyyy")}
                </td>
                <td className="py-3 px-2">
                  <Badge variant={getStatusColor(complaint.status) as any}>
                    {complaint.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default RecentComplaints;