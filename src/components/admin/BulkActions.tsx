import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BulkActionsProps {
  selectedIds: string[];
  onComplete: () => void;
}

const BulkActions = ({ selectedIds, onComplete }: BulkActionsProps) => {
  const [action, setAction] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleBulkUpdate = async () => {
    if (!action || !value || selectedIds.length === 0) {
      toast.error("Please select action, value and complaints");
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {};
      if (action === "status") updateData.status = value;
      if (action === "priority") updateData.priority = value;

      const { error } = await supabase
        .from("complaints")
        .update(updateData)
        .in("id", selectedIds);

      if (error) throw error;

      toast.success(`Updated ${selectedIds.length} complaints`);
      setAction("");
      setValue("");
      onComplete();
    } catch (error: any) {
      toast.error("Failed to update complaints");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
      <span className="text-sm font-medium">
        {selectedIds.length} selected
      </span>
      
      <Select value={action} onValueChange={(val) => { setAction(val); setValue(""); }}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="status">Update Status</SelectItem>
          <SelectItem value="priority">Update Priority</SelectItem>
        </SelectContent>
      </Select>

      {action === "status" && (
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      )}

      {action === "priority" && (
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
      )}

      <Button onClick={handleBulkUpdate} disabled={loading || !action || !value}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Apply
      </Button>
    </div>
  );
};

export default BulkActions;
