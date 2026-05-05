/**
 * NexusOps — useFinalReports
 *
 * Fetches final report records and provides an approval mutation.
 * Reports are sorted by report_timestamp DESC.
 *
 * @returns {{ data, loading, error, refetch, approveReport }}
 *
 * @example
 * const { data: reports, approveReport } = useFinalReports();
 * await approveReport(reportId, userId);
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type ReportRow = Database["public"]["Tables"]["final_reports"]["Row"];

export interface UseFinalReportsReturn {
  data: ReportRow[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  approveReport: (reportId: string, approvedBy: string) => Promise<void>;
}

export function useFinalReports(): UseFinalReportsReturn {
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from("final_reports")
        .select("*")
        .order("report_timestamp", { ascending: false })
        .limit(100);
      if (err) throw err;
      setData(rows ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  const approveReport = useCallback(async (reportId: string, _approvedBy?: string): Promise<void> => {
    const { error: err } = await supabase
      .from("final_reports")
      .update({ approved: true })
      .eq("id", reportId);
    if (err) throw new Error(err.message);
    await fetch();
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch, approveReport };
}
