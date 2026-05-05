/**
 * NexusOps — AdminPage
 * Route: /admin (protected — admin role required)
 *
 * Full operator dashboard covering: system health, integration status,
 * user management, Airtable sync, seed data, audit events, and metrics.
 */
import { useState } from "react";
import {
  Activity, AlertTriangle, CheckCircle, Database, RefreshCw,
  Users, Zap, Shield, Server, GitBranch, Loader2,
  BarChart3, Clock, Trash2, Download, XCircle,
} from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { trpc } from "@/lib/trpc";
import { useWorkflows } from "@/hooks/use-workflows";
import { useExecutionLogs } from "@/hooks/use-execution-logs";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusLevel = "ok" | "warn" | "error" | "unknown";

interface ServiceStatus {
  name: string;
  key: string;
  icon: React.ReactNode;
  status: StatusLevel;
  detail: string;
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function AdminSection({ title, children, action }: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border-subtle)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-5)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
        <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusLevel }) {
  const cfg: Record<StatusLevel, { label: string; color: string; bg: string }> = {
    ok: { label: "Operational", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
    warn: { label: "Degraded", color: "#facc15", bg: "rgba(250,204,21,0.12)" },
    error: { label: "Error", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
    unknown: { label: "Unknown", color: "var(--color-text-tertiary)", bg: "rgba(255,255,255,0.06)" },
  };
  const c = cfg[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      padding: "0.2rem 0.5rem", borderRadius: 99,
      background: c.bg, color: c.color,
      fontSize: "0.6875rem", fontFamily: "var(--font-display)", fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

// ─── Integration status card ──────────────────────────────────────────────────

function IntegrationCard({ svc }: { svc: ServiceStatus }) {
  return (
    <div style={{
      background: "var(--color-bg-elevated)",
      border: "1px solid var(--color-border-subtle)",
      borderRadius: "var(--radius-md)",
      padding: "var(--space-4)",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    }}>
      <div style={{ color: "var(--color-text-secondary)", flexShrink: 0 }}>{svc.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
          {svc.name}
        </p>
        <p style={{ margin: "0.1rem 0 0", fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {svc.detail}
        </p>
      </div>
      <StatusBadge status={svc.status} />
    </div>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div style={{
      background: "var(--color-bg-elevated)",
      border: "1px solid var(--color-border-subtle)",
      borderRadius: "var(--radius-md)",
      padding: "var(--space-4)",
    }}>
      <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
      <p style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", color: color ?? "var(--color-text-primary)" }}>{value}</p>
      {sub && <p style={{ margin: "0.1rem 0 0", fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>{sub}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage(): JSX.Element {
  const { user } = useAuth();
  const { data: workflows, loading: wfLoading } = useWorkflows();
  const { data: logs } = useExecutionLogs();

  const syncMutation = trpc.sync.runAirtableSync.useMutation({
    onSuccess: (res) => {
      toast.success(`Sync complete — ${res.totalSynced ?? 0} records synced`);
    },
    onError: (e) => toast.error(`Sync failed: ${e.message}`),
  });

  const seedMutation = trpc.sync.seedIfEmpty.useMutation({
    onSuccess: () => toast.success("Demo data seeded successfully"),
    onError: (e) => toast.error(`Seed failed: ${e.message}`),
  });

  const syncStatus = trpc.sync.status.useQuery(undefined, { refetchInterval: 30000 });
  const userList = trpc.auth.listUsers.useQuery();
  const serviceStatusQuery = trpc.system.serviceStatus.useQuery(undefined, { refetchInterval: 30000 });

  // Derived workflow stats
  const total = workflows.length;
  const completed = workflows.filter((w) => w.status === "completed").length;
  const failed = workflows.filter((w) => w.status === "failed").length;
  const pending = workflows.filter((w) => w.status === "pending" || w.status === "running").length;

  // Runtime distribution for bar chart
  const runtimeCounts: Record<string, number> = {};
  for (const wf of workflows) {
    const rt = wf.runtime_used ?? "unknown";
    runtimeCounts[rt] = (runtimeCounts[rt] ?? 0) + 1;
  }
  const runtimeChartData = Object.entries(runtimeCounts).map(([name, value]) => ({ name, value }));

  // Recent audit logs (latest 5 events from exec logs as proxy)
  const recentEvents = logs.slice(0, 8);

  // Integration status — pulled from live serviceStatus tRPC call
  const liveSvcs = serviceStatusQuery.data?.services as Record<string, string> | undefined;
  const toLevel = (s: string | undefined): StatusLevel =>
    s === "ok" ? "ok" : s === "degraded" ? "warn" : "error";

  const services: ServiceStatus[] = [
    {
      name: "Supabase",
      key: "supabase",
      icon: <Database size={18} />,
      status: liveSvcs ? toLevel(liveSvcs.supabase) : "unknown",
      detail: liveSvcs?.supabase === "ok" ? `Connected — ${total} workflows` : "SUPABASE_URL or SERVICE_ROLE_KEY missing",
    },
    {
      name: "Airtable",
      key: "airtable",
      icon: <GitBranch size={18} />,
      status: liveSvcs ? toLevel(liveSvcs.airtable) : "unknown",
      detail: syncStatus.data
        ? `Last sync: ${new Date(syncStatus.data.completedAt ?? "").toLocaleString()}`
        : liveSvcs?.airtable === "ok" ? "Token configured — no sync yet" : "AIRTABLE_TOKEN not set",
    },
    {
      name: "Make.com",
      key: "make",
      icon: <Zap size={18} />,
      status: liveSvcs ? toLevel(liveSvcs.make) : "unknown",
      detail: liveSvcs?.make === "ok" ? "MAKE_WEBHOOK_SECRET configured" : "MAKE_WEBHOOK_SECRET not set",
    },
    {
      name: "n8n",
      key: "n8n",
      icon: <Activity size={18} />,
      status: liveSvcs ? toLevel(liveSvcs.n8n) : "unknown",
      detail: liveSvcs?.n8n === "ok" ? "N8N_WEBHOOK_SECRET configured" : "N8N_WEBHOOK_SECRET not set",
    },
    {
      name: "Stripe",
      key: "stripe",
      icon: <Shield size={18} />,
      status: liveSvcs ? toLevel(liveSvcs.stripe) : "unknown",
      detail: liveSvcs?.stripe === "ok" ? "STRIPE_SECRET_KEY configured" : "STRIPE_SECRET_KEY not set",
    },
    {
      name: "LLM / AI",
      key: "llm",
      icon: <Server size={18} />,
      status: liveSvcs ? toLevel(liveSvcs.llm) : "unknown",
      detail: liveSvcs?.llm === "ok" ? "API key configured — AI reports active" : "ANTHROPIC_API_KEY not set",
    },
  ];

  // Guard: non-admin users see access denied
  if (user && user.role !== "admin") {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
        <div className="hidden md:flex"><Sidebar /></div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <TopBar title="Admin" />
          <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <XCircle size={40} style={{ color: "#f87171", margin: "0 auto 1rem" }} />
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.125rem", color: "var(--color-text-primary)" }}>
                Admin access required
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-tertiary)", marginTop: "0.5rem" }}>
                Your account role is <strong>{user.role}</strong>. Contact a platform admin for access.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="Admin Dashboard" />

        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

            {/* System metrics row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-4)" }}>
              <MetricCard label="Total Workflows" value={wfLoading ? "…" : total} />
              <MetricCard label="Completed" value={wfLoading ? "…" : completed} color="#4ade80" />
              <MetricCard label="Failed" value={wfLoading ? "…" : failed} color="#f87171" />
              <MetricCard label="Active / Pending" value={wfLoading ? "…" : pending} color="#facc15" />
              <MetricCard label="Execution Logs" value={logs.length} />
              <MetricCard label="Registered Users" value={userList.data?.length ?? "—"} />
            </div>

            {/* Integration health + Runtime chart */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-5)" }}>

              <AdminSection title="Integration Health">
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  {services.map((svc) => <IntegrationCard key={svc.key} svc={svc} />)}
                </div>
              </AdminSection>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                {/* Runtime distribution */}
                <AdminSection title="Workflow Volume by Runtime">
                  {runtimeChartData.length === 0 ? (
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-text-tertiary)", textAlign: "center", padding: "2rem 0" }}>No workflow data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={runtimeChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="name" tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }} />
                        <YAxis tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }} width={28} />
                        <Tooltip contentStyle={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {runtimeChartData.map((_, i) => (
                            <Cell key={i} fill={["#4ade80", "#f472b6", "#60a5fa", "#facc15"][i % 4]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </AdminSection>

                {/* Workflow status breakdown */}
                <AdminSection title="Status Breakdown">
                  {[
                    { label: "Completed", count: completed, color: "#4ade80" },
                    { label: "Failed", count: failed, color: "#f87171" },
                    { label: "Pending / Running", count: pending, color: "#facc15" },
                  ].map(({ label, count, color }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)" }}>{label}</span>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9375rem", color }}>{count}</span>
                      <div style={{ width: 80, height: 6, borderRadius: 99, background: "var(--color-border-subtle)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${total > 0 ? (count / total) * 100 : 0}%`, background: color, borderRadius: 99, transition: "width 0.4s" }} />
                      </div>
                    </div>
                  ))}
                </AdminSection>
              </div>
            </div>

            {/* Airtable sync + seed actions */}
            <AdminSection
              title="Data Management"
              action={
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => seedMutation.mutate()}
                    disabled={seedMutation.isPending}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.375rem",
                      padding: "0.4rem 0.75rem", borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border-default)",
                      background: "transparent", color: "var(--color-text-secondary)",
                      fontFamily: "var(--font-display)", fontSize: "0.8125rem", cursor: "pointer",
                    }}
                  >
                    {seedMutation.isPending ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Database size={13} />}
                    Seed demo data
                  </button>
                  <button
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.375rem",
                      padding: "0.4rem 0.75rem", borderRadius: "var(--radius-sm)",
                      border: "none", background: "var(--color-brand)", color: "#000",
                      fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer",
                    }}
                  >
                    {syncMutation.isPending ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={13} />}
                    Sync Airtable
                  </button>
                </div>
              }
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
                <div style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <Clock size={14} style={{ color: "var(--color-text-tertiary)" }} />
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Last Sync</span>
                  </div>
                  <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                    {syncStatus.data ? new Date(syncStatus.data.ts ?? "").toLocaleString() : "Never"}
                  </p>
                </div>
                <div style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <CheckCircle size={14} style={{ color: "var(--color-text-tertiary)" }} />
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Records Imported</span>
                  </div>
                  <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                    {syncStatus.data?.imported ?? "—"}
                  </p>
                </div>
                <div style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <AlertTriangle size={14} style={{ color: "var(--color-text-tertiary)" }} />
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Failed Mappings</span>
                  </div>
                  <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                    {syncStatus.data?.failed ?? "—"}
                  </p>
                </div>
              </div>
            </AdminSection>

            {/* Users table */}
            <AdminSection
              title="Registered Users"
              action={
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)" }}>
                  {userList.data?.length ?? 0} users
                </span>
              }
            >
              {userList.isLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {[0,1,2].map((i) => <div key={i} className="skeleton" style={{ height: 44, borderRadius: "var(--radius-md)" }} />)}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                        {["Name", "Email", "Role", "Login Method"].map((h) => (
                          <th key={h} style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-display)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(userList.data ?? []).map((u) => (
                        <tr key={u.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                          <td style={{ padding: "0.625rem 0.75rem", fontSize: "0.875rem", color: "var(--color-text-primary)", fontFamily: "var(--font-display)", fontWeight: 500 }}>{u.name ?? "—"}</td>
                          <td style={{ padding: "0.625rem 0.75rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>{u.email ?? "—"}</td>
                          <td style={{ padding: "0.625rem 0.75rem" }}>
                            <span style={{
                              display: "inline-block", padding: "0.15rem 0.5rem", borderRadius: 99,
                              fontSize: "0.6875rem", fontFamily: "var(--font-display)", fontWeight: 600,
                              background: u.role === "admin" ? "rgba(14,164,114,0.12)" : "rgba(255,255,255,0.06)",
                              color: u.role === "admin" ? "var(--color-brand)" : "var(--color-text-secondary)",
                            }}>
                              {u.role ?? "viewer"}
                            </span>
                          </td>
                          <td style={{ padding: "0.625rem 0.75rem", fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>{u.loginMethod ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AdminSection>

            {/* Recent execution events */}
            <AdminSection
              title="Recent Audit Events"
              action={
                <button
                  onClick={() => {
                    const csv = ["timestamp,event,step,status,runtime,message"]
                      .concat(recentEvents.map((e) => `${e.timestamp ?? ""},${e.event_type ?? ""},${e.step_name ?? ""},${e.status ?? ""},${e.runtime ?? ""},"${(e.message ?? "").replace(/"/g, '""')}"`))
                      .join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `nexusops-audit-${Date.now()}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.375rem",
                    padding: "0.35rem 0.7rem", borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border-subtle)",
                    background: "transparent", color: "var(--color-text-secondary)",
                    fontFamily: "var(--font-display)", fontSize: "0.75rem", cursor: "pointer",
                  }}
                >
                  <Download size={12} /> Export CSV
                </button>
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                {recentEvents.length === 0 ? (
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-tertiary)", textAlign: "center", padding: "1.5rem 0" }}>No audit events yet</p>
                ) : recentEvents.map((ev) => (
                  <div key={ev.id} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-bg-elevated)",
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: ev.status === "success" ? "#4ade80" : ev.status === "failed" ? "#f87171" : "#facc15",
                    }} />
                    <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", flexShrink: 0, minWidth: 80 }}>
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : "—"}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-brand)", fontFamily: "var(--font-body)", flexShrink: 0 }}>{ev.event_type ?? "—"}</span>
                    <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.step_name ?? ev.message ?? "—"}
                    </span>
                    <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", flexShrink: 0 }}>{ev.runtime ?? ""}</span>
                  </div>
                ))}
              </div>
            </AdminSection>

          </div>
        </main>
      </div>
    </div>
  );
}
