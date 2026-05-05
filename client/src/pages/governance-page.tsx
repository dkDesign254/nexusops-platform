/**
 * NexusOps — Governance Page
 * Route: /governance (protected)
 *
 * Visual governance dashboard: compliance score, audit completeness,
 * risk heatmap, policy checklist, runtime independence diagram.
 */
import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { useWorkflows } from "@/hooks/use-workflows";
import { useExecutionLogs } from "@/hooks/use-execution-logs";
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Clock, FileCheck, Lock, ShieldCheck, TrendingUp, XCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PolicyItem {
  id: string;
  label: string;
  description: string;
  status: "pass" | "warn" | "fail";
}

interface GovernanceDimension {
  name: string;
  score: number;
  max: number;
  color: string;
  note: string;
}

// ─── Governance Score ─────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#3dffa0" : score >= 60 ? "#facc15" : "#f87171";

  return (
    <svg width={140} height={140} viewBox="0 0 140 140">
      <circle cx={70} cy={70} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} />
      <circle
        cx={70} cy={70} r={r}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x={70} y={66} textAnchor="middle" fill={color} fontSize={26} fontWeight={700} fontFamily="var(--font-display)">
        {score}
      </text>
      <text x={70} y={84} textAnchor="middle" fill="var(--color-text-tertiary)" fontSize={10} fontFamily="var(--font-display)">
        / 100
      </text>
    </svg>
  );
}

// ─── Dimension Bar ────────────────────────────────────────────────────────────

function DimensionBar({ dim }: { dim: GovernanceDimension }) {
  const pct = Math.round((dim.score / dim.max) * 100);
  return (
    <div style={{ marginBottom: "var(--space-3)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: "0.8125rem", fontFamily: "var(--font-display)", color: "var(--color-text-primary)", fontWeight: 500 }}>{dim.name}</span>
        <span style={{ fontSize: "0.75rem", color: dim.color, fontFamily: "var(--font-display)", fontWeight: 600 }}>{dim.score}/{dim.max}</span>
      </div>
      <div style={{ height: 6, background: "var(--color-bg-base)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: dim.color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
      <p style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", marginTop: 4 }}>{dim.note}</p>
    </div>
  );
}

// ─── Policy Checklist ─────────────────────────────────────────────────────────

function PolicyRow({ item, expanded, onToggle }: { item: PolicyItem; expanded: boolean; onToggle: () => void }) {
  const Icon = item.status === "pass" ? CheckCircle2 : item.status === "warn" ? AlertTriangle : XCircle;
  const color = item.status === "pass" ? "#3dffa0" : item.status === "warn" ? "#facc15" : "#f87171";

  return (
    <div
      style={{
        borderBottom: "1px solid var(--color-border-subtle)",
        padding: "0.75rem var(--space-4)",
        cursor: "pointer",
      }}
      onClick={onToggle}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <Icon size={15} style={{ color, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: "0.875rem", fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>{item.label}</span>
        <span style={{
          fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em",
          padding: "0.15rem 0.5rem", borderRadius: "var(--radius-full)",
          color, background: `${color}18`,
        }}>{item.status}</span>
        {expanded ? <ChevronUp size={14} style={{ color: "var(--color-text-tertiary)" }} /> : <ChevronDown size={14} style={{ color: "var(--color-text-tertiary)" }} />}
      </div>
      {expanded && (
        <p style={{ marginTop: "var(--space-2)", fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.6, paddingLeft: 27 }}>
          {item.description}
        </p>
      )}
    </div>
  );
}

// ─── Runtime Independence Diagram ─────────────────────────────────────────────

function RuntimeDiagram() {
  const nodes = [
    { label: "NexusOps Core", x: 50, y: 10, w: 120, h: 32, accent: true },
    { label: "Make Runtime", x: 5, y: 65, w: 90, h: 28, accent: false },
    { label: "n8n Runtime", x: 110, y: 65, w: 90, h: 28, accent: false },
    { label: "Supabase DB", x: 5, y: 115, w: 90, h: 28, accent: false },
    { label: "Airtable Audit", x: 110, y: 115, w: 90, h: 28, accent: false },
    { label: "OpenAI / LLM", x: 57, y: 165, w: 106, h: 28, accent: false },
  ];
  const lines = [
    { x1: 110, y1: 42, x2: 50, y2: 65 },
    { x1: 110, y1: 42, x2: 155, y2: 65 },
    { x1: 50, y1: 93, x2: 50, y2: 115 },
    { x1: 155, y1: 93, x2: 155, y2: 115 },
    { x1: 110, y1: 42, x2: 110, y2: 165 },
  ];

  return (
    <svg viewBox="0 0 220 205" style={{ width: "100%", maxWidth: 320 }}>
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="rgba(61,255,160,0.25)" strokeWidth={1.5} strokeDasharray="4 3" />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={6}
            fill={n.accent ? "rgba(61,255,160,0.12)" : "rgba(255,255,255,0.05)"}
            stroke={n.accent ? "rgba(61,255,160,0.5)" : "rgba(255,255,255,0.1)"} strokeWidth={1} />
          <text x={n.x + n.w / 2} y={n.y + n.h / 2 + 4}
            textAnchor="middle" fontSize={9} fill={n.accent ? "#3dffa0" : "rgba(255,255,255,0.7)"}
            fontFamily="var(--font-display)" fontWeight={n.accent ? 700 : 400}>
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Audit Completeness ───────────────────────────────────────────────────────

const REQUIRED_STEPS = [
  "Workflow Intake", "Runtime Routing", "Runtime Dispatch",
  "AI Report Generation", "Workflow Completion",
];

function AuditRow({ wf, logs }: { wf: { id: string; name: string }; logs: { step: string }[] }) {
  const steps = new Set(logs.map((l) => l.step));
  const missing = REQUIRED_STEPS.filter((s) => !steps.has(s));
  const pct = Math.round(((REQUIRED_STEPS.length - missing.length) / REQUIRED_STEPS.length) * 100);
  const color = pct === 100 ? "#3dffa0" : pct >= 60 ? "#facc15" : "#f87171";

  return (
    <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
      <td style={{ padding: "0.75rem var(--space-4)", fontSize: "0.8125rem", fontFamily: "var(--font-display)", color: "var(--color-text-primary)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {wf.name || wf.id}
      </td>
      <td style={{ padding: "0.75rem var(--space-4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ flex: 1, height: 6, background: "var(--color-bg-base)", borderRadius: 3 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: "0.75rem", color, fontFamily: "var(--font-display)", fontWeight: 600, minWidth: 36 }}>{pct}%</span>
        </div>
      </td>
      <td style={{ padding: "0.75rem var(--space-4)", fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
        {missing.length === 0 ? "Complete" : `Missing: ${missing.join(", ")}`}
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GovernancePage(): JSX.Element {
  const { data: workflows } = useWorkflows();
  const { data: logs } = useExecutionLogs();
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);

  // Governance score calculation
  const total = workflows.length;
  const completed = workflows.filter((w) => w.status === "Completed").length;
  const failed = workflows.filter((w) => w.status === "Failed").length;
  const hasLogs = logs.length > 0;
  const hasReports = completed > 0;

  const dimensions: GovernanceDimension[] = [
    {
      name: "Audit Traceability",
      score: hasLogs ? Math.min(30, Math.round((logs.length / Math.max(total * 5, 1)) * 30)) : 0,
      max: 30,
      color: "#3dffa0",
      note: `${logs.length} execution log entries across ${total} workflows`,
    },
    {
      name: "AI Oversight",
      score: hasReports ? 25 : 10,
      max: 25,
      color: "#60a5fa",
      note: hasReports ? "AI reports generated with prompt/response logging" : "No completed workflows yet",
    },
    {
      name: "Runtime Independence",
      score: 20,
      max: 20,
      color: "#c084fc",
      note: "Make and n8n runtimes supported; internal simulation fallback active",
    },
    {
      name: "Failure Handling",
      score: failed > 0 ? 15 : 20,
      max: 25,
      color: "#facc15",
      note: failed > 0 ? `${failed} failed workflow(s) — retry capability available` : "No failures detected",
    },
  ];

  const totalScore = dimensions.reduce((s, d) => s + d.score, 0);

  const policies: PolicyItem[] = [
    {
      id: "logging",
      label: "Every workflow generates an audit trail",
      status: hasLogs ? "pass" : "warn",
      description: hasLogs
        ? "All workflows write execution logs at each step: Intake, Routing, Dispatch, AI Generation, and Completion."
        : "No execution logs found. Run a workflow to generate an audit trail.",
    },
    {
      id: "ai_oversight",
      label: "AI prompts and responses are logged",
      status: hasReports ? "pass" : "warn",
      description: "All LLM calls log the full prompt, model response, model name, and timestamp. Flagging is supported for suspicious outputs.",
    },
    {
      id: "approval",
      label: "Reports require human review before action",
      status: "warn",
      description: "Reports can be approved or rejected via the Reports page. Auto-approval is disabled by default. Approval rate tracking is active.",
    },
    {
      id: "runtime_independence",
      label: "Workflows are runtime-independent",
      status: "pass",
      description: "NexusOps orchestrates workflows without locking into a single runtime. Make and n8n are interchangeable; internal simulation is always available.",
    },
    {
      id: "failure_handling",
      label: "Failed workflows can be retried without data loss",
      status: "pass",
      description: "The cancel and retry governance engine creates a new workflow record on retry, preserving the original failure log for traceability.",
    },
    {
      id: "rls",
      label: "Row-level security enabled on all tables",
      status: "warn",
      description: "Supabase RLS policies are defined in migrations but must be enabled in the Supabase dashboard. Navigate to Authentication → Policies to activate.",
    },
    {
      id: "credentials",
      label: "Service credentials are not exposed in frontend",
      status: "pass",
      description: "SUPABASE_SERVICE_ROLE_KEY, AIRTABLE_TOKEN, STRIPE_SECRET_KEY, and ANTHROPIC_API_KEY are server-only env vars. The frontend only receives a JWT cookie.",
    },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="Governance" />
        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

            {/* Score + Dimensions */}
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--space-6)", alignItems: "start" }}>
              <div style={{
                background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)",
                borderRadius: "var(--radius-xl)", padding: "var(--space-6)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)", minWidth: 200,
              }}>
                <ScoreRing score={totalScore} />
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>Governance Score</p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", textAlign: "center" }}>
                  {totalScore >= 80 ? "Strong governance posture" : totalScore >= 60 ? "Moderate — review warnings" : "Attention needed"}
                </p>
              </div>

              <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-xl)", padding: "var(--space-6)" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text-primary)", marginBottom: "var(--space-5)" }}>Score Breakdown</p>
                {dimensions.map((d) => <DimensionBar key={d.name} dim={d} />)}
              </div>
            </div>

            {/* Stats strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "var(--space-4)" }}>
              {[
                { label: "Total Workflows", value: total, icon: <TrendingUp size={18} style={{ color: "#60a5fa" }} /> },
                { label: "Audit Log Entries", value: logs.length, icon: <FileCheck size={18} style={{ color: "#3dffa0" }} /> },
                { label: "Active Policies", value: policies.filter(p => p.status === "pass").length + " / " + policies.length, icon: <ShieldCheck size={18} style={{ color: "#c084fc" }} /> },
                { label: "Open Issues", value: policies.filter(p => p.status !== "pass").length, icon: <Clock size={18} style={{ color: "#facc15" }} /> },
              ].map((s) => (
                <div key={s.label} style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    {s.icon}
                    <span style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)" }}>{s.label}</span>
                  </div>
                  <p style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-text-primary)", margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Two-column: Policy checklist + Runtime diagram */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "var(--space-6)", alignItems: "start" }}>

              {/* Policy checklist */}
              <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
                <div style={{ padding: "var(--space-5) var(--space-5) var(--space-4)", borderBottom: "1px solid var(--color-border-subtle)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <Lock size={16} style={{ color: "var(--color-brand)" }} />
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text-primary)", margin: 0 }}>Governance Policy Checklist</p>
                </div>
                {policies.map((p) => (
                  <PolicyRow
                    key={p.id}
                    item={p}
                    expanded={expandedPolicy === p.id}
                    onToggle={() => setExpandedPolicy(expandedPolicy === p.id ? null : p.id)}
                  />
                ))}
              </div>

              {/* Runtime independence diagram */}
              <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-xl)", padding: "var(--space-5)" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text-primary)", marginBottom: "var(--space-4)" }}>Runtime Independence</p>
                <RuntimeDiagram />
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", lineHeight: 1.6, marginTop: "var(--space-3)" }}>
                  NexusOps orchestrates workflows through an abstraction layer. Switching between Make, n8n, or simulation mode requires zero code changes.
                </p>
              </div>
            </div>

            {/* Audit completeness table */}
            {workflows.length > 0 && (
              <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
                <div style={{ padding: "var(--space-5) var(--space-5) var(--space-4)", borderBottom: "1px solid var(--color-border-subtle)" }}>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text-primary)", margin: 0 }}>Audit Completeness per Workflow</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-tertiary)", marginTop: "0.25rem" }}>A governance-complete workflow has all 5 required log steps.</p>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                        {["Workflow", "Completeness", "Notes"].map((h) => (
                          <th key={h} style={{ padding: "0.65rem var(--space-4)", textAlign: "left", fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-display)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {workflows.slice(0, 10).map((wf) => {
                        const wfLogs = logs.filter((l) => l.workflow_id === wf.id || l.workflowId === wf.id);
                        return (
                          <AuditRow
                            key={wf.id}
                            wf={{ id: wf.id, name: wf.workflow_name ?? wf.id }}
                            logs={wfLogs.map((l) => ({ step: l.step ?? "" }))}
                          />
                        );
                      })}
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
