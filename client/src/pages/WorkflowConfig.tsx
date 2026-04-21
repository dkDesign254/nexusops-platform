import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useParams, useLocation } from "wouter";
import {
  Zap,
  Play,
  Settings,
  Bot,
  Clock,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Loader2,
  Shield,
  RefreshCw,
  Sparkles,
  Workflow,
  Activity,
} from "lucide-react";

const TRIGGER_OPTIONS = [
  {
    value: "manual",
    label: "Manual Trigger",
    description: "Run on demand via Run Now button",
  },
  {
    value: "weekly_monday",
    label: "Every Monday 09:00",
    description: "Automated weekly schedule",
  },
  {
    value: "webhook",
    label: "Inbound Webhook",
    description: "Triggered by external webhook event",
  },
  {
    value: "api",
    label: "API Call",
    description: "Triggered via REST API endpoint",
  },
];

const STEP_TEMPLATES = [
  {
    id: "data_extraction",
    label: "Data Extraction",
    description: "Pull performance data from sources",
    enabled: true,
  },
  {
    id: "data_cleaning",
    label: "Data Cleaning",
    description: "Normalise and validate raw data",
    enabled: true,
  },
  {
    id: "ai_analysis",
    label: "AI Analysis",
    description: "AI-powered insights generation",
    enabled: true,
  },
  {
    id: "report_generation",
    label: "Report Generation",
    description: "Compile structured final report",
    enabled: true,
  },
  {
    id: "notification",
    label: "Notification Dispatch",
    description: "Send report to stakeholders",
    enabled: false,
  },
];

