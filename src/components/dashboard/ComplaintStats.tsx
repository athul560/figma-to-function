import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

const ComplaintStats = () => {
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: complaints } = await supabase
        .from("complaints")
        .select("status")
        .eq("user_id", session.user.id);

      if (complaints) {
        setStats({
          open: complaints.filter((c) => c.status === "Open").length,
          inProgress: complaints.filter((c) => c.status === "In Progress").length,
          resolved: complaints.filter((c) => c.status === "Resolved").length,
        });
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6">
        <p className="text-sm text-destructive font-medium mb-2">Open Complaints</p>
        <p className="text-4xl font-bold text-destructive">{stats.open}</p>
      </Card>
      <Card className="p-6">
        <p className="text-sm text-warning font-medium mb-2">In Progress</p>
        <p className="text-4xl font-bold text-warning">{stats.inProgress}</p>
      </Card>
      <Card className="p-6">
        <p className="text-sm text-success font-medium mb-2">Resolved</p>
        <p className="text-4xl font-bold text-success">{stats.resolved}</p>
      </Card>
    </div>
  );
};

export default ComplaintStats;