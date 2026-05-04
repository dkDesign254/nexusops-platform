/**
 * NexusOps — AgentsPage
 * Route: /agents (protected)
 *
 * Agent Configuration Studio. List, create, and view AI agent configs.
 * Each agent specifies: runtime preference, trigger mode, AI analysis,
 * approval requirements, logging level, and governance readiness.
 */
import { useState } from "react";
import {
  Bot, Plus, Zap, Activity, ToggleLeft, ToggleRight,
  Shield, CheckCircle, Clock, GitBranch, ChevronDown, ChevronUp,
  Loader2, X,
} from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Runtime = "make" | "n8n" | "internal" | "either";
type TriggerMode = "manual" | "scheduled" | "webhook";
type LogLevel = "basic" | "standard" | "full";
type AgentStatus = "draft" | "active" | "paused";

interface AgentConfig {
  id: string;
  name: string;
  purpose: string;
  runtime: Runtime;
  triggerMode: TriggerMode;
  aiAnalysis: boolean;
  approvalRequired: boolean;
  loggingLevel: LogLevel;
  status: AgentStatus;
  riskLevel: "low" | "medium" | "high";
  governanceScore: number;
  createdAt: string;
}

// ─── Demo agents ──────────────────────────────────────────────────────────────

const DEMO_AGENTS: AgentConfig[] = [
  {
    id: "ag-001",
    name: "Weekly Marketing Reporting Agent",
    purpose: "Fetches campaign performance data, runs AI analysis, generates executive reports, and flags low-ROAS campaigns.",
    runtime: "make",
    triggerMode: "scheduled",
    aiAnalysis: true,
    approvalRequired: true,
    loggingLevel: "full",
    status: "active",
    riskLevel: "medium",
    governanceScore: 92,
    createdAt: "2026-04-10",
  },
  {
    id: "ag-002",
    name: "Campaign Anomaly Detector",
    purpose: "Monitors live campaign metrics for CTR drops and ROAS anomalies. Triggers alerts and prepares summary for review.",
    runtime: "n8n",
    triggerMode: "webhook",
    aiAnalysis: true,
    approvalRequired: false,
    loggingLevel: "standard",
    status: "active",
    riskLevel: "low",
    governanceScore: 78,
    createdAt: "2026-04-15",
  },
  {
    id: "ag-003",
    name: "Content Optimisation Agent",
    purpose: "Analyses top-performing ad creatives, suggests improvements using LLM, and creates a draft optimisation brief.",
    runtime: "either",
    triggerMode: "manual",
    aiAnalysis: true,
    approvalRequired: true,
    loggingLevel: "full",
    status: "draft",
    riskLevel: "medium",
    governanceScore: 65,
    createdAt: "2026-04-28",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function GovernanceGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#4ade80" : score >= 60 ? "#facc15" : "#f87171";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ width: 48, height: 6, borderRadius: 99, background: "var(--color-border-subtle)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 99, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: "0.6875rem", fontFamily: "var(--font-display)", fontWeight: 700, color }}>{score}</span>
    </div>
  );
}

