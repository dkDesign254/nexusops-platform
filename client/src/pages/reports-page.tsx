/**
 * NexusOps — ReportsPage
 * Route: /reports (protected)
 *
 * Phase 12: Enhanced with reject workflow, action items display,
 * expand/collapse detail, search filter, and PDF-style export.
 */
import { useState, useMemo, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { useFinalReports } from "@/hooks/use-final-reports";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/contexts/LocaleContext";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Search, Download, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportStatus = "approved" | "rejected" | "pending";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatus(report: { approved?: boolean | null; rejected?: boolean | null }): ReportStatus {
  if (report.approved) return "approved";
  if ((report as Record<string, unknown>).rejected) return "rejected";
  return "pending";
}

const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  approved: {
    label: "Approved",
    color: "var(--color-status-completed)",
    bg: "rgba(74,222,128,0.08)",
    icon: <CheckCircle2 size={13} />,
  },
  rejected: {
    label: "Rejected",
    color: "var(--color-status-failed)",
    bg: "rgba(248,113,113,0.08)",
    icon: <XCircle size={13} />,
  },
  pending: {
    label: "Pending Approval",
    color: "var(--color-status-running)",
    bg: "rgba(250,204,21,0.08)",
    icon: <Clock size={13} />,
  },
};

function exportReportTxt(report: ReturnType<typeof useFinalReports>["data"][number]): void {
  const lines = [
    `NexusOps Report Export`,
    `======================`,
    `ID: ${report.report_display_id ?? report.id}`,
    `Date: ${report.report_timestamp ? new Date(report.report_timestamp).toLocaleString() : "n/a"}`,
    `Status: ${report.approved ? "Approved" : "Pending"}`,
    ``,
    `EXECUTIVE SUMMARY`,
    `-----------------`,
    report.executive_summary ?? "(none)",
    ``,
    `KEY INSIGHTS`,
    `------------`,
    report.key_insights ?? "(none)",
    ``,
    `RECOMMENDATIONS`,
    `---------------`,
    (report as Record<string, unknown>).recommendations as string ?? "(none)",
    ``,
    `ACTION ITEMS`,
    `------------`,
    (report as Record<string, unknown>).action_items as string ?? "(none)",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report-${report.report_display_id ?? report.id}-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

function RejectModal({ reportId, onClose, onDone }: { reportId: string; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleReject(): Promise<void> {
    if (!reason.trim()) { toast.error("Please provide a rejection reason"); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("final_reports")
        .update({ rejected: true, rejection_reason: reason.trim(), approved: false } as Record<string, unknown>)
        .eq("id", reportId);
      if (error) throw error;
      toast.success("Report rejected");
      onDone();
    } catch {
      toast.error("Failed to reject report");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-xl)", padding: "var(--space-6)", maxWidth: 480, width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        <h3 style={{ margin: "0 0 var(--space-4)", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-text-primary)" }}>Reject Report</h3>
        <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>
          Provide a reason for rejection. This will be recorded in the audit trail.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter rejection reason…"
          rows={4}
          style={{ width: "100%", padding: "0.625rem 0.875rem", background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-md)", color: "var(--color-text-primary)", fontFamily: "var(--font-body)", fontSize: "0.875rem", resize: "vertical", outline: "none", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "var(--space-4)", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-subtle)", background: "transparent", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={() => void handleReject()} disabled={submitting}
            style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "none", background: "#f87171", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Rejecting…" : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Report Card ──────────────────────────────────────────────────────────────

function ReportCard({
  report,
  onApprove,
  onReject,
}: {
  report: ReturnType<typeof useFinalReports>["data"][number];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = getStatus(report);
  const cfg = STATUS_CONFIG[status];
  const rejected = !!(report as Record<string, unknown>).rejected;
  const rejectionReason = (report as Record<string, unknown>).rejection_reason as string | undefined;
  const actionItems = (report as Record<string, unknown>).action_items as string | undefined;
  const recommendations = (report as Record<string, unknown>).recommendations as string | undefined;

  return (
    <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "var(--space-5)", gap: "var(--space-4)" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <FileText size={13} style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>{report.report_display_id ?? "n/a"}</span>
            {report.report_timestamp && (
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
                · {new Date(report.report_timestamp).toLocaleDateString()}
              </span>
            )}
          </div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--color-text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {(report.executive_summary ?? "Report").slice(0, 90)}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {/* Status badge */}
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.6875rem", padding: "0.25rem 0.625rem", borderRadius: "var(--radius-full)", background: cfg.bg, color: cfg.color, fontFamily: "var(--font-body)", fontWeight: 600, border: `1px solid ${cfg.color}22` }}>
            {cfg.icon}
            {cfg.label}
          </span>

          {/* Action buttons (only for pending) */}
          {status === "pending" && (
            <>
              <button
                onClick={() => onApprove(report.id)}
                style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem", borderRadius: "var(--radius-sm)", background: "var(--color-brand)", border: "none", color: "var(--color-bg-base)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700 }}
              >
                Approve
              </button>
              <button
                onClick={() => onReject(report.id)}
                style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem", borderRadius: "var(--radius-sm)", background: "transparent", border: "1px solid #f87171", color: "#f87171", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                Reject
              </button>
            </>
          )}

          {/* Export */}
          <button
            onClick={() => exportReportTxt(report)}
            title="Export as text"
            style={{ background: "none", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-sm)", padding: "0.35rem 0.6rem", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex", alignItems: "center" }}
          >
            <Download size={13} />
          </button>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", padding: "0.25rem" }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Key insights (always visible) */}
      {report.key_insights && (
        <div style={{ padding: "0 var(--space-5) var(--space-4)" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>
            {report.key_insights.slice(0, expanded ? undefined : 200)}{!expanded && report.key_insights.length > 200 ? "…" : ""}
          </p>
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--color-border-subtle)", padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Full summary */}
          {report.executive_summary && (
            <div>
              <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Executive Summary</p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>{report.executive_summary}</p>
            </div>
          )}

          {/* Recommendations */}
          {recommendations && (
            <div>
              <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Recommendations</p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>{recommendations}</p>
            </div>
          )}

          {/* Action items */}
          {actionItems && (
            <div>
              <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.6875rem", color: "var(--color-brand)", fontFamily: "var(--font-body)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Action Items</p>
              <div style={{ background: "rgba(61,255,160,0.04)", border: "1px solid rgba(61,255,160,0.1)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)" }}>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{actionItems}</p>
              </div>
            </div>
          )}

          {/* Rejection reason */}
          {rejected && rejectionReason && (
            <div>
              <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.6875rem", color: "#f87171", fontFamily: "var(--font-body)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Rejection Reason</p>
              <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)" }}>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "#f87171", lineHeight: 1.7 }}>{rejectionReason}</p>
              </div>
            </div>
          )}

          {/* Approval info */}
          {report.approved && report.approved_by && (
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
              Approved by {report.approved_by}
              {report.approved_at ? ` · ${new Date(report.approved_at).toLocaleString()}` : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage(): JSX.Element {
  const { data, loading, approveReport, refetch } = useFinalReports();
  const { user } = useAuth();
  const T = useT();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all");
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((r) => {
      const matchSearch = !q ||
        (r.executive_summary ?? "").toLowerCase().includes(q) ||
        (r.key_insights ?? "").toLowerCase().includes(q) ||
        (r.report_display_id ?? "").toLowerCase().includes(q);
      const status = getStatus(r);
      const matchStatus = statusFilter === "all" || status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  async function handleApprove(id: string): Promise<void> {
    try {
      await approveReport(id, user?.id ?? "");
      toast.success(T("tbl.approved"));
    } catch {
      toast.error("Failed to approve report");
    }
  }

  const handleRejectDone = useCallback(async () => {
    setRejectTarget(null);
    await refetch();
  }, [refetch]);

  // Stats
  const approvedCount = data.filter((r) => r.approved).length;
  const pendingCount = data.filter((r) => !r.approved && !(r as Record<string, unknown>).rejected).length;
  const rejectedCount = data.filter((r) => !!(r as Record<string, unknown>).rejected).length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title={T("page.finalReports")} />
        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

            {/* Stats row */}
            {!loading && data.length > 0 && (
              <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-2)" }}>
                {[
                  { label: "Total", value: data.length, color: "var(--color-text-primary)" },
                  { label: "Approved", value: approvedCount, color: "var(--color-status-completed)" },
                  { label: "Pending", value: pendingCount, color: "var(--color-status-running)" },
                  { label: "Rejected", value: rejectedCount, color: "var(--color-status-failed)" },
                ].map((s) => (
                  <div key={s.label} style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-md)", padding: "0.5rem 1rem", display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", color: s.color }}>{s.value}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>{s.label}</span>
                  </div>
                ))}
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "0.8125rem", color: "var(--color-text-tertiary)" }}>
                    Approval rate: <strong style={{ color: approvedCount + rejectedCount > 0 ? "var(--color-brand)" : "var(--color-text-secondary)" }}>
                      {approvedCount + rejectedCount > 0 ? Math.round((approvedCount / (approvedCount + rejectedCount)) * 100) : 0}%
                    </strong>
                  </span>
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: "1 1 220px", minWidth: 0 }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)", pointerEvents: "none" }} />
                <input
                  type="search"
                  placeholder="Search reports…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "100%", padding: "0.4rem 0.75rem 0.4rem 2rem", background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-md)", color: "var(--color-text-primary)", fontFamily: "var(--font-body)", fontSize: "0.8125rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              {(["all", "approved", "pending", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{ padding: "0.375rem 0.625rem", borderRadius: "var(--radius-sm)", border: `1px solid ${statusFilter === s ? "var(--color-brand)" : "var(--color-border-subtle)"}`, background: statusFilter === s ? "rgba(61,255,160,0.08)" : "transparent", color: statusFilter === s ? "var(--color-brand)" : "var(--color-text-tertiary)", fontFamily: "var(--font-display)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}
                >
                  {s}
                </button>
              ))}
            </div>

            {loading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: "var(--radius-lg)" }} />)
              : filtered.length === 0
              ? <div style={{ textAlign: "center", padding: "var(--space-16)", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)" }}>
                  {data.length === 0 ? T("page.noReports") : "No reports match the current filter."}
                </div>
              : filtered.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onApprove={(id) => void handleApprove(id)}
                    onReject={(id) => setRejectTarget(id)}
                  />
                ))
            }
          </div>
        </main>
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          reportId={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={() => void handleRejectDone()}
        />
      )}
    </div>
  );
}
