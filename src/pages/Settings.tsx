import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Email notification settings
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [notifyOnNew, setNotifyOnNew] = useState(true);
  const [notifyOnUpdate, setNotifyOnUpdate] = useState(true);
  
  // Auto-assignment settings
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(false);
  const [assignmentStrategy, setAssignmentStrategy] = useState("round_robin");
  
  // Default priority
  const [defaultPriority, setDefaultPriority] = useState("Medium");

  useEffect(() => {
    checkAdminAuth();
    loadSettings();
  }, []);

  const checkAdminAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (roleData?.role !== "admin") {
      navigate("/dashboard");
      toast.error("Access denied. Admin only.");
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*");

      if (error) throw error;

      data?.forEach((setting) => {
        if (setting.setting_key === "email_notifications") {
          const val = setting.setting_value as any;
          setEmailEnabled(val?.enabled ?? true);
          setNotifyOnNew(val?.notify_on_new ?? true);
          setNotifyOnUpdate(val?.notify_on_update ?? true);
        } else if (setting.setting_key === "auto_assignment") {
          const val = setting.setting_value as any;
          setAutoAssignEnabled(val?.enabled ?? false);
          setAssignmentStrategy(val?.strategy ?? "round_robin");
        } else if (setting.setting_key === "default_priority") {
          const val = setting.setting_value as any;
          setDefaultPriority(val?.value ?? "Medium");
        }
      });
    } catch (error: any) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const updates = [
        {
          setting_key: "email_notifications",
          setting_value: { enabled: emailEnabled, notify_on_new: notifyOnNew, notify_on_update: notifyOnUpdate },
          updated_by: session?.user.id
        },
        {
          setting_key: "auto_assignment",
          setting_value: { enabled: autoAssignEnabled, strategy: assignmentStrategy },
          updated_by: session?.user.id
        },
        {
          setting_key: "default_priority",
          setting_value: { value: defaultPriority },
          updated_by: session?.user.id
        }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("system_settings")
          .update(update)
          .eq("setting_key", update.setting_key);

        if (error) throw error;
      }

      toast.success("Settings saved successfully!");
    } catch (error: any) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure system-wide settings for the complaint management system
          </p>
        </div>

        <div className="space-y-6">
          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure email notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-enabled">Enable Email Notifications</Label>
                <Switch
                  id="email-enabled"
                  checked={emailEnabled}
                  onCheckedChange={setEmailEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-new">Notify on New Complaints</Label>
                <Switch
                  id="notify-new"
                  checked={notifyOnNew}
                  onCheckedChange={setNotifyOnNew}
                  disabled={!emailEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-update">Notify on Status Updates</Label>
                <Switch
                  id="notify-update"
                  checked={notifyOnUpdate}
                  onCheckedChange={setNotifyOnUpdate}
                  disabled={!emailEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Auto-Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Auto-Assignment Rules</CardTitle>
              <CardDescription>
                Automatically assign new complaints to staff members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-assign">Enable Auto-Assignment</Label>
                <Switch
                  id="auto-assign"
                  checked={autoAssignEnabled}
                  onCheckedChange={setAutoAssignEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="strategy">Assignment Strategy</Label>
                <Select
                  value={assignmentStrategy}
                  onValueChange={setAssignmentStrategy}
                  disabled={!autoAssignEnabled}
                >
                  <SelectTrigger id="strategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round_robin">Round Robin</SelectItem>
                    <SelectItem value="least_loaded">Least Loaded</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Default Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Default Priority</CardTitle>
              <CardDescription>
                Set the default priority for new complaints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="priority">Default Priority Level</Label>
                <Select value={defaultPriority} onValueChange={setDefaultPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button onClick={saveSettings} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
