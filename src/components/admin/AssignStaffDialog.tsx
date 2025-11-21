import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";

interface Staff {
  id: string;
  full_name: string;
  email?: string;
}

interface AssignStaffDialogProps {
  complaintId: string;
  complaintNumber: string;
  complaintTitle: string;
  currentAssignedId?: string;
  onAssigned: () => void;
}

const AssignStaffDialog = ({
  complaintId,
  complaintNumber,
  complaintTitle,
  currentAssignedId,
  onAssigned,
}: AssignStaffDialogProps) => {
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(currentAssignedId || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchStaff();
    }
  }, [open]);

  const fetchStaff = async () => {
    try {
      // Get all staff and admin users
      const { data: staffRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["staff", "admin"]);

      if (!staffRoles) return;

      const staffIds = staffRoles.map((r) => r.user_id);

      // Get profiles and auth emails for staff
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", staffIds);

      if (profiles) {
        // Get emails from auth.users
        const profilesWithEmails = await Promise.all(
          profiles.map(async (profile) => {
            const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
            return {
              ...profile,
              email: user?.email,
            };
          })
        );
        setStaff(profilesWithEmails);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const handleAssign = async () => {
    if (!selectedStaffId) {
      toast.error("Please select a staff member");
      return;
    }

    setLoading(true);
    try {
      // Update complaint with assigned staff
      const { error: updateError } = await supabase
        .from("complaints")
        .update({ assigned_to: selectedStaffId })
        .eq("id", complaintId);

      if (updateError) throw updateError;

      // Get staff details for email
      const selectedStaff = staff.find((s) => s.id === selectedStaffId);
      
      if (selectedStaff?.email) {
        // Send notification email
        const { error: emailError } = await supabase.functions.invoke("send-assignment-email", {
          body: {
            staffEmail: selectedStaff.email,
            staffName: selectedStaff.full_name,
            complaintNumber,
            complaintTitle,
            complaintId,
          },
        });

        if (emailError) {
          console.error("Email error:", emailError);
          toast.warning("Assigned successfully, but failed to send email notification");
        } else {
          toast.success("Staff assigned and notified successfully!");
        }
      } else {
        toast.success("Staff assigned successfully!");
      }

      setOpen(false);
      onAssigned();
    } catch (error: any) {
      toast.error("Failed to assign staff");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          {currentAssignedId ? "Reassign" : "Assign"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Staff Member</DialogTitle>
          <DialogDescription>
            Select a staff member to assign to complaint {complaintNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Staff Member</label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name} {member.email && `(${member.email})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAssign} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign & Notify
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignStaffDialog;
