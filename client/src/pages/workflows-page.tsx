/**
 * NexusOps — WorkflowsPage
 * Route: /workflows (protected)
 *
 * Phase 9: Governance actions — cancel (running/pending) and retry (failed/cancelled).
 */
import { useState } from "react";
import { MobileSidebar, Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { RecentWorkflows } from "@/components/dashboard/recent-workflows";
import { useWorkflows } from "@/hooks/use-workflows";
import { useT } from "@/contexts/LocaleContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import type { WorkflowRow } from "@/components/dashboard/recent-workflows";
import { RefreshCw, XCircle, Play, Loader2 } from "lucide-react";

// ─── Governance Action Bar ─────────────────────────────────────────────────────

type GovernanceStatus = "Completed" | "Running" | "Failed" | "Pending" | "Cancelled" | string;

function GovernanceActions({ workflowId, status, onMutated }: {
  workflowId: string;
  status: GovernanceStatus;
  onMutated: () => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const cancelMutation = trpc.workflows.cancel.useMutation({
    onSuccess: () => { toast.success("Workflow cancelled"); onMutated(); setCancelling(false); },
    onError: (e) => { toast.error(e.message); setCancelling(false); },
  });

  const retryMutation = trpc.workflows.retry.useMutation({
    onSuccess: (d) => { toast.success(`Retry complete — new workflow ${d.id}`); onMutated(); setRetrying(false); },
    onError: (e) => { toast.error(e.message); setRetrying(false); },
  });

  const canCancel = status === "Running" || status === "Pending";
  const canRetry = status === "Failed" || status === "Cancelled";

  if (!canCancel && !canRetry) return null;

  return (
    <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
      {canCancel && (
        <button
          disabled={cancelling}
          onClick={() => { setCancelling(true); cancelMutation.mutate({ id: workflowId, reason: "Cancelled via UI" }); }}
          title="Cancel workflow"
          style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem", background: "transparent", border: "1px solid rgba(248,113,113,0.4)", borderRadius: "var(--radius-sm)", color: "#f87171", fontFamily: "var(--font-display)", fontSize: "0.6875rem", fontWeight: 600, cursor: cancelling ? "not-allowed" : "pointer", opacity: cancelling ? 0.6 : 1 }}
        >
          {cancelling ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <XCircle size={11} />}
          Cancel
        </button>
      )}
      {canRetry && (
        <button
          disabled={retrying}
          onClick={() => { setRetrying(true); retryMutation.mutate({ id: workflowId }); }}
          title="Retry workflow"
          style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem", background: "transparent", border: "1px solid rgba(61,255,160,0.4)", borderRadius: "var(--radius-sm)", color: "var(--color-brand)", fontFamily: "var(--font-display)", fontSize: "0.6875rem", fontWeight: 600, cursor: retrying ? "not-allowed" : "pointer", opacity: retrying ? 0.6 : 1 }}
        >
          {retrying ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={11} />}
          Retry
        </button>
      )}
    </div>
  );
}

// ─── Trigger New Workflow ──────────────────────────────────────────────────────

function TriggerModal({ onClose, onTriggered }: { onClose: () => void; onTriggered: () => void }) {
  const [runtime, setRuntime] = useState<"make" | "n8n">("make");
  const [webhookUrl, setWebhookUrl] = useState("");

  const createMutation = trpc.workflows.create.useMutation({
    onSuccess: (d) => {
      toast.success(`Workflow ${d.id} triggered (${d.status})`);
      onTriggered();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-xl)", padding: "var(--space-6)", maxWidth: 460, width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        <h3 style={{ margin: "0 0 var(--space-4)", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-text-primary)" }}>
          Trigger New Workflow Run
        </h3>

        <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: "0.375rem" }}>Runtime</label>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "var(--space-4)" }}>
          {(["make", "n8n"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRuntime(r)}
              style={{ padding: "0.375rem 1rem", borderRadius: "var(--radius-sm)", border: `1px solid ${runtime === r ? "var(--color-brand)" : "var(--color-border-subtle)"}`, background: runtime === r ? "rgba(61,255,160,0.08)" : "transparent", color: runtime === r ? "var(--color-brand)" : "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
            >
              {r === "make" ? "Make" : "n8n"}
            </button>
          ))}
        </div>

        <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: "0.375rem" }}>
          Webhook URL <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>(optional — leave blank for simulation)</span>
        </label>
        <input
          type="url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder={`https://hook.${runtime}.com/your-webhook`}
          style={{ width: "100%", padding: "0.625rem 0.875rem", background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-md)", color: "var(--color-text-primary)", fontFamily: "var(--font-body)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", marginBottom: "var(--space-5)" }}
        />

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-subtle)", background: "transparent", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={() => createMutation.mutate({ runtime, requestedBy: "Platform User", webhookUrl: webhookUrl || undefined })}
            disabled={createMutation.isPending}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 1.25rem", background: "var(--color-brand)", border: "none", borderRadius: "var(--radius-md)", color: "var(--color-bg-base)", fontFamily: "var(--font-display)", fontWeight: 700, cursor: createMutation.isPending ? "not-allowed" : "pointer", opacity: createMutation.isPending ? 0.7 : 1 }}
          >
            {createMutation.isPending ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={14} />}
            {createMutation.isPending ? "Running…" : "Trigger Run"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WorkflowsPage(): JSX.Element {
  const { data, loading, refetch } = useWorkflows();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showTrigger, setShowTrigger] = useState(false);
  const T = useT();

  const q = search.toLowerCase();
  const filtered = data.filter((wf) =>
    (wf.workflow_name ?? "").toLowerCase().includes(q) ||
    (wf.workflow_id ?? "").toLowerCase().includes(q)
  );

  const rows: WorkflowRow[] = filtered.map((wf) => ({
    id: wf.id,
    workflowId: wf.workflow_id ?? wf.id,
    workflowName: wf.workflow_name ?? "—",
    runtime: wf.runtime_used,
    status: wf.status ?? "Pending",
    reportPeriod: wf.report_period,
    durationMins: wf.duration_mins,
  }));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <MobileSidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="Workflows" onMobileMenuOpen={() => setMobileNavOpen(true)} />
        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

            {/* Toolbar */}
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={T("search.workflows")}
                style={{ padding: "0.6rem var(--space-4)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)", background: "var(--color-bg-elevated)", color: "var(--color-text-primary)", fontFamily: "var(--font-display)", fontSize: "0.875rem", flex: "1 1 240px", minWidth: 0, outline: "none" }}
              />
              <button
                onClick={() => setShowTrigger(true)}
                style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.6rem 1.125rem", background: "var(--color-brand)", border: "none", borderRadius: "var(--radius-md)", color: "var(--color-bg-base)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", flexShrink: 0 }}
              >
                <Play size={14} />
                Trigger Run
              </button>
            </div>

            {/* Governance actions alongside each workflow */}
            {!loading && rows.length > 0 && (
              <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                        {["Workflow", "Runtime", "Status", "Period", "Actions"].map((h) => (
                          <th key={h} style={{ padding: "0.65rem var(--space-4)", textAlign: "left", fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-display)", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const wf = data.find((w) => w.id === row.id);
                        const statusColor = row.status === "Completed" ? "#4ade80" : row.status === "Failed" ? "#f87171" : row.status === "Running" ? "#60a5fa" : "var(--color-text-tertiary)";
                        return (
                          <tr key={row.id}
                            style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                            <td style={{ padding: "0.75rem var(--space-4)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.workflowName}</td>
                            <td style={{ padding: "0.75rem var(--space-4)", fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{row.runtime ?? "—"}</td>
                            <td style={{ padding: "0.75rem var(--space-4)" }}>
                              <span style={{ fontSize: "0.6875rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)", color: statusColor, background: `${statusColor}18`, fontFamily: "var(--font-body)", fontWeight: 600 }}>{row.status}</span>
                            </td>
                            <td style={{ padding: "0.75rem var(--space-4)", fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>{row.reportPeriod ?? "—"}</td>
                            <td style={{ padding: "0.75rem var(--space-4)" }}>
                              {wf && (
                                <GovernanceActions
                                  workflowId={wf.id}
                                  status={row.status}
                                  onMutated={() => void refetch()}
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: "var(--radius-md)" }} />)}
              </div>
            )}

            {!loading && rows.length === 0 && (
              <div style={{ textAlign: "center", padding: "var(--space-16)", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)" }}>
                {data.length === 0 ? "No workflows yet. Trigger your first run above." : `No workflows match "${search}"`}
              </div>
            )}
          </div>
        </main>
      </div>

      {showTrigger && (
        <TriggerModal
          onClose={() => setShowTrigger(false)}
          onTriggered={() => void refetch()}
        />
      )}
    </div>
  );
}
