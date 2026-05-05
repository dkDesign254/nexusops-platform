/**
 * NexusOps — usePushNotifications
 *
 * Subscribes to Supabase Realtime for workflow status changes.
 * When a workflow transitions to "Failed", fires a native browser
 * Notification if the user has granted permission.
 *
 * No VAPID / service-worker push server needed — the app tab must be
 * open for realtime to fire, which is when the Notification API works
 * reliably anyway.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type NotifPermission = "default" | "granted" | "denied" | "unsupported";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotifPermission>(() => {
    if (typeof Notification === "undefined") return "unsupported";
    return Notification.permission as NotifPermission;
  });

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result as NotifPermission);
  }, []);

  useEffect(() => {
    if (permission !== "granted") return;

    const channel = supabase
      .channel("nexusops-push-notif")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "workflows" },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const status = typeof row.status === "string" ? row.status.toLowerCase() : "";
          if (status !== "failed") return;

          const name = (row.workflow_name as string | null) ?? (row.workflow_id as string | null) ?? "Unknown workflow";
          try {
            const n = new Notification("NexusOps — Workflow Failed", {
              body: `"${name}" has failed. Open the dashboard to review.`,
              icon: "/favicon.svg",
              tag: `wf-fail-${row.id as string}`,
              requireInteraction: false,
            });
            n.onclick = () => {
              window.focus();
              n.close();
            };
          } catch {
            // Some browsers throw on Notification constructor even after grant
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [permission]);

  return { permission, requestPermission };
}
