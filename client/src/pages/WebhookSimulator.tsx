import DashboardLayout from "@/components/DashboardLayout";
import { SectionHeader } from "@/components/AgentOpsUI";
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2,
  ChevronDown,
  Key,
  Loader2,
  Send,
  Terminal,
  Webhook,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type SimResult = {
  ok: boolean;
  status: number;
  body: unknown;
  runtime: string;
  timestamp: string;
};

export default function WebhookSimulator() {
  const { data: workflows } = trpc.workflows.list.useQuery();

  const [runtime, setRuntime] = useState<"make" | "n8n">("make");
  const [workflowId, setWorkflowId] = useState("");
  const [step, setStep] = useState("Data Collection");
  const [eventType, setEventType] = useState("execution");
  const [status, setStatus] = useState<"success" | "failure">("success");
  const [message, setMessage] = useState("Step completed successfully by external runtime.");
  const [makeApiKey, setMakeApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SimResult[]>([]);

  const handleSend = async () => {
    if (!workflowId.trim()) {
      toast.error("Please select or enter a Workflow ID.");
      return;
    }

    setLoading(true);
    const endpoint = `/api/webhooks/${runtime}`;
    const payload = {
      workflowId: workflowId.trim(),
      step,
      eventType,
      status,
      message,
    };

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (runtime === "make" && makeApiKey.trim()) {
        headers["x-make-apikey"] = makeApiKey.trim();
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      const result: SimResult = {
        ok: res.ok,
        status: res.status,
        body,
        runtime,
        timestamp: new Date().toLocaleTimeString(),
      };

      setResults((prev) => [result, ...prev]);

      if (res.ok) {
        toast.success(`Webhook delivered to ${runtime.toUpperCase()} endpoint. Logged.`);
      } else {
        toast.error(`Webhook failed: HTTP ${res.status}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Request failed: ${msg}`);
      setResults((prev) => [
        {
          ok: false,
          status: 0,
          body: { error: msg },
          runtime,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Webhook Simulator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Test inbound webhook delivery from Make and n8n runtimes to the central logging system
          </p>
        </div>

        {/* Endpoint info */}
        <div className="grid md:grid-cols-2 gap-3">
          {(["make", "n8n"] as const).map((rt) => (
            <div
              key={rt}
              className="rounded-xl border border-border bg-card p-4 flex items-start gap-3"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  rt === "make"
                    ? "bg-violet-500/10"
                    : "bg-orange-500/10"
                }`}
              >
                <Zap
                  className={`w-4 h-4 ${
                    rt === "make" ? "text-violet-400" : "text-orange-400"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground mb-0.5">
                  {rt === "make" ? "Make" : "n8n"} Inbound Endpoint
                </p>
                <code className="text-xs font-mono text-muted-foreground break-all">
                  POST /api/webhooks/{rt}
                </code>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-4">
            <SectionHeader title="Compose Event" />

            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              {/* Runtime */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Source Runtime
                </Label>
                <Select
                  value={runtime}
                  onValueChange={(v) => setRuntime(v as "make" | "n8n")}
                >
                  <SelectTrigger className="bg-input border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="make">Make</SelectItem>
                    <SelectItem value="n8n">n8n</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Workflow ID */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Workflow ID
                </Label>
                {workflows && workflows.length > 0 ? (
                  <Select value={workflowId} onValueChange={setWorkflowId}>
                    <SelectTrigger className="bg-input border-border text-sm">
                      <SelectValue placeholder="Select a workflow..." />
                    </SelectTrigger>
                    <SelectContent>
                      {workflows.map((wf) => (
                        <SelectItem key={wf.id} value={wf.id}>
                          <span className="font-mono text-xs">{wf.id}</span>
                          <span className="ml-2 text-muted-foreground text-xs">
                            ({wf.runtime})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Enter workflow ID manually"
                    value={workflowId}
                    onChange={(e) => setWorkflowId(e.target.value)}
                    className="bg-input border-border text-sm font-mono"
                  />
                )}
              </div>

              {/* Step */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Step Name
                </Label>
                <Input
                  value={step}
                  onChange={(e) => setStep(e.target.value)}
                  className="bg-input border-border text-sm"
                />
              </div>

              {/* Event type + status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Event Type
                  </Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger className="bg-input border-border text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "execution",
                        "webhook_received",
                        "routing",
                        "ai_call",
                        "report",
                        "error",
                        "completion",
                      ].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as "success" | "failure")}
                  >
                    <SelectTrigger className="bg-input border-border text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failure">Failure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Message
                </Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-input border-border text-sm resize-none"
                  rows={3}
                />
              </div>

              {/* Make API Key — only for Make runtime */}
              {runtime === "make" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Make API Key{" "}
                    <span className="text-muted-foreground/60 normal-case tracking-normal font-normal">(optional)</span>
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="x-make-apikey header value"
                      value={makeApiKey}
                      onChange={(e) => setMakeApiKey(e.target.value)}
                      className="bg-input border-border text-sm pl-9"
                      autoComplete="off"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sent as <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">x-make-apikey</code> header on the request.
                  </p>
                </div>
              )}

              <Button
                onClick={handleSend}
                disabled={loading}
                className="w-full gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send Webhook Event
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right: Results */}
          <div className="space-y-4">
            <SectionHeader
              title="Response Log"
              description={`${results.length} event${results.length !== 1 ? "s" : ""} sent`}
            />

            {results.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center gap-3 text-center">
                <Webhook className="w-8 h-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Send a webhook event to see the response here
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {results.map((r, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border overflow-hidden ${
                      r.ok
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-red-500/20 bg-red-500/5"
                    }`}
                  >
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        {r.ok ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                        )}
                        <span className="text-xs font-medium text-foreground">
                          HTTP {r.status} — {r.runtime.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {r.timestamp}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Terminal className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Response</span>
                      </div>
                      <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">
                        {JSON.stringify(r.body, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payload schema reference */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Expected Payload Schema
            </h3>
          </div>
          <pre className="text-xs font-mono text-foreground/70 leading-relaxed">
{`POST /api/webhooks/make  (or /api/webhooks/n8n)
Content-Type: application/json

{
  "workflowId": "string (required)",
  "step":       "string — step name",
  "eventType":  "execution | webhook_received | routing | ai_call | report | error | completion",
  "status":     "success | failure",
  "message":    "string — descriptive log message"
}`}
          </pre>
        </div>
      </div>
    </DashboardLayout>
  );
}
