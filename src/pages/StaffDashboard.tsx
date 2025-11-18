import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, FileText, Clock, CheckCircle2 } from "lucide-react";
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

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [staffName, setStaffName] = useState("");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    checkStaffAuth();
  }, []);

  const checkStaffAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (roles?.role !== "staff" && roles?.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      setStaffName(profile.full_name);
    }

    fetchComplaints();
    setLoading(false);
  };

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredComplaints = complaints.filter(c => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === "Open").length,
    inProgress: complaints.filter(c => c.status === "In Progress").length,
    resolved: complaints.filter(c => c.status === "Resolved").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Staff Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome, {staffName}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.open}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Complaints</CardTitle>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => (
                <Card key={complaint.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/complaint/${complaint.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-xs text-muted-foreground">{complaint.complaint_number}</span>
                          <Badge variant="outline">{complaint.category}</Badge>
                          <Badge variant={complaint.priority === "High" ? "destructive" : "default"}>{complaint.priority}</Badge>
                        </div>
                        <h3 className="font-semibold mb-1">{complaint.title}</h3>
                        <p className="text-sm text-muted-foreground">Student: {complaint.studentName}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={complaint.status === "Open" ? "default" : complaint.status === "In Progress" ? "secondary" : "outline"}>
                          {complaint.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2">{format(new Date(complaint.created_at), "MMM dd, yyyy")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StaffDashboard;
