import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  ArrowRight,
  Bot,
  Brain,
  ExternalLink,
  FileText,
  HelpCircle,
  Loader2,
  MessageSquareText,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
    <button onClick={onClick} className={`w-full text-left rounded-2xl border p-4 transition card-hover ${toneMap[tone]}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="p-2 rounded-2xl bg-muted/30 border border-border/50">{icon}</div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      <p className="text-[11px] text-primary mt-3 font-medium">{cta}</p>
    </button>
  );
}

function SuggestionChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-full border border-border/70 bg-muted/15 px-3 py-1.5 text-xs text-foreground hover:bg-accent/20 transition">
      {label}
    </button>
  );
}

export default function HelpPage() {
  const [, setLocation] = useLocation();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [context, setContext] = useState<ExplainContext>("overview");
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [explainStatusFilter, setExplainStatusFilter] = useState<string>("all");

  const { data: workflows = [] } = trpc.airtable.workflows.useQuery();
  const explainWorkflow = trpc.intelligence.explainWorkflow.useMutation();

  const filteredWorkflows = useMemo(
    () =>
      explainStatusFilter === "all"
        ? workflows
        : workflows.filter((w) => w.status?.toLowerCase() === explainStatusFilter),
    [workflows, explainStatusFilter]
  );

  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.recordId === selectedWorkflowId),
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

  const loadPrompt = (text: string) => {
    setAssistantPrompt(text);
    toast.success("Prompt loaded into GAIA AI.");
  };

  const handleAssistantAction = () => {
    const text = assistantPrompt.trim().toLowerCase();

    if (!text) {
      toast.error("Type a request first.");
      return;
    }

    if (text.includes("create") || text.includes("new workflow") || text.includes("build workflow") || text.includes("automation")) {
      setLocation("/workflows/new");
      return;
    }

    if (text.includes("failed") || text.includes("failures")) {
      setLocation("/logs?status=failed");
      return;
    }

    if (text.includes("pending")) {
      setLocation("/logs?status=pending");
      return;
    }

    if (text.includes("completed") || text.includes("successful")) {
      setLocation("/logs?status=completed");
      return;
    }

    if (text.includes("make")) {
      setLocation("/logs?runtime=make");
      return;
    }

    if (text.includes("n8n")) {
      setLocation("/logs?runtime=n8n");
      return;
    }

    if (text.includes("log") || text.includes("error") || text.includes("failure") || text.includes("execution")) {
      setLocation("/logs");
      return;
    }

    if (text.includes("ai") || text.includes("prompt") || text.includes("response") || text.includes("model")) {
      setLocation("/ai-logs");
      return;
    }

    if (text.includes("performance") || text.includes("campaign") || text.includes("conversion") || text.includes("spend")) {
      setLocation("/performance");
      return;
    }

    if (text.includes("report") || text.includes("summary") || text.includes("insight")) {
      setLocation("/reports");
      return;
    }

    if (text.includes("setting") || text.includes("billing") || text.includes("admin") || text.includes("role")) {
      setLocation("/settings");
      return;
    }

    toast.info("GAIA AI understood the request, but that action is not mapped yet.");
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Workspace", path: "/" }, { label: "GAIA AI" }]}> 
      <div className="max-w-[1240px] mx-auto space-y-6">
        <section className="surface-elevated rounded-3xl p-6 md:p-7 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_28%),radial-gradient(circle_at_left,rgba(16,185,129,0.06),transparent_22%)]" />
          <div className="relative space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary">
              <Sparkles className="w-3 h-3" />
              GAIA AI Product Guide
            </div>
            <div>
              <h1 className="text-heading text-2xl md:text-3xl">GAIA AI</h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">
                GAIA AI is the in-app operator guide for AgentOps. It helps users understand workflows, find the right workspace, inspect operational evidence, and move from confusion to action quickly.
              </p>
            </div>
          </div>
        </section>

        <section className="surface-elevated rounded-2xl p-6 border border-primary/15 glow-primary">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-2xl bg-primary/10 border border-primary/20">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Ask GAIA AI</p>
              <p className="text-[11px] text-muted-foreground mt-1">Tell GAIA what you want to do, and it will route you to the most relevant workspace.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
            <label className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-2 block">Ask for help</label>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                value={assistantPrompt}
                onChange={(event) => setAssistantPrompt(event.target.value)}
                placeholder="Example: show Make workflows, help me create a workflow, explain AI logs"
                className="flex-1 h-11 rounded-xl border border-border bg-background/50 px-3 text-sm text-foreground outline-none"
              />
              <Button onClick={handleAssistantAction} className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                <MessageSquareText className="w-4 h-4 mr-2" />
                Ask GAIA
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <SuggestionChip label="Help me create a workflow" onClick={() => loadPrompt("Help me create a workflow")} />
              <SuggestionChip label="Show Make workflows" onClick={() => loadPrompt("Show Make workflows")} />
              <SuggestionChip label="Show n8n workflows" onClick={() => loadPrompt("Show n8n workflows")} />
              <SuggestionChip label="Show me failed workflows" onClick={() => { setAssistantPrompt("Show me failed workflows"); setLocation("/logs?status=failed"); }} />
              <SuggestionChip label="Explain AI logs" onClick={() => loadPrompt("Explain AI logs")} />
            </div>
          </div>
        </section>

        <section className="surface-elevated rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-primary/10 border border-primary/20 shrink-0">
              <HelpCircle className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">What GAIA AI helps with</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                GAIA helps teams monitor AI-powered workflows running on Make and n8n, review execution logs, inspect AI decisions, check performance data, and apply governance where needed.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <SuggestionChip label="How do I create a workflow?" onClick={() => setLocation("/workflows/new")} />
                <SuggestionChip label="Where do I see failures?" onClick={() => setLocation("/logs")} />
                <SuggestionChip label="How do I read reports?" onClick={() => setLocation("/reports")} />
                <SuggestionChip label="How do I inspect AI output?" onClick={() => setLocation("/ai-logs")} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <HelpCard title="Create or configure a workflow" description="Start a new automation, define how it should run, and choose whether it uses Make or n8n." icon={<Workflow className="w-4 h-4 text-primary" />} onClick={() => setLocation("/workflows/new")} cta="Go to Workflow Setup" tone="info" />
          <HelpCard title="Inspect runtime and execution logs" description="Use logs when a workflow fails, behaves strangely, or needs a step-by-step trace." icon={<Activity className="w-4 h-4 text-blue-400" />} onClick={() => setLocation("/logs")} cta="Open Execution Logs" />
          <HelpCard title="Review AI-generated output" description="Inspect prompts, model outputs, and understand what AI produced during execution." icon={<Bot className="w-4 h-4 text-purple-400" />} onClick={() => setLocation("/ai-logs")} cta="Open AI Logs" />
          <HelpCard title="Check performance" description="Connect workflow activity to business results, campaign metrics, and decisions." icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} onClick={() => setLocation("/performance")} cta="Open Performance Data" tone="success" />
          <HelpCard title="Read reports" description="Review executive summaries, insights, anomalies, and recommendations." icon={<FileText className="w-4 h-4 text-amber-400" />} onClick={() => setLocation("/reports")} cta="Open Reports" tone="warning" />
          <HelpCard title="Manage settings" description="Review billing, access control, and administrative configuration." icon={<Settings className="w-4 h-4 text-red-400" />} onClick={() => setLocation("/settings")} cta="Open Settings" />
        </section>

        <section className="surface-elevated rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-2xl bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Explain a workflow with GAIA</p>
              <p className="text-[11px] text-muted-foreground mt-1">Use the existing explainer to make a workflow easier to understand.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[0.7fr_1.2fr_0.9fr_auto] gap-3 mb-4">
            <div>
              <label className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-1.5 block">Filter by status</label>
              <select value={explainStatusFilter} onChange={(event) => { setExplainStatusFilter(event.target.value); setSelectedWorkflowId(""); }} className="w-full h-10 rounded-xl border border-border bg-background/50 text-sm px-3 text-foreground outline-none">
                <option value="all">All statuses</option>
                <option value="failed">Failed</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-1.5 block">Workflow</label>
              <select value={selectedWorkflowId} onChange={(event) => setSelectedWorkflowId(event.target.value)} className="w-full h-10 rounded-xl border border-border bg-background/50 text-sm px-3 text-foreground outline-none">
                <option value="">Select a workflow…</option>
                {filteredWorkflows.map((workflow) => (
                  <option key={workflow.recordId} value={workflow.recordId}>{workflow.workflowId} — {workflow.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-1.5 block">Explain focus</label>
              <select value={context} onChange={(event) => setContext(event.target.value as ExplainContext)} className="w-full h-10 rounded-xl border border-border bg-background/50 text-sm px-3 text-foreground outline-none">
                <option value="overview">Overview</option>
                <option value="errors">Errors</option>
                <option value="performance">Performance</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button onClick={runExplain} disabled={!selectedWorkflow || explainWorkflow.isPending} className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                {explainWorkflow.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Explaining…</> : <><Sparkles className="w-4 h-4 mr-2" />Explain</>}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/10 p-4 min-h-[140px]">
            {!selectedWorkflow && !explainWorkflow.data && (
              <div className="text-center py-6">
                <p className="text-sm font-medium text-foreground">Select a workflow to begin</p>
                <p className="text-xs text-muted-foreground mt-1">GAIA will explain what it does, what may be wrong, or how to read its performance.</p>
              </div>
            )}
            {selectedWorkflow && !explainWorkflow.data && !explainWorkflow.isPending && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Ready to explain:</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="code-inline">{selectedWorkflow.workflowId}</span>
                  <span className="text-xs text-muted-foreground">{selectedWorkflow.name}</span>
                  <span className="text-xs text-muted-foreground">· {selectedWorkflow.runtime}</span>
                  <span className="text-xs text-muted-foreground">· {selectedWorkflow.status}</span>
                </div>
              </div>
            )}
            {explainWorkflow.data && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">GAIA explanation</p>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {typeof explainWorkflow.data.explanation === "string" ? explainWorkflow.data.explanation : JSON.stringify(explainWorkflow.data.explanation, null, 2)}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
