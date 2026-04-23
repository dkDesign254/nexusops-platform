import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  ExternalLink,
  FileText,
  HelpCircle,
  Loader2,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

type ExplainContext = "overview" | "errors" | "performance";

function HelpCard({
  title,
  description,
  icon,
  onClick,
  cta,
  tone = "default",
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  cta: string;
  tone?: "default" | "info" | "success" | "warning";
}) {
  const toneMap = {
    default: "border-border/70 bg-background/30 hover:bg-accent/20",
    info: "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10",
    success: "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10",
    warning: "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition card-hover ${toneMap[tone]}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="p-2 rounded-2xl bg-muted/30 border border-border/50">
          {icon}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
      </div>

      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
        {description}
      </p>
      <p className="text-[11px] text-primary mt-3 font-medium">{cta}</p>
    </button>
  );
}

function SuggestionChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-border/70 bg-muted/15 px-3 py-1.5 text-xs text-foreground hover:bg-accent/20 transition"
    >
      {label}
    </button>
  );
}

export default function HelpPage() {
  const [, setLocation] = useLocation();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [context, setContext] = useState<ExplainContext>("overview");

  const { data: workflows = [], isLoading: workflowsLoading } =
    trpc.airtable.workflows.useQuery();

  const explainWorkflow = trpc.intelligence.explainWorkflow.useMutation();

  const selectedWorkflow = useMemo(
    () => workflows.find((w) => w.recordId === selectedWorkflowId),
    [workflows, selectedWorkflowId]
  );

  const runExplain = async () => {
    if (!selectedWorkflow) return;

    await explainWorkflow.mutateAsync({
      workflowId: selectedWorkflow.workflowId,
      workflowName: selectedWorkflow.name,
      runtime: selectedWorkflow.runtime,
      status: selectedWorkflow.status,
      context,
    });
  };

  return (
    <DashboardLayout
      breadcrumbs={[{ label: "Dashboard", path: "/" }, { label: "AI Help" }]}
    >
      <div className="max-w-[1240px] mx-auto space-y-6">
        <div className="surface-elevated rounded-3xl p-6 md:p-7 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_28%),radial-gradient(circle_at_left,rgba(16,185,129,0.06),transparent_22%)]" />
          <div className="relative space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary">
              <Sparkles className="w-3 h-3" />
              AI Product Guide
            </div>

            <div>
              <h1 className="text-heading text-2xl md:text-3xl">AI Help</h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">
                This page explains what the platform does, where to go next, and
                helps you understand workflows without forcing you to learn the whole
                system at once. Think of it as your in-app operator guide.
              </p>
            </div>
          </div>
        </div>

        <div className="surface-elevated rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-primary/10 border border-primary/20 shrink-0">
              <HelpCircle className="w-4 h-4 text-primary" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                What this app is for
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                AgentOps helps a team monitor AI-powered workflows running on Make and
                n8n, review execution logs, inspect AI decisions, check performance
                data, and apply governance where needed. It is designed to help users
                work confidently without needing deep technical knowledge first.
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <SuggestionChip
                  label="How do I create a workflow?"
                  onClick={() => setLocation("/workflows/new")}
                />
                <SuggestionChip
                  label="Where do I see failures?"
                  onClick={() => setLocation("/logs")}
                />
                <SuggestionChip
                  label="How do I read reports?"
                  onClick={() => setLocation("/reports")}
                />
                <SuggestionChip
                  label="How do I inspect AI output?"
                  onClick={() => setLocation("/ai-logs")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <HelpCard
            title="Create or configure a workflow"
            description="Use this when you want to start a new automation, define how it should run, and choose whether it uses Make or n8n."
            icon={<Workflow className="w-4 h-4 text-primary" />}
            onClick={() => setLocation("/workflows/new")}
            cta="Go to Workflow Setup"
            tone="info"
          />

          <HelpCard
            title="Inspect runtime and execution logs"
            description="Use logs when a workflow fails, behaves strangely, or when you want a step-by-step trace of what happened."
            icon={<Activity className="w-4 h-4 text-blue-400" />}
            onClick={() => setLocation("/logs")}
            cta="Open Execution Logs"
            tone="default"
          />

          <HelpCard
            title="Review AI-generated output"
            description="Use AI Logs to inspect prompts, model outputs, and understand what the AI produced during report or workflow execution."
            icon={<Bot className="w-4 h-4 text-purple-400" />}
            onClick={() => setLocation("/ai-logs")}
            cta="Open AI Logs"
            tone="default"
          />

          <HelpCard
            title="Check campaign or business performance"
            description="Use this when you want to connect workflow activity to campaign results, impressions, clicks, conversions, or spend."
            icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
            onClick={() => setLocation("/performance")}
            cta="Open Performance Data"
            tone="success"
          />

          <HelpCard
            title="Read the final reports"
            description="Use reports when you want the executive summary, insights, anomalies, and recommendations generated for a workflow."
            icon={<FileText className="w-4 h-4 text-amber-400" />}
            onClick={() => setLocation("/reports")}
            cta="Open Reports"
            tone="warning"
          />

          <HelpCard
            title="Manage settings and governance controls"
            description="Use settings to review billing, access control, and administrative platform configuration."
            icon={<Settings className="w-4 h-4 text-red-400" />}
            onClick={() => setLocation("/settings")}
            cta="Open Settings"
            tone="default"
          />
        </div>

        <div className="surface-elevated rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-2xl bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Explain a workflow for me
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                This uses the existing AI explainer to make a workflow easier to understand.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr_auto] gap-3 mb-4">
            <div>
              <label className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-1.5 block">
                Workflow
              </label>
              <select
                value={selectedWorkflowId}
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background/50 text-sm px-3 text-foreground outline-none"
              >
                <option value="">Select a workflow…</option>
                {workflows.map((wf) => (
                  <option key={wf.recordId} value={wf.recordId}>
                    {wf.workflowId} — {wf.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-1.5 block">
                Explain focus
              </label>
              <select
                value={context}
                onChange={(e) => setContext(e.target.value as ExplainContext)}
                className="w-full h-10 rounded-xl border border-border bg-background/50 text-sm px-3 text-foreground outline-none"
              >
                <option value="overview">Overview</option>
                <option value="errors">Errors</option>
                <option value="performance">Performance</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={runExplain}
                disabled={!selectedWorkflow || explainWorkflow.isPending}
                className="h-10 rounded-xl bg-[var(--primary)] text-white hover:opacity-90"
              >
                {explainWorkflow.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Explaining…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Explain
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/10 p-4 min-h-[140px]">
            {!selectedWorkflow && !explainWorkflow.data && (
              <div className="text-center py-6">
                <p className="text-sm font-medium text-foreground">
                  Select a workflow to begin
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  The assistant will explain what it does, what may be wrong, or how to read its performance.
                </p>
              </div>
            )}

            {selectedWorkflow && !explainWorkflow.data && !explainWorkflow.isPending && (
              <div className="text-left">
                <p className="text-xs font-semibold text-foreground mb-2">
                  Ready to explain:
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="code-inline">{selectedWorkflow.workflowId}</span>
                  <span className="text-xs text-muted-foreground">
                    {selectedWorkflow.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {selectedWorkflow.runtime}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {selectedWorkflow.status}
                  </span>
                </div>
              </div>
            )}

            {explainWorkflow.data && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  AI explanation
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {typeof explainWorkflow.data.explanation === "string"
                    ? explainWorkflow.data.explanation
                    : JSON.stringify(explainWorkflow.data.explanation, null, 2)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="surface-elevated rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-emerald-400" />
            <p className="text-sm font-semibold text-foreground">
              Suggested first path for a new user
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-border/70 bg-background/30 p-4">
              <p className="text-xs font-semibold text-foreground mb-1">
                Step 1
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Start on the dashboard and review the current workflows and alerts.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/30 p-4">
              <p className="text-xs font-semibold text-foreground mb-1">
                Step 2
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Open the execution logs to understand what the system records.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/30 p-4">
              <p className="text-xs font-semibold text-foreground mb-1">
                Step 3
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Inspect AI Logs to see how prompts and responses are captured.
              </p>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
              <p className="text-xs font-semibold text-foreground mb-1">
                Step 4
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Create or configure a workflow when you are ready to operate.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              onClick={() => setLocation("/workflows/new")}
              className="rounded-xl bg-[var(--primary)] text-white hover:opacity-90"
            >
              <Workflow className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>

            <Button
              variant="outline"
              onClick={() => setLocation("/logs")}
              className="rounded-xl bg-transparent"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Logs
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
