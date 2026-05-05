/**
 * NexusOps — AuditPage (Execution Logs)
 * Route: /audit and /logs (protected)
 *
 * Phase 10: Enhanced with search, status filter, CSV export, audit completeness score.
 * Two views: Table (default) and Swimlane timeline.
 * Swimlane groups logs by workflow_id and renders each step
 * as a colour-coded block proportional to its order in the trace.
 */
import { useState, useMemo } from "react";
import { LayoutList, GitBranch, Search, Download, CheckCircle2 } from "lucide-react";
import { MobileSidebar, Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { useExecutionLogs } from "@/hooks/use-execution-logs";
import { useT } from "@/contexts/LocaleContext";

const STATUS_COLOR: Record<string, string> = {
  success: "var(--color-status-completed)",
  failed: "var(--color-status-failed)",
  skipped: "var(--color-status-pending)",
};

const STATUS_BG: Record<string, string> = {
  success: "rgba(74,222,128,0.18)",
  failed: "rgba(248,113,113,0.18)",
  skipped: "rgba(250,204,21,0.18)",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type LogRow = {
  id: string;
  workflow_id?: string | null;
  timestamp?: string | null;
  step_name?: string | null;
  status?: string | null;
  event_type?: string | null;
  runtime?: string | null;
  message?: string | null;
  log_id?: string | null;
};

// ─── Audit Completeness Score ─────────────────────────────────────────────────

function AuditCompletenessCard({ logs }: { logs: LogRow[] }) {
  if (logs.length === 0) return null;

  const withStepName = logs.filter((l) => l.step_name).length;
  const withStatus = logs.filter((l) => l.status).length;
  const withTimestamp = logs.filter((l) => l.timestamp).length;
  const withWorkflow = logs.filter((l) => l.workflow_id).length;

  const completeness = Math.round(
    ((withStepName + withStatus + withTimestamp + withWorkflow) / (logs.length * 4)) * 100
  );

  const color = completeness >= 80 ? "#4ade80" : completeness >= 50 ? "#facc15" : "#f87171";

  return (
    <div style={{
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border-subtle)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-4) var(--space-5)",
      display: "flex",
      alignItems: "center",
      gap: "var(--space-4)",
      marginBottom: "var(--space-4)",
    }}>
      <CheckCircle2 size={20} style={{ color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
            Audit Completeness
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem", color }}>
            {completeness}%
          </span>
        </div>
        <div style={{ background: "var(--color-bg-elevated)", borderRadius: "var(--radius-full)", height: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${completeness}%`, background: color, borderRadius: "var(--radius-full)", transition: "width 0.5s ease" }} />
        </div>
        <p style={{ margin: "0.375rem 0 0", fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
          {withStepName}/{logs.length} named steps · {withWorkflow}/{logs.length} workflow-linked · {withTimestamp}/{logs.length} timestamped
        </p>
      </div>
    </div>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportCSV(logs: LogRow[]): void {
  const headers = ["id", "timestamp", "workflow_id", "event_type", "step_name", "runtime", "status", "message"];
  const rows = logs.map((l) => headers.map((h) => {
    const val = (l as Record<string, unknown>)[h];
    const s = val == null ? "" : String(val);
    return `"${s.replace(/"/g, '""')}"`;
  }).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nexusops-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Swimlane component ───────────────────────────────────────────────────────

function SwimlaneView({ rows }: { rows: LogRow[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; step: LogRow } | null>(null);

  const groups = new Map<string, LogRow[]>();
  for (const row of rows) {
    const key = row.workflow_id ?? "ungrouped";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const sortedGroups = [...groups.entries()].sort(([, a], [, b]) => {
    const ta = a[0]?.timestamp ? new Date(a[0].timestamp).getTime() : 0;
    const tb = b[0]?.timestamp ? new Date(b[0].timestamp).getTime() : 0;
    return ta - tb;
  });

  const visibleGroups = sortedGroups.slice(0, 20);

  return (
    <div
      style={{ position: "relative" }}
      onMouseMove={(e) => {
        if (tooltip) setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null);
      }}
    >
      {visibleGroups.map(([wfId, steps]) => {
        const label = wfId === "ungrouped" ? "No workflow" : wfId.slice(0, 8) + "…";
        const total = steps.length;

        return (
          <div key={wfId} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.625rem" }}>
            <div style={{ width: 96, flexShrink: 0, textAlign: "right" }}>
              <span title={wfId} style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "monospace", cursor: "default" }}>
                {label}
              </span>
            </div>
            <div style={{ flex: 1, display: "flex", height: 28, gap: 2, background: "var(--color-bg-base)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
              {steps.map((step, i) => {
                const status = step.status ?? "unknown";
                const bg = STATUS_BG[status] ?? "rgba(255,255,255,0.06)";
                const border = STATUS_COLOR[status] ?? "var(--color-border-subtle)";
                return (
                  <div
                    key={step.id}
                    title={`${step.step_name ?? step.event_type ?? "step"} — ${status}`}
                    style={{ flex: 1, background: bg, borderTop: `2px solid ${border}`, cursor: "pointer", minWidth: 6, maxWidth: total < 8 ? 80 : undefined, transition: "opacity 0.15s", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; setTooltip({ x: e.clientX, y: e.clientY, step }); }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; setTooltip(null); }}
                  >
                    {total <= 12 && (
                      <span style={{ fontSize: "0.5625rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 2px" }}>
                        {i + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", flexShrink: 0, width: 28, textAlign: "left" }}>{total}</span>
          </div>
        );
      })}

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border-subtle)" }}>
        {Object.entries(STATUS_COLOR).map(([s, c]) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: STATUS_BG[s], border: `2px solid ${c}` }} />
            <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", textTransform: "capitalize" }}>{s}</span>
          </div>
        ))}
      </div>

      {tooltip && (
        <div style={{ position: "fixed", left: tooltip.x + 12, top: tooltip.y - 8, zIndex: 300, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.75rem", pointerEvents: "none", maxWidth: 260, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
          <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.8125rem", color: "var(--color-text-primary)" }}>{tooltip.step.step_name ?? tooltip.step.event_type ?? "Step"}</p>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: STATUS_COLOR[tooltip.step.status ?? ""] ?? "var(--color-text-secondary)" }}>{tooltip.step.status ?? "unknown"}</p>
          {tooltip.step.runtime && <p style={{ margin: "0.1rem 0 0", fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>{tooltip.step.runtime}</p>}
          {tooltip.step.message && <p style={{ margin: "0.25rem 0 0", fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tooltip.step.message.slice(0, 120)}</p>}
          {tooltip.step.timestamp && <p style={{ margin: "0.2rem 0 0", fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>{new Date(tooltip.step.timestamp).toLocaleTimeString()}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["all", "success", "failed", "skipped"] as const;
type StatusFilter = typeof STATUS_OPTIONS[number];

export default function AuditPage(): JSX.Element {
  const { data, loading } = useExecutionLogs();
  const T = useT();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [view, setView] = useState<"table" | "swimlane">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((log) => {
      const matchesSearch =
        !q ||
        (log.step_name ?? "").toLowerCase().includes(q) ||
        (log.event_type ?? "").toLowerCase().includes(q) ||
        (log.message ?? "").toLowerCase().includes(q) ||
        (log.workflow_id ?? "").toLowerCase().includes(q) ||
        (log.log_id ?? "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  const HEADERS = [
    T("tbl.time"), T("tbl.logId"), T("tbl.event"), T("tbl.step"),
    T("tbl.runtime"), T("tbl.status"), T("tbl.message"),
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <MobileSidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title={T("page.executionLogs")} onMobileMenuOpen={() => setMobileNavOpen(true)} />
        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>

            {/* Audit completeness */}
            {!loading && data.length > 0 && <AuditCompletenessCard logs={data} />}

            {/* Toolbar */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "var(--space-4)", flexWrap: "wrap", alignItems: "center" }}>
              {/* Search */}
              <div style={{ position: "relative", flex: "1 1 220px", minWidth: 0 }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)", pointerEvents: "none" }} />
                <input
                  type="search"
                  placeholder="Search step, event, message…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "100%", padding: "0.4rem 0.75rem 0.4rem 2rem", background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-md)", color: "var(--color-text-primary)", fontFamily: "var(--font-body)", fontSize: "0.8125rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Status filter */}
              <div style={{ display: "flex", gap: "0.375rem" }}>
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    style={{
                      padding: "0.375rem 0.625rem",
                      borderRadius: "var(--radius-sm)",
                      border: `1px solid ${statusFilter === s ? (s === "all" ? "var(--color-brand)" : (STATUS_COLOR[s] ?? "var(--color-brand)")) : "var(--color-border-subtle)"}`,
                      background: statusFilter === s ? (s === "all" ? "rgba(61,255,160,0.08)" : (STATUS_BG[s] ?? "rgba(61,255,160,0.08)")) : "transparent",
                      color: statusFilter === s ? (s === "all" ? "var(--color-brand)" : (STATUS_COLOR[s] ?? "var(--color-brand)")) : "var(--color-text-tertiary)",
                      fontFamily: "var(--font-display)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* View toggle */}
              <div style={{ display: "flex", gap: "0.375rem", marginLeft: "auto" }}>
                {(["table", "swimlane"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.75rem", borderRadius: "var(--radius-sm)", border: `1px solid ${view === v ? "var(--color-brand)" : "var(--color-border-subtle)"}`, background: view === v ? "rgba(61,255,160,0.08)" : "transparent", color: view === v ? "var(--color-brand)" : "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer", transition: "all 0.15s" }}
                  >
                    {v === "table" ? <LayoutList size={14} /> : <GitBranch size={14} />}
                    {v === "table" ? "Table" : "Swimlane"}
                  </button>
                ))}
              </div>

              {/* CSV export */}
              {!loading && filtered.length > 0 && (
                <button
                  onClick={() => exportCSV(filtered)}
                  style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-subtle)", background: "transparent", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}
                >
                  <Download size={14} />
                  Export CSV
                </button>
              )}
            </div>

            {/* Result count */}
            {!loading && (
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", marginBottom: "var(--space-3)" }}>
                {filtered.length} of {data.length} log entries
              </p>
            )}

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 48, borderRadius: "var(--radius-md)" }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-16)", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)" }}>
                {data.length === 0 ? T("page.noExecLogs") : "No logs match the current filter."}
              </div>
            ) : view === "swimlane" ? (
              <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: "var(--space-5)" }}>
                <p style={{ margin: "0 0 var(--space-4)", fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)" }}>
                  Each row = one workflow. Each block = one execution step. Hover for details. Showing up to 20 workflows.
                </p>
                <SwimlaneView rows={filtered} />
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
                      {filtered.map((log) => (
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
                            <span style={{ fontSize: "0.6875rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)", color: STATUS_COLOR[log.status ?? ""] ?? "var(--color-text-secondary)", background: STATUS_BG[log.status ?? ""] ?? "var(--color-bg-elevated)", fontFamily: "var(--font-body)" }}>{log.status ?? "n/a"}</span>
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
