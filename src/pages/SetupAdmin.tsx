import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { toast } from "sonner";

const SetupAdmin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@brototype.com");
  const [password, setPassword] = useState("Admin@123");
  const [fullName, setFullName] = useState("Admin User");
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('setup-admin', {
        body: {
          email,
          password,
          fullName,
        },
      });

      if (error) {
        console.error("Setup error:", error);
        
        // Check if user already exists
        if (error.message?.includes("already been registered") || 
            error.message?.includes("email_exists")) {
          toast.error("This email is already registered. Redirecting to login...", {
            duration: 4000,
          });
          setTimeout(() => {
            navigate("/admin/login");
          }, 2000);
          setLoading(false);
          return;
        }
        
        toast.error(error.message || "Failed to create admin user");
        setLoading(false);
        return;
      }

      // Check for error in response data
      if (data?.error) {
        console.error("Setup data error:", data.error);
        
        if (data.error.includes("already been registered") || 
            data.error.includes("email_exists")) {
          toast.error("This email is already registered. Redirecting to login...", {
            duration: 4000,
          });
          setTimeout(() => {
            navigate("/admin/login");
          }, 2000);
          setLoading(false);
          return;
        }
        
        toast.error(data.error);
        setLoading(false);
        return;
      }

      toast.success("Admin user created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/admin/login");
      }, 1500);
      setLoading(false);
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast.error(error.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Setup Admin User</CardTitle>
          <CardDescription>
            Create the first admin account for the system
            <br />
            <span className="text-xs mt-2 block">Already have an admin account? <button onClick={() => navigate("/admin/login")} className="text-primary underline">Login here</button></span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Admin User"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@brototype.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Admin..." : "Create Admin User"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupAdmin;