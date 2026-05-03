/**
 * NexusOps — useNotifications
 *
 * Lightweight one-shot fetch of failed workflows for the TopBar bell.
 * Intentionally avoids realtime to prevent Supabase channel conflicts
 * when useWorkflows is already subscribed on the same page.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface NotificationWorkflow {
  id: string;
  workflow_id: string | null;
  workflow_name: string | null;
  status: string | null;
  date_requested: string | null;
}

export function useNotifications() {
  const [failedWorkflows, setFailedWorkflows] = useState<NotificationWorkflow[]>([]);

  useEffect(() => {
    supabase
      .from("workflows")
      .select("id, workflow_id, workflow_name, status, date_requested")
      .eq("status", "Failed")
      .order("date_requested", { ascending: false })
      .limit(8)
      .then(({ data }) => setFailedWorkflows(data ?? []));
  }, []);

  return { failedWorkflows };
}
