import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, FileText, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminComplaints from "@/components/admin/AdminComplaints";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        toast.error("Authentication error. Please login again.");
        navigate("/admin/login");
        return;
      }

      if (!session) {
        navigate("/admin/login");
        return;
      }

      const { data: roles, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (roleError) {
        console.error("Role fetch error:", roleError);
        toast.error("Unable to verify admin access.");
        navigate("/admin/login");
        return;
      }

      if (roles?.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        navigate("/admin/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        // Continue anyway, just use email as fallback
        setAdminName(session.user.email || "Admin");
      } else if (profile) {
        setAdminName(profile.full_name);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Unexpected error in checkAdminAuth:", err);
      toast.error("An error occurred. Please try again.");
      navigate("/admin/login");
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        toast.error("Error logging out. Please try again.");
        return;
      }
      toast.success("Logged out successfully");
      navigate("/admin/login");
    } catch (err) {
      console.error("Unexpected logout error:", err);
      toast.error("An error occurred while logging out.");
    }
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome, {adminName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="complaints">
              <FileText className="h-4 w-4 mr-2" />
              Complaints
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="complaints">
            <AdminComplaints />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
