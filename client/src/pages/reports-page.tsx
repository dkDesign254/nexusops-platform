/**
 * NexusOps - ReportsPage
 * Route: /reports (protected)
 */
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { useFinalReports } from "@/hooks/use-final-reports";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/contexts/LocaleContext";
import { toast } from "sonner";

export default function ReportsPage(): JSX.Element {
  const { data, loading, approveReport } = useFinalReports();
  const { user } = useAuth();
  const T = useT();

  async function handleApprove(id: string): Promise<void> {
    try {
      await approveReport(id, user?.id ?? "");
      toast.success(T("tbl.approved"));
    } catch {
      toast.error("Failed to approve report");
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title={T("page.finalReports")} />
        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: "var(--radius-lg)" }} />)
              : data.length === 0
              ? <div style={{ textAlign: "center", padding: "var(--space-16)", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)" }}>{T("page.noReports")}</div>
              : data.map((report) => (
                <div key={report.id} style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: "var(--space-5)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginBottom: "0.25rem" }}>{report.report_display_id ?? "n/a"}</p>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--color-text-primary)" }}>{(report.executive_summary ?? "Report").slice(0, 80)}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      <span style={{ fontSize: "0.6875rem", padding: "0.2rem 0.6rem", borderRadius: "var(--radius-full)", background: report.approved ? "rgba(61,255,160,0.08)" : "rgba(255,179,71,0.08)", color: report.approved ? "var(--color-status-completed)" : "var(--color-status-running)", fontFamily: "var(--font-body)" }}>
                        {report.approved ? T("tbl.approved") : T("tbl.pendingApproval")}
                      </span>
                      {!report.approved && (
                        <button onClick={() => handleApprove(report.id)}
                          style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem", borderRadius: "var(--radius-sm)", background: "var(--color-brand)", border: "none", color: "var(--color-text-inverse)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 600 }}>
                          {T("tbl.approve")}
                        </button>
                      )}
                    </div>
                  </div>
                  {report.key_insights && (
                    <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{report.key_insights.slice(0, 200)}</p>
                  )}
                </div>
              ))
            }
          </div>
        </main>
      </div>
    </div>
  );
}
