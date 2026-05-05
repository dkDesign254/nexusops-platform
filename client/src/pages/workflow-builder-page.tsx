/**
 * NexusOps — WorkflowBuilderPage
 * Route: /builder (protected)
 *
 * Phase 16: Text-to-workflow builder.
 * User describes a workflow in natural language → GAIA parses it into
 * a structured step list → user can review, edit steps, and register
 * the workflow into NexusOps governance.
 */
import { useState, useCallback } from "react";
import { MobileSidebar, Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Sparkles, Wand2, Plus, Trash2, ChevronDown, ChevronUp, Save, RefreshCw, AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StepStatus = "pending" | "success" | "failed" | "skipped";
type Runtime = "make" | "n8n" | "custom" | "manual";

interface WorkflowStep {
  id: string;
  name: string;
  eventType: string;
  runtime: Runtime;
  expectedStatus: StepStatus;
  description: string;
}

const RUNTIME_COLORS: Record<Runtime, string> = {
  make: "#ff6b35",
  n8n: "#ea4e9d",
  custom: "#0ea472",
  manual: "#a78bfa",
};

const EXAMPLE_PROMPTS = [
  "Every Monday, pull last week's Google Ads and Meta campaign data, generate an AI performance summary, flag anomalies, and email the report to the marketing team.",
  "When a new lead is added to HubSpot, check if their company is in our ICP list, score them using our AI model, and route high-scores to the SDR Slack channel.",
  "Daily at 9am, crawl our top 5 competitor landing pages, summarise any changes using AI, and create a Notion page with the diff report.",
];

// ─── Step Card ────────────────────────────────────────────────────────────────

function StepCard({
  step,
  index,
  onUpdate,
  onRemove,
}: {
  step: WorkflowStep;
  index: number;
  onUpdate: (id: string, patch: Partial<WorkflowStep>) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = RUNTIME_COLORS[step.runtime] ?? "var(--color-brand)";

  return (
    <div
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderLeft: `3px solid ${color}`,
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem var(--space-4)" }}>
        {/* Step number */}
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.625rem", fontWeight: 700, color: "#fff", flexShrink: 0, fontFamily: "var(--font-display)" }}>
          {index + 1}
        </span>

        {/* Name */}
        <input
          value={step.name}
          onChange={(e) => onUpdate(step.id, { name: e.target.value })}
          style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)", minWidth: 0 }}
        />

        {/* Runtime selector */}
        <select
          value={step.runtime}
          onChange={(e) => onUpdate(step.id, { runtime: e.target.value as Runtime })}
          style={{ padding: "0.2rem 0.5rem", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-sm)", color: color, fontFamily: "var(--font-display)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
        >
          <option value="make">Make</option>
          <option value="n8n">n8n</option>
          <option value="custom">Custom</option>
          <option value="manual">Manual</option>
        </select>

        {/* Event type */}
        <input
          value={step.eventType}
          onChange={(e) => onUpdate(step.id, { eventType: e.target.value })}
          placeholder="event type"
          style={{ width: 100, padding: "0.2rem 0.5rem", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", fontSize: "0.75rem", outline: "none" }}
        />

        {/* Actions */}
        <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", padding: "0.25rem" }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button onClick={() => onRemove(step.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", padding: "0.25rem" }}>
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid var(--color-border-subtle)", padding: "0.75rem var(--space-4)" }}>
          <textarea
            value={step.description}
            onChange={(e) => onUpdate(step.id, { description: e.target.value })}
            rows={2}
            placeholder="Step description…"
            style={{ width: "100%", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-sm)", padding: "0.5rem 0.75rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", fontSize: "0.8125rem", resize: "vertical", outline: "none", boxSizing: "border-box" }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function WorkflowBuilderPage(): JSX.Element {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [workflowName, setWorkflowName] = useState("");
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gaiaMutation = trpc.gaia.chat.useMutation();

  const parseWithGaia = useCallback(async () => {
    if (!prompt.trim()) { toast.error("Please describe your workflow first"); return; }
    setParsing(true);
    setError(null);

    try {
      const result = await gaiaMutation.mutateAsync({
        messages: [
          {
            role: "system" as const,
            content: "You are a workflow architect. Parse workflow descriptions into structured JSON. Respond ONLY with valid JSON — no markdown, no explanation.",
          },
          {
            role: "user" as const,
            content: `Parse the following workflow description into a JSON array of steps. Each step must have: name (string), eventType (string, one of: intake, routing, execution, ai_call, report, notification, completion), runtime (one of: make, n8n, custom, manual), and description (string, 1 sentence). Also extract a workflowName (string). Respond ONLY with valid JSON in this format: {"workflowName":"...","steps":[{"name":"...","eventType":"...","runtime":"...","description":"..."}]}.\n\nWorkflow description: "${prompt.trim()}"`,
          },
        ],
      });

      // Try to parse the JSON from the response
      const text = result.text ?? "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("GAIA did not return valid JSON");

      const parsed = JSON.parse(jsonMatch[0]) as {
        workflowName?: string;
        steps?: Array<{ name: string; eventType: string; runtime: string; description: string }>;
      };

      if (!parsed.steps?.length) throw new Error("No steps found in GAIA response");

      setWorkflowName(parsed.workflowName ?? "Unnamed Workflow");
      setSteps(
        parsed.steps.map((s) => ({
          id: uid(),
          name: s.name,
          eventType: s.eventType ?? "execution",
          runtime: (["make", "n8n", "custom", "manual"].includes(s.runtime) ? s.runtime : "custom") as Runtime,
          expectedStatus: "pending",
          description: s.description,
        }))
      );
      toast.success(`${parsed.steps.length} steps parsed from your description`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Parse failed";
      setError(msg);
      toast.error("Could not parse workflow — try rephrasing");
    } finally {
      setParsing(false);
    }
  }, [prompt, gaiaMutation]);

  function addStep(): void {
    setSteps((prev) => [...prev, {
      id: uid(),
      name: `Step ${prev.length + 1}`,
      eventType: "execution",
      runtime: "custom",
      expectedStatus: "pending",
      description: "",
    }]);
  }

  function updateStep(id: string, patch: Partial<WorkflowStep>): void {
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
  }

  function removeStep(id: string): void {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  async function saveWorkflow(): Promise<void> {
    if (!workflowName.trim()) { toast.error("Please give the workflow a name"); return; }
    if (steps.length === 0) { toast.error("Add at least one step"); return; }
    setSaving(true);
    // Simulate saving — replace with trpc.workflows.create mutation when server-side is ready
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Workflow registered in NexusOps governance");
  }

  const governanceScore = Math.min(100, 40 +
    (workflowName.length > 5 ? 5 : 0) +
    (steps.length >= 3 ? 15 : steps.length * 5) +
    (steps.some((s) => s.eventType === "ai_call") ? 20 : 0) +
    (steps.some((s) => s.eventType === "completion") ? 10 : 0) +
    (steps.some((s) => s.eventType === "report") ? 10 : 0)
  );

  const scoreColor = governanceScore >= 80 ? "#4ade80" : governanceScore >= 60 ? "#facc15" : "#f87171";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <MobileSidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="Workflow Builder" onMobileMenuOpen={() => setMobileNavOpen(true)} />
        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

            {/* Header */}
            <div>
              <h1 style={{ margin: "0 0 0.375rem", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.5rem", color: "var(--color-text-primary)" }}>
                Text-to-Workflow Builder
              </h1>
              <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
                Describe your workflow in plain English. GAIA will parse it into governed, traceable steps.
              </p>
            </div>

            {/* Prompt input */}
            <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: "var(--space-5)" }}>
              <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)", marginBottom: "var(--space-3)" }}>
                Describe your workflow
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="e.g. Every Monday, pull Google Ads data, run an AI analysis, and email a report to the marketing team…"
                style={{ width: "100%", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", color: "var(--color-text-primary)", fontFamily: "var(--font-body)", fontSize: "0.9rem", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }}
              />

              {/* Example prompts */}
              <div style={{ marginTop: "var(--space-3)", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", alignSelf: "center" }}>Examples:</span>
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(ex)}
                    style={{ padding: "0.25rem 0.625rem", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-full)", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", fontSize: "0.6875rem", cursor: "pointer", textAlign: "left", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {ex.slice(0, 60)}…
                  </button>
                ))}
              </div>

              <div style={{ marginTop: "var(--space-3)", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <button
                  onClick={() => void parseWithGaia()}
                  disabled={parsing || !prompt.trim()}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: parsing ? "rgba(61,255,160,0.1)" : "var(--color-brand)", border: "none", borderRadius: "var(--radius-md)", color: parsing ? "var(--color-brand)" : "var(--color-bg-base)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", cursor: parsing ? "not-allowed" : "pointer" }}
                >
                  {parsing ? <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Wand2 size={15} />}
                  {parsing ? "Parsing…" : "Parse with GAIA"}
                </button>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
                  <Sparkles size={12} style={{ display: "inline", marginRight: 4, color: "var(--color-brand)" }} />
                  Powered by GAIA AI
                </span>
              </div>

              {error && (
                <div style={{ marginTop: "var(--space-3)", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius-sm)" }}>
                  <AlertCircle size={14} style={{ color: "#f87171", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.8125rem", color: "#f87171", fontFamily: "var(--font-body)" }}>{error}</span>
                </div>
              )}
            </div>

            {/* Parsed steps */}
            {steps.length > 0 && (
              <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: "var(--space-5)" }}>
                {/* Workflow name */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                  <input
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="Workflow name"
                    style={{ flex: 1, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.875rem", color: "var(--color-text-primary)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", outline: "none" }}
                  />

                  {/* Governance score */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.875rem", background: "var(--color-bg-elevated)", border: `1px solid ${scoreColor}40`, borderRadius: "var(--radius-md)", flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>Governance Score</span>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: scoreColor }}>{governanceScore}</span>
                  </div>
                </div>

                {/* Step list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "var(--space-4)" }}>
                  {steps.map((step, i) => (
                    <StepCard key={step.id} step={step} index={i} onUpdate={updateStep} onRemove={removeStep} />
                  ))}
                </div>

                {/* Add step / Save */}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={addStep}
                    style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", background: "transparent", border: "1px dashed var(--color-border-default)", borderRadius: "var(--radius-md)", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", fontSize: "0.8125rem", cursor: "pointer" }}
                  >
                    <Plus size={14} />
                    Add step
                  </button>
                  <button
                    onClick={() => void saveWorkflow()}
                    disabled={saving}
                    style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 1.25rem", background: "var(--color-brand)", border: "none", borderRadius: "var(--radius-md)", color: "var(--color-bg-base)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, marginLeft: "auto" }}
                  >
                    <Save size={14} />
                    {saving ? "Saving…" : "Register Workflow"}
                  </button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {steps.length === 0 && !parsing && (
              <div style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)" }}>
                <Wand2 size={32} style={{ margin: "0 auto var(--space-3)", opacity: 0.4 }} />
                <p style={{ margin: "0 0 0.375rem", fontSize: "0.9375rem" }}>No steps yet</p>
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
                  Describe your workflow above and click "Parse with GAIA" to get started.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
