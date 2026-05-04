/**
 * NexusOps — AuditPage (Execution Logs)
 * Route: /audit and /logs (protected)
 *
 * Two views: Table (default) and Swimlane timeline.
 * Swimlane groups logs by workflow_id and renders each step
 * as a colour-coded block proportional to its order in the trace.
 */
import { useState } from "react";
import { LayoutList, GitBranch } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
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

// ─── Swimlane component ───────────────────────────────────────────────────────

type LogRow = {
  id: string;
  workflow_id?: string | null;
  timestamp?: string | null;
  step_name?: string | null;
  status?: string | null;
  event_type?: string | null;
  runtime?: string | null;
  message?: string | null;
};

function SwimlaneView({ rows }: { rows: LogRow[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; step: LogRow } | null>(null);

  // Group by workflow_id (fall back to "ungrouped")
  const groups = new Map<string, LogRow[]>();
  for (const row of rows) {
    const key = row.workflow_id ?? "ungrouped";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  // Sort groups by earliest timestamp
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
        // keep tooltip near cursor
        if (tooltip) setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null);
      }}
    >
      {visibleGroups.map(([wfId, steps]) => {
        const label = wfId === "ungrouped" ? "No workflow" : wfId.slice(0, 8) + "…";
        const total = steps.length;

        return (
          <div key={wfId} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.625rem" }}>
            {/* Row label */}
            <div style={{ width: 96, flexShrink: 0, textAlign: "right" }}>
              <span
                title={wfId}
                style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "monospace", cursor: "default" }}
              >
                {label}
              </span>
            </div>

            {/* Step blocks */}
            <div style={{ flex: 1, display: "flex", height: 28, gap: 2, background: "var(--color-bg-base)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
              {steps.map((step, i) => {
                const status = step.status ?? "unknown";
                const bg = STATUS_BG[status] ?? "rgba(255,255,255,0.06)";
                const border = STATUS_COLOR[status] ?? "var(--color-border-subtle)";

                return (
                  <div
                    key={step.id}
                    title={`${step.step_name ?? step.event_type ?? "step"} — ${status}`}
                    style={{
                      flex: 1,
                      background: bg,
                      borderTop: `2px solid ${border}`,
                      cursor: "pointer",
                      minWidth: 6,
                      maxWidth: total < 8 ? 80 : undefined,
                      transition: "opacity 0.15s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.7";
                      setTooltip({ x: e.clientX, y: e.clientY, step });
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                      setTooltip(null);
                    }}
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

            {/* Step count badge */}
            <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", flexShrink: 0, width: 28, textAlign: "left" }}>
              {total}
            </span>
          </div>
        );
      })}

      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border-subtle)" }}>
        {Object.entries(STATUS_COLOR).map(([s, c]) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: STATUS_BG[s], border: `2px solid ${c}` }} />
            <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", textTransform: "capitalize" }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 12,
            top: tooltip.y - 8,
            zIndex: 300,
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-md)",
            padding: "0.5rem 0.75rem",
            pointerEvents: "none",
            maxWidth: 260,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.8125rem", color: "var(--color-text-primary)" }}>
            {tooltip.step.step_name ?? tooltip.step.event_type ?? "Step"}
          </p>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: STATUS_COLOR[tooltip.step.status ?? ""] ?? "var(--color-text-secondary)" }}>
            {tooltip.step.status ?? "unknown"}
          </p>
          {tooltip.step.runtime && (
            <p style={{ margin: "0.1rem 0 0", fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
              {tooltip.step.runtime}
            </p>
          )}
          {tooltip.step.message && (
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {tooltip.step.message.slice(0, 120)}
            </p>
          )}
          {tooltip.step.timestamp && (
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
              {new Date(tooltip.step.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditPage(): JSX.Element {
  const { data, loading } = useExecutionLogs();
  const T = useT();
  const [view, setView] = useState<"table" | "swimlane">("table");

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

            {/* View toggle */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "var(--space-4)", justifyContent: "flex-end" }}>
              {(["table", "swimlane"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.375rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    border: `1px solid ${view === v ? "var(--color-brand)" : "var(--color-border-subtle)"}`,
                    background: view === v ? "rgba(61,255,160,0.08)" : "transparent",
                    color: view === v ? "var(--color-brand)" : "var(--color-text-secondary)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {v === "table" ? <LayoutList size={14} /> : <GitBranch size={14} />}
                  {v === "table" ? "Table" : "Swimlane"}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 48, borderRadius: "var(--radius-md)" }} />)}
              </div>
            ) : data.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-16)", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)" }}>
                {T("page.noExecLogs")}
              </div>
            ) : view === "swimlane" ? (
              <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: "var(--space-5)" }}>
                <p style={{ margin: "0 0 var(--space-4)", fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)" }}>
                  Each row = one workflow. Each block = one execution step. Hover for details. Showing up to 20 workflows.
                </p>
                <SwimlaneView rows={data} />
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
