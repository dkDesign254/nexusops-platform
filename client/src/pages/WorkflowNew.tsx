import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Activity,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Key,
  Loader2,
  Webhook,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function WorkflowNew() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [runtime, setRuntime] = useState<"make" | "n8n">("make");
  const [requestedBy, setRequestedBy] = useState(user?.name ?? "");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [makeApiKey, setMakeApiKey] = useState("");
  const [result, setResult] = useState<{ id: string; status: string } | null>(null);

  const createMutation = trpc.workflows.create.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success("Workflow created and executed successfully.");
    },
    onError: (err) => {
      toast.error(`Failed to create workflow: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedBy.trim()) {
      toast.error("Requester name is required.");
      return;
    }
    createMutation.mutate({
      runtime,
      requestedBy: requestedBy.trim(),
      webhookUrl: webhookUrl.trim() || undefined,
      makeApiKey: runtime === "make" && makeApiKey.trim() ? makeApiKey.trim() : undefined,
    });
  };

  if (result) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Workflow Executed
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Your workflow has been created, routed, and processed. The AI report is ready.
              </p>
            </div>
            <div className="w-full rounded-xl border border-border bg-card p-4 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Workflow ID</span>
                <code className="font-mono text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">
                  {result.id}
                </code>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Final Status</span>
                <span
                  className={
                    result.status === "completed"
                      ? "text-emerald-400 font-medium"
                      : "text-red-400 font-medium"
                  }
                >
                  {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Runtime</span>
                <span className="text-foreground font-medium capitalize">{runtime}</span>
              </div>
            </div>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setLocation("/")}
              >
                Back to Dashboard
              </Button>
              <Button
                className="flex-1"
                onClick={() => setLocation(`/workflows/${result.id}`)}
              >
                View Audit Trail
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            New Workflow Request
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a governed workflow execution with full audit tracing
          </p>
        </div>

        {/* Workflow type card */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
            <Activity className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Weekly Marketing Performance Reporting
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automated AI-powered analysis of weekly marketing key performance indicators — including Click-Through Rate, Return on Ad Spend, conversion rates, and channel performance.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-foreground">
              Execution Configuration
            </h3>

            {/* Requester */}
            <div className="space-y-1.5">
              <Label htmlFor="requestedBy" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Requested By
              </Label>
              <Input
                id="requestedBy"
                placeholder="Enter your name or team identifier"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                className="bg-input border-border text-sm"
                required
              />
            </div>

            {/* Runtime selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Execution Runtime
              </Label>
              <Select
                value={runtime}
                onValueChange={(v) => setRuntime(v as "make" | "n8n")}
              >
                <SelectTrigger className="bg-input border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="make">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-violet-400" />
                      <span>Make</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="n8n">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-orange-400" />
                      <span>n8n</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The external automation runtime that will execute this workflow.
              </p>
            </div>

            {/* Webhook URL */}
            <div className="space-y-1.5">
              <Label htmlFor="webhookUrl" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Outbound Webhook URL{" "}
                <span className="text-muted-foreground/60 normal-case tracking-normal font-normal">
                  (optional)
                </span>
              </Label>
              <div className="relative">
                <Webhook className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  id="webhookUrl"
                  placeholder={`https://hook.${runtime}.com/your-webhook-id`}
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="bg-input border-border text-sm pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The {runtime === "make" ? "Make" : "n8n"} webhook URL to dispatch this workflow to.
                Leave blank to run in simulation mode.
              </p>
            </div>

            {/* Make API Key — shown only for Make runtime */}
            {runtime === "make" && (
              <div className="space-y-1.5">
                <Label htmlFor="makeApiKey" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Make API Key{" "}
                  <span className="text-muted-foreground/60 normal-case tracking-normal font-normal">
                    (optional)
                  </span>
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    id="makeApiKey"
                    type="password"
                    placeholder="Enter your Make API key"
                    value={makeApiKey}
                    onChange={(e) => setMakeApiKey(e.target.value)}
                    className="bg-input border-border text-sm pl-9"
                    autoComplete="off"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Sent as the <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">x-make-apikey</code> header on the outbound webhook request.
                  Find your API key in Make under <span className="font-medium">Profile → API</span>.
                  If set as a platform secret (<code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">MAKE_API_KEY</code>), you can leave this blank.
                </p>
              </div>
            )}
          </div>

          {/* What happens next */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Execution Pipeline
            </h3>
            <div className="space-y-2.5">
              {[
                { step: "1", label: "Workflow intake & unique ID generation" },
                { step: "2", label: `Runtime routing → ${runtime.toUpperCase()}` },
                { step: "3", label: "Outbound webhook dispatch to runtime" },
                { step: "4", label: "AI-powered report generation" },
                { step: "5", label: "Central execution logging & audit trail" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                    {item.step}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full gap-2"
            disabled={createMutation.isPending}
            size="lg"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executing Workflow...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                Execute Workflow
              </>
            )}
          </Button>

          {createMutation.isPending && (
            <p className="text-xs text-muted-foreground text-center animate-pulse">
              Routing to {runtime.toUpperCase()}, generating AI report, and logging all steps...
            </p>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
}
