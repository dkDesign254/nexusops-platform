/**
 * NexusOps — RecentWorkflows
 *
 * Table of the last 10 workflows. Columns: ID · Name · Runtime ·
 * Status · Period · Duration · Actions.
 * Actions: "View trace" (→ /audit?workflow=ID) and "View report" (→ /reports).
 */
import { useLocation } from "wouter";

export interface WorkflowRow {
  id: string;
  workflowId: string;
  workflowName: string;
  runtime: string | null;
  status: string;
  reportPeriod: string | null;
  durationMins: number | null;
}

export interface RecentWorkflowsProps {
  workflows: WorkflowRow[];
  loading?: boolean;
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  Completed: { color: "var(--color-status-completed)", bg: "rgba(61,255,160,0.08)" },
  Failed: { color: "var(--color-status-failed)", bg: "rgba(255,95,95,0.08)" },
  Running: { color: "var(--color-status-running)", bg: "rgba(255,179,71,0.08)" },
  Pending: { color: "var(--color-text-secondary)", bg: "var(--color-bg-elevated)" },
  Cancelled: { color: "var(--color-status-cancelled)", bg: "rgba(167,139,250,0.08)" },
};

function StatusBadge({ status }: { status: string }): JSX.Element {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE["Pending"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.6875rem", padding: "0.2rem 0.6rem", borderRadius: "var(--radius-full)", background: style.bg, color: style.color, fontFamily: "var(--font-display)", fontWeight: 600, whiteSpace: "nowrap", letterSpacing: "0.02em" }}>
      {status === "Running" && <span className="status-dot-running" />}
      {status}
    </span>
  );
}

function SkeletonRow(): JSX.Element {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} style={{ padding: "0.75rem var(--space-4)" }}>
          <div className="skeleton" style={{ height: 12, borderRadius: 6, width: i === 1 ? 140 : 60 }} />
        </td>
      ))}
    </tr>
  );
}

export function RecentWorkflows({ workflows, loading = false }: RecentWorkflowsProps): JSX.Element {
  const [, setLocation] = useLocation();

  return (
    <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ padding: "var(--space-5) var(--space-6)", borderBottom: "1px solid var(--color-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--color-text-primary)", fontSize: "0.9375rem" }}>
          Recent workflows
        </p>
        <button onClick={() => setLocation("/workflows")}
          style={{ fontSize: "0.8125rem", color: "var(--color-brand)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-display)" }}>
          View all →
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              {["ID", "Name", "Runtime", "Status", "Period", "Duration", "Actions"].map((h) => (
                <th key={h} style={{ padding: "0.65rem var(--space-4)", textAlign: "left", fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-display)", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : workflows.length === 0
              ? (
                <tr>
                  <td colSpan={7} style={{ padding: "var(--space-10)", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "0.875rem", fontFamily: "var(--font-display)" }}>
                    No workflows yet. Connect a runtime to start logging.
                  </td>
                </tr>
              )
              : workflows.map((wf) => (
                <tr key={wf.id}
                  className="table-row-hover"
                  style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                  <td style={{ padding: "0.75rem var(--space-4)", fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>{wf.workflowId}</td>
                  <td style={{ padding: "0.75rem var(--space-4)", fontSize: "0.875rem", color: "var(--color-text-primary)", fontFamily: "var(--font-display)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wf.workflowName}</td>
                  <td style={{ padding: "0.75rem var(--space-4)" }}>
                    {wf.runtime && (
                      <span style={{ fontSize: "0.6875rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)", background: wf.runtime === "Make" ? "rgba(255,107,53,0.1)" : "rgba(234,78,157,0.1)", color: wf.runtime === "Make" ? "var(--color-runtime-make)" : "var(--color-runtime-n8n)", fontFamily: "var(--font-body)" }}>
                        {wf.runtime}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem var(--space-4)" }}><StatusBadge status={wf.status} /></td>
                  <td style={{ padding: "0.75rem var(--space-4)", fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>{wf.reportPeriod ?? "—"}</td>
                  <td style={{ padding: "0.75rem var(--space-4)", fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>{wf.durationMins != null ? `${wf.durationMins}m` : "—"}</td>
                  <td style={{ padding: "0.75rem var(--space-4)" }}>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <button onClick={() => setLocation(`/audit?workflow=${wf.workflowId}`)}
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", borderRadius: "var(--radius-sm)", background: "rgba(14,164,114,0.08)", border: "1px solid rgba(14,164,114,0.2)", color: "var(--color-brand)", cursor: "pointer", fontFamily: "var(--font-display)", whiteSpace: "nowrap" }}>
                        View trace
                      </button>
                      <button onClick={() => setLocation("/reports")}
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", borderRadius: "var(--radius-sm)", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)", color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "var(--font-display)", whiteSpace: "nowrap" }}>
                        Report
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