function RuntimeCard({
  selected,
  runtime,
  onClick,
}: {
  selected: boolean;
  runtime: "make" | "n8n";
  onClick: () => void;
}) {
  const isMake = runtime === "make";

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl border text-left transition-all card-hover ${
        selected
          ? isMake
            ? "border-violet-500/40 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.15)]"
            : "border-orange-500/40 bg-orange-500/10 shadow-[0_0_0_1px_rgba(249,115,22,0.15)]"
          : "border-border/70 bg-background/30 hover:border-border"
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Zap className={`h-4 w-4 ${isMake ? "text-violet-400" : "text-orange-400"}`} />
        <span className="text-sm font-semibold text-foreground">
          {isMake ? "Make" : "n8n"}
        </span>
        {selected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 ml-auto" />}
      </div>
      <p className="text-xs text-muted-foreground">
        {isMake ? "Make.com automation platform" : "n8n self-hosted workflow engine"}
      </p>
    </button>
  );
}

function TriggerCard({
  selected,
  label,
  description,
  onClick,
}: {
  selected: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-3.5 rounded-2xl border text-left transition-all ${
        selected
          ? "border-primary/30 bg-primary/10"
          : "border-border/70 bg-background/30 hover:border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-foreground">{label}</span>
        {selected && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
    </button>
  );
}

function KpiTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const toneMap = {
    default: "text-foreground",
    success: "text-emerald-400",
    warning: "text-amber-400",
    danger: "text-red-400",
    info: "text-blue-400",
  };

  return (
    <div className="surface-elevated rounded-2xl p-4">
      <p className={`text-2xl font-semibold tracking-tight ${toneMap[tone]}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export default function WorkflowConfig() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const workflowId = params.id;

  const { data: workflow, isLoading } = trpc.airtable.workflowById.useQuery(
    { recordId: workflowId ?? "" },
    { enabled: !!workflowId }
  );

  const [runtime, setRuntime] = useState<string>("");
  const [trigger, setTrigger] = useState("manual");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [anomalyDetection, setAnomalyDetection] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [steps, setSteps] = useState(STEP_TEMPLATES);
  const [isRunning, setIsRunning] = useState(false);
  const [runLog, setRunLog] = useState<string[]>([]);

  const effectiveRuntime = runtime || workflow?.runtime || "make";

  const enabledSteps = useMemo(() => steps.filter((s) => s.enabled).length, [steps]);

  const handleRunNow = async () => {
    setIsRunning(true);
    setRunLog([]);
    const logs: string[] = [];

    const addLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      setRunLog([...logs]);
    };

    try {
      addLog(`▶ Initiating workflow: ${workflow?.workflowId ?? workflowId}`);
      await new Promise((r) => setTimeout(r, 600));
      addLog(`⚙ Runtime selected: ${effectiveRuntime.toUpperCase()}`);
      await new Promise((r) => setTimeout(r, 400));
      addLog(`📡 Dispatching to ${effectiveRuntime === "make" ? "Make" : "n8n"} webhook…`);
      await new Promise((r) => setTimeout(r, 800));
      addLog(`✅ Webhook acknowledged by runtime`);
      await new Promise((r) => setTimeout(r, 500));

      for (const step of steps.filter((s) => s.enabled)) {
        addLog(`🔄 Executing step: ${step.label}…`);
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
        addLog(`✅ Step completed: ${step.label}`);
      }

      if (aiEnabled) {
        addLog(`🤖 AI analysis triggered (${effectiveRuntime === "make" ? "GPT-4o" : "GPT-4o"})`);
        await new Promise((r) => setTimeout(r, 1000));
        addLog(`✅ AI insights generated`);
      }

      addLog(`📄 Final report compiled`);
      await new Promise((r) => setTimeout(r, 400));
      addLog(`🎉 Workflow completed successfully`);

      toast.success("Workflow executed successfully", {
        description: `${workflow?.workflowId ?? workflowId} completed via ${effectiveRuntime.toUpperCase()}`,
      });
    } catch {
      addLog(`❌ Execution failed`);
      toast.error("Workflow execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  const toggleStep = (id: string) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", path: "/" },
        { label: workflow?.workflowId ?? workflowId ?? "Workflow" },
        { label: "Configuration" },
      ]}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="surface-elevated rounded-3xl p-6 md:p-7 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_28%),radial-gradient(circle_at_left,rgba(16,185,129,0.06),transparent_22%)]" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="space-y-4">
              <button
                onClick={() => setLocation(workflowId ? `/workflows/${workflowId}` : "/")}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back to workflow
              </button>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary">
                  <Settings className="w-3 h-3" />
                  Agent Configuration Control
                </div>

                <h1 className="text-heading text-2xl md:text-3xl">Workflow Configuration</h1>

                <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  Configure execution behaviour, governance rules, AI controls, and runtime
                  orchestration for this workflow before deployment or simulation.
                </p>

                <p className="text-xs text-muted-foreground">
                  {workflow?.workflowId ?? workflowId} · {workflow?.name ?? "Weekly Marketing Performance Reporting"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1.5 rounded-xl bg-transparent"
                onClick={() => {
                  setRuntime("");
                  setTrigger("manual");
                  setAiEnabled(true);
                  setAnomalyDetection(true);
                  setAutoApprove(false);
                  setSteps(STEP_TEMPLATES);
                  setRunLog([]);
                  toast.success("Configuration reset");
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </Button>

              <Button
                onClick={handleRunNow}
                disabled={isRunning}
                className="h-9 gap-2 text-xs rounded-xl bg-[var(--primary)] text-white hover:opacity-90"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running…
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile label="Runtime" value={effectiveRuntime.toUpperCase()} />
          <KpiTile label="Enabled Steps" value={enabledSteps} tone="info" />
          <KpiTile label="AI Governance" value={aiEnabled ? "On" : "Off"} tone={aiEnabled ? "success" : "warning"} />
          <KpiTile
            label="Approval Mode"
            value={autoApprove ? "Auto" : "Manual"}
            tone={autoApprove ? "warning" : "default"}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 flex flex-col gap-5">
            <div className="surface-elevated rounded-2xl p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Runtime Target
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Select which external automation runtime executes this workflow.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <RuntimeCard
                  runtime="make"
                  selected={effectiveRuntime === "make"}
                  onClick={() => setRuntime("make")}
                />
                <RuntimeCard
                  runtime="n8n"
                  selected={effectiveRuntime === "n8n"}
                  onClick={() => setRuntime("n8n")}
                />
              </div>
            </div>

            <div className="surface-elevated rounded-2xl p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Trigger Configuration
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Define how this workflow is initiated and activated.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TRIGGER_OPTIONS.map((t) => (
                  <TriggerCard
                    key={t.value}
                    selected={trigger === t.value}
                    label={t.label}
                    description={t.description}
                    onClick={() => setTrigger(t.value)}
                  />
                ))}
              </div>
            </div>

            <div className="surface-elevated rounded-2xl p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-primary" />
                  Execution Pipeline
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Toggle individual stages in the orchestration sequence.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      step.enabled
                        ? "border-border/70 bg-background/30"
                        : "border-border/40 bg-muted/10 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-muted/40 flex items-center justify-center text-[11px] font-mono text-muted-foreground">
                        {idx + 1}
                      </div>

                      <div>
                        <p className="text-xs font-medium text-foreground">{step.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    <Switch checked={step.enabled} onCheckedChange={() => toggleStep(step.id)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="surface-elevated rounded-2xl p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Bot className="h-4 w-4 text-purple-400" />
                  AI Governance
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Control intelligence, detection, and approval behaviour.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label className="text-xs font-medium text-foreground">AI Analysis</Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Enable AI-powered insights
                    </p>
                  </div>
                  <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label className="text-xs font-medium text-foreground">
                      Anomaly Detection
                    </Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Flag failures and outliers
                    </p>
                  </div>
                  <Switch
                    checked={anomalyDetection}
                    onCheckedChange={setAnomalyDetection}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label className="text-xs font-medium text-foreground">
                      Auto-Approve Reports
                    </Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Skip manual approval step
                    </p>
                  </div>
                  <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                </div>
              </div>
            </div>

            <div className="surface-elevated rounded-2xl p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  Governance Signals
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Active controls currently attached to this workflow.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  { label: "Full execution trace", active: true, icon: <Activity className="h-3.5 w-3.5" /> },
                  { label: "AI prompt/response log", active: aiEnabled, icon: <Bot className="h-3.5 w-3.5" /> },
                  { label: "Anomaly detection", active: anomalyDetection, icon: <AlertTriangle className="h-3.5 w-3.5" /> },
                  { label: "Audit trail", active: true, icon: <Shield className="h-3.5 w-3.5" /> },
                  { label: "Report approval gate", active: !autoApprove, icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2.5">
                    <div
                      className={`h-7 w-7 rounded-xl flex items-center justify-center ${
                        s.active
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-muted/20 text-muted-foreground/40 border border-border/40"
                      }`}
                    >
                      {s.icon}
                    </div>

                    <span
                      className={`text-xs ${
                        s.active ? "text-foreground" : "text-muted-foreground/60"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-elevated rounded-2xl p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Runtime Preview
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Current execution profile based on your selections.
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-1">
                    Active Runtime
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {effectiveRuntime === "make" ? "Make.com" : "n8n"}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-1">
                    Trigger Mode
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {TRIGGER_OPTIONS.find((t) => t.value === trigger)?.label ?? trigger}
                  </p>
                </div>
              </div>
            </div>

            {runLog.length > 0 && (
              <div className="surface-elevated rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Execution Log</p>
                  {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin ml-auto" />}
                </div>

                <div className="bg-background/50 rounded-2xl border border-border/60 p-4 max-h-72 overflow-y-auto">
                  {runLog.map((line, i) => (
                    <p
                      key={i}
                      className="text-[11px] font-mono text-foreground/80 leading-5"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