function RiskBadge({ risk }: { risk: AgentConfig["riskLevel"] }) {
  const cfg = {
    low: { color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
    medium: { color: "#facc15", bg: "rgba(250,204,21,0.12)" },
    high: { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  };
  const c = cfg[risk];
  return (
    <span style={{ display: "inline-block", padding: "0.15rem 0.5rem", borderRadius: 99, fontSize: "0.6875rem", fontFamily: "var(--font-display)", fontWeight: 600, background: c.bg, color: c.color, textTransform: "capitalize" }}>
      {risk} risk
    </span>
  );
}

function StatusDot({ status }: { status: AgentStatus }) {
  const colors: Record<AgentStatus, string> = {
    active: "#4ade80",
    draft: "#facc15",
    paused: "#f87171",
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.6875rem", fontFamily: "var(--font-display)", fontWeight: 600, color: colors[status], textTransform: "capitalize" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors[status] }} />
      {status}
    </span>
  );
}

const RUNTIME_ICONS: Record<Runtime, React.ReactNode> = {
  make: <Zap size={13} style={{ color: "#fb923c" }} />,
  n8n: <Activity size={13} style={{ color: "#f472b6" }} />,
  internal: <GitBranch size={13} style={{ color: "#60a5fa" }} />,
  either: <Shield size={13} style={{ color: "var(--color-brand)" }} />,
};

// ─── Agent card ───────────────────────────────────────────────────────────────

function AgentCard({ agent }: { agent: AgentConfig }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border-subtle)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
    }}>
      {/* Header row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "var(--space-4) var(--space-5)",
        cursor: "pointer",
      }}
        onClick={() => setExpanded(!expanded)}>

        <div style={{
          width: 36, height: 36, borderRadius: "var(--radius-md)",
          background: "rgba(14,164,114,0.1)",
          border: "1px solid rgba(14,164,114,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Bot size={18} style={{ color: "var(--color-brand)" }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
              {agent.name}
            </p>
            <StatusDot status={agent.status} />
          </div>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {agent.purpose}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <RiskBadge risk={agent.riskLevel} />
          <GovernanceGauge score={agent.governanceScore} />
          {expanded ? <ChevronUp size={16} style={{ color: "var(--color-text-tertiary)" }} /> : <ChevronDown size={16} style={{ color: "var(--color-text-tertiary)" }} />}
        </div>
      </div>

      {/* Expanded config details */}
      {expanded && (
        <div style={{
          borderTop: "1px solid var(--color-border-subtle)",
          padding: "var(--space-5)",
          background: "var(--color-bg-elevated)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
            {[
              { label: "Runtime", value: <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>{RUNTIME_ICONS[agent.runtime]}<span style={{ textTransform: "capitalize" }}>{agent.runtime}</span></span> },
              { label: "Trigger Mode", value: <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Clock size={13} /><span style={{ textTransform: "capitalize" }}>{agent.triggerMode}</span></span> },
              { label: "AI Analysis", value: agent.aiAnalysis ? <span style={{ color: "#4ade80", display: "flex", alignItems: "center", gap: "0.3rem" }}><ToggleRight size={15} />Enabled</span> : <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><ToggleLeft size={15} />Disabled</span> },
              { label: "Approval Required", value: agent.approvalRequired ? <span style={{ color: "#facc15", display: "flex", alignItems: "center", gap: "0.3rem" }}><CheckCircle size={13} />Yes</span> : <span>No</span> },
              { label: "Logging Level", value: <span style={{ textTransform: "capitalize" }}>{agent.loggingLevel}</span> },
              { label: "Created", value: agent.createdAt },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>{label}</p>
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-primary)", fontFamily: "var(--font-display)", display: "flex", alignItems: "center", gap: "0.25rem" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Governance checklist */}
          <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: "var(--space-4)" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Governance Checklist
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {[
                { label: "Runtime defined", ok: !!agent.runtime },
                { label: "Trigger mode set", ok: !!agent.triggerMode },
                { label: "AI analysis configured", ok: true },
                { label: "Logging enabled", ok: agent.loggingLevel !== "basic" },
                { label: "Approval workflow", ok: agent.approvalRequired },
                { label: "Risk assessed", ok: !!agent.riskLevel },
              ].map(({ label, ok }) => (
                <span key={label} style={{
                  display: "inline-flex", alignItems: "center", gap: "0.3rem",
                  padding: "0.2rem 0.6rem", borderRadius: 99,
                  background: ok ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                  color: ok ? "#4ade80" : "#f87171",
                  fontSize: "0.6875rem", fontFamily: "var(--font-display)",
                }}>
                  {ok ? <CheckCircle size={10} /> : <X size={10} />}
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "var(--space-4)" }}>
            <button
              onClick={() => toast.info("Agent editor coming in next release.")}
              style={{
                padding: "0.4rem 0.75rem", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border-default)",
                background: "transparent", color: "var(--color-text-secondary)",
                fontFamily: "var(--font-display)", fontSize: "0.8125rem", cursor: "pointer",
              }}
            >
              Edit config
            </button>
            <button
              onClick={() => toast.info("Test run logged. Check Execution Logs.")}
              style={{
                padding: "0.4rem 0.75rem", borderRadius: "var(--radius-sm)",
                border: "none", background: "var(--color-brand)", color: "#000",
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer",
              }}
            >
              Test run
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Create agent modal ───────────────────────────────────────────────────────

function CreateAgentModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (a: AgentConfig) => void;
}) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [runtime, setRuntime] = useState<Runtime>("either");
  const [trigger, setTrigger] = useState<TriggerMode>("manual");
  const [aiAnalysis, setAiAnalysis] = useState(true);
  const [approval, setApproval] = useState(true);
  const [logLevel, setLogLevel] = useState<LogLevel>("full");
  const [saving, setSaving] = useState(false);

  function computeScore() {
    let s = 40;
    if (runtime !== "either") s += 10;
    if (aiAnalysis) s += 15;
    if (approval) s += 15;
    if (logLevel === "full") s += 15;
    else if (logLevel === "standard") s += 8;
    if (name.length > 10) s += 5;
    return Math.min(s, 100);
  }

  async function handleCreate() {
    if (!name.trim()) { toast.error("Agent name is required"); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    const agent: AgentConfig = {
      id: `ag-${Date.now()}`,
      name: name.trim(),
      purpose: purpose.trim() || "No purpose defined.",
      runtime,
      triggerMode: trigger,
      aiAnalysis,
      approvalRequired: approval,
      loggingLevel: logLevel,
      status: "draft",
      riskLevel: "medium",
      governanceScore: computeScore(),
      createdAt: new Date().toISOString().split("T")[0],
    };
    onCreate(agent);
    toast.success(`Agent "${agent.name}" created`);
    onClose();
  }

  const score = computeScore();
  const color = score >= 80 ? "#4ade80" : score >= 60 ? "#facc15" : "#f87171";

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200 }} onClick={onClose} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 201, width: "min(560px, 95vw)",
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-default)",
        borderRadius: "var(--radius-xl)",
        padding: "var(--space-6)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.125rem", color: "var(--color-text-primary)" }}>
            Create Agent Config
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: "0.75rem", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.375rem" }}>Agent Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Weekly Marketing Reporting Agent"
              style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)", background: "var(--color-bg-base)", color: "var(--color-text-primary)", fontFamily: "var(--font-display)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-brand)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-default)"; }}
            />
          </div>

          {/* Purpose */}
          <div>
            <label style={{ fontSize: "0.75rem", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.375rem" }}>Purpose / Description</label>
            <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3} placeholder="What does this agent do?"
              style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)", background: "var(--color-bg-base)", color: "var(--color-text-primary)", fontFamily: "var(--font-display)", fontSize: "0.875rem", outline: "none", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>

          {/* Runtime + Trigger */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.375rem" }}>Runtime</label>
              <select value={runtime} onChange={(e) => setRuntime(e.target.value as Runtime)}
                style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)", background: "var(--color-bg-base)", color: "var(--color-text-primary)", fontFamily: "var(--font-display)", fontSize: "0.875rem", outline: "none" }}>
                <option value="make">Make.com</option>
                <option value="n8n">n8n</option>
                <option value="internal">Internal</option>
                <option value="either">Either (auto)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.375rem" }}>Trigger Mode</label>
              <select value={trigger} onChange={(e) => setTrigger(e.target.value as TriggerMode)}
                style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)", background: "var(--color-bg-base)", color: "var(--color-text-primary)", fontFamily: "var(--font-display)", fontSize: "0.875rem", outline: "none" }}>
                <option value="manual">Manual</option>
                <option value="scheduled">Scheduled</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {[
              { label: "AI Analysis enabled", value: aiAnalysis, set: setAiAnalysis, desc: "Run LLM analysis on outputs" },
              { label: "Human approval required", value: approval, set: setApproval, desc: "Reports await approval before distribution" },
            ].map(({ label, value, set, desc }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "0.875rem", fontFamily: "var(--font-display)", fontWeight: 500, color: "var(--color-text-primary)" }}>{label}</p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>{desc}</p>
                </div>
                <button role="switch" aria-checked={value} onClick={() => set(!value)}
                  style={{ width: 40, height: 22, borderRadius: 99, background: value ? "var(--color-brand)" : "var(--color-border-default)", border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                  <span style={{ position: "absolute", top: 3, left: value ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </button>
              </div>
            ))}
          </div>

          {/* Logging level */}
          <div>
            <label style={{ fontSize: "0.75rem", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.375rem" }}>Logging Level</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["basic", "standard", "full"] as LogLevel[]).map((l) => (
                <button key={l} onClick={() => setLogLevel(l)}
                  style={{
                    flex: 1, padding: "0.5rem", borderRadius: "var(--radius-sm)", textTransform: "capitalize",
                    border: `1px solid ${logLevel === l ? "var(--color-brand)" : "var(--color-border-subtle)"}`,
                    background: logLevel === l ? "rgba(14,164,114,0.1)" : "transparent",
                    color: logLevel === l ? "var(--color-brand)" : "var(--color-text-secondary)",
                    fontFamily: "var(--font-display)", fontWeight: logLevel === l ? 600 : 400, fontSize: "0.8125rem", cursor: "pointer",
                  }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Live governance score */}
          <div style={{ background: "rgba(14,164,114,0.06)", border: "1px solid rgba(14,164,114,0.2)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Shield size={16} style={{ color: "var(--color-brand)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "0.75rem", fontFamily: "var(--font-display)", color: "var(--color-text-secondary)" }}>Governance Readiness Score</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                <div style={{ flex: 1, height: 6, borderRadius: 99, background: "var(--color-border-subtle)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 99, transition: "width 0.3s" }} />
                </div>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9375rem", color }}>{score}/100</span>
              </div>
            </div>
          </div>

          <button onClick={handleCreate} disabled={saving}
            style={{
              width: "100%", padding: "0.65rem", borderRadius: "var(--radius-md)", border: "none",
              background: "var(--color-brand)", color: "#000",
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9375rem", cursor: saving ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            }}>
            {saving && <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />}
            {saving ? "Creating…" : "Create Agent Config"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentsPage(): JSX.Element {
  const [agents, setAgents] = useState<AgentConfig[]>(DEMO_AGENTS);
  const [showCreate, setShowCreate] = useState(false);

  const activeCount = agents.filter((a) => a.status === "active").length;
  const avgScore = Math.round(agents.reduce((sum, a) => sum + a.governanceScore, 0) / (agents.length || 1));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="Agents" />

        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.375rem", color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
                  Agent Configuration Studio
                </h1>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                  Design, configure, and govern your AI agents across every runtime.
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.55rem 1rem", borderRadius: "var(--radius-md)",
                  border: "none", background: "var(--color-brand)", color: "#000",
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
                }}
              >
                <Plus size={16} /> New Agent
              </button>
            </div>

            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-4)" }}>
              {[
                { label: "Total Agents", value: agents.length, color: undefined },
                { label: "Active", value: activeCount, color: "#4ade80" },
                { label: "Avg Governance Score", value: `${avgScore}/100`, color: avgScore >= 80 ? "#4ade80" : avgScore >= 60 ? "#facc15" : "#f87171" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: "var(--space-4)" }}>
                  <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
                  <p style={{ margin: "0.2rem 0 0", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", color: color ?? "var(--color-text-primary)" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Agent list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)}
            </div>

          </div>
        </main>
      </div>

      {showCreate && (
        <CreateAgentModal
          onClose={() => setShowCreate(false)}
          onCreate={(a) => setAgents((prev) => [a, ...prev])}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
