/**
 * NexusOps - AuditPage (Execution Logs)
 * Route: /audit and /logs (protected)
 */
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { useExecutionLogs } from "@/hooks/use-execution-logs";
import { useT } from "@/contexts/LocaleContext";

const STATUS_COLOR: Record<string, string> = {
  success: "var(--color-status-completed)",
  failed: "var(--color-status-failed)",
  skipped: "var(--color-status-pending)",
};

export default function AuditPage(): JSX.Element {
  const { data, loading } = useExecutionLogs();
  const T = useT();

  const HEADERS = [
    T("tbl.time"), T("tbl.logId"), T("tbl.event"), T("tbl.step"),
    T("tbl.runtime"), T("tbl.status"), T("tbl.message"),
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title={T("page.executionLogs")} />
        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 48, borderRadius: "var(--radius-md)" }} />)}
              </div>
            ) : data.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-16)", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)" }}>
                {T("page.noExecLogs")}
              </div>
            ) : (
              <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                        {HEADERS.map((h) => (
                          <th key={h} style={{ padding: "0.65rem var(--space-4)", textAlign: "left", fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-display)", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((log) => (
                        <tr key={log.id}
                          style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                          <td style={{ padding: "0.65rem var(--space-4)", fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "n/a"}</td>
                          <td style={{ padding: "0.65rem var(--space-4)", fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>{log.log_id ?? "n/a"}</td>
                          <td style={{ padding: "0.65rem var(--space-4)", fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-brand)" }}>{log.event_type ?? "n/a"}</td>
                          <td style={{ padding: "0.65rem var(--space-4)", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{log.step_name ?? "n/a"}</td>
                          <td style={{ padding: "0.65rem var(--space-4)", fontSize: "0.75rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>{log.runtime ?? "n/a"}</td>
                          <td style={{ padding: "0.65rem var(--space-4)" }}>
                            <span style={{ fontSize: "0.6875rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)", color: STATUS_COLOR[log.status ?? ""] ?? "var(--color-text-secondary)", background: "var(--color-bg-elevated)", fontFamily: "var(--font-body)" }}>{log.status ?? "n/a"}</span>
                          </td>
                          <td style={{ padding: "0.65rem var(--space-4)", fontSize: "0.8125rem", color: "var(--color-text-secondary)", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.message ?? "n/a"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
