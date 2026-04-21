import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Cpu,
  MessageSquare,
  Sparkles,
  DollarSign,
  Clock,
  Copy,
  ExternalLink,
  AlertCircle,
  Shield,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

function fmtTimestamp(ts: string | null): string {
  if (!ts || ts === "None") return "—";
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

interface AILog {
  recordId: string;
  logId: string;
  workflowRecordIds: string[];
  promptText: string;
  responseText: string;
  modelUsed: string;
  timestamp: string | null;
  costNotes: string | null;
}

function MetricCard({
  label,
  value,
  icon,
  valueClassName,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="surface-elevated rounded-2xl p-4 flex items-center gap-3 card-hover">
      <div className="h-10 w-10 rounded-2xl bg-muted/40 ring-1 ring-border/50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-semibold tracking-tight ${valueClassName ?? "text-foreground"}`}>
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function AILogCard({ log }: { log: AILog }) {
  const [expanded, setExpanded] = useState(false);
  const [, setLocation] = useLocation();

  const displayId =
    log.logId && !log.logId.startsWith("rec") ? log.logId : "—";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="surface-elevated rounded-2xl border border-border/70 overflow-hidden card-hover animate-in">
      <div
        className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none bg-muted/10"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 h-10 w-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center ring-1 ring-purple-500/10">
            <Bot className="h-4.5 w-4.5 text-purple-400" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {displayId !== "—" && (
                <code className="text-[11px] font-mono text-primary/80 bg-primary/5 px-2 py-1 rounded-lg">
                  {displayId}
                </code>
              )}

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Cpu className="h-3 w-3" />
                {log.modelUsed !== "—" ? log.modelUsed : "Unknown model"}
              </span>

              {log.costNotes && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <DollarSign className="h-3 w-3" />
                  {log.costNotes}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground truncate max-w-[560px]">
              {log.promptText
                ? `${log.promptText.slice(0, 140)}${log.promptText.length > 140 ? "…" : ""}`
                : "No prompt text recorded"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {log.timestamp && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono whitespace-nowrap">
              <Clock className="h-3 w-3" />
              {fmtTimestamp(log.timestamp)}
            </span>
          )}

          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl">
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/60">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 divide-y xl:divide-y-0 xl:divide-x divide-border/60">
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-[0.16em]">
                    Prompt sent to AI
                  </span>
                </div>

                {log.promptText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground rounded-xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(log.promptText, "Prompt");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                )}
              </div>

              <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs text-foreground/85 whitespace-pre-wrap font-mono leading-relaxed">
                  {log.promptText || "No prompt text recorded"}
                </pre>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-[0.16em]">
                    AI response
                  </span>
                </div>

                {log.responseText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground rounded-xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(log.responseText, "Response");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                )}
              </div>

              <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs text-foreground/85 whitespace-pre-wrap font-mono leading-relaxed">
                  {log.responseText || "No response text recorded"}
                </pre>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-border/40 flex items-center gap-4 flex-wrap bg-muted/10">
            <div>
              <span className="text-[11px] text-muted-foreground">Record ID: </span>
              <code className="text-[11px] font-mono text-muted-foreground">
                {log.recordId}
              </code>
            </div>

            {log.workflowRecordIds[0] && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] gap-1 text-primary hover:text-primary rounded-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation(`/workflows/${log.workflowRecordIds[0]}`);
                }}
              >
                <ExternalLink className="h-3 w-3" />
                View workflow
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AILogsPage() {
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: rawLogs = [], isLoading, refetch } = trpc.airtable.aiLogs.useQuery({});

  const logs = useMemo(
    () =>
      rawLogs.filter(
        (l) => l.promptText.trim() !== "" || (l.timestamp && l.timestamp !== "None")
      ),
    [rawLogs]
  );

  const uniqueModels = useMemo(
    () => Array.from(new Set(logs.map((l) => l.modelUsed))).filter((m) => m !== "—"),
    [logs]
  );

  const filtered = useMemo(() => {
    let result = [...logs];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.logId.toLowerCase().includes(q) ||
          l.promptText.toLowerCase().includes(q) ||
          l.responseText.toLowerCase().includes(q) ||
          l.modelUsed.toLowerCase().includes(q)
      );
    }

    if (modelFilter !== "all") {
      result = result.filter((l) => l.modelUsed === modelFilter);
    }

    result.sort((a, b) => {
      const ta = a.timestamp ?? "";
      const tb = b.timestamp ?? "";
      return sortDir === "desc" ? tb.localeCompare(ta) : ta.localeCompare(tb);
    });

    return result;
  }, [logs, search, modelFilter, sortDir]);

  const stats = useMemo(() => {
    const total = logs.length;
    const models = Array.from(new Set(logs.map((l) => l.modelUsed))).filter(
      (m) => m !== "—"
    ).length;
    const withCost = logs.filter((l) => l.costNotes).length;
    const skipped = rawLogs.length - logs.length;
    return { total, models, withCost, skipped };
  }, [logs, rawLogs]);

  return (
    <DashboardLayout
      breadcrumbs={[{ label: "Dashboard", path: "/" }, { label: "AI Logs" }]}
    >
      <div className="max-w-[1280px] mx-auto space-y-6">
        <div className="surface-elevated rounded-3xl p-6 md:p-7 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_28%),radial-gradient(circle_at_left,rgba(99,102,241,0.06),transparent_22%)]" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-[11px] font-medium text-purple-400">
                <Sparkles className="w-3 h-3" />
                AI Governance Audit Trail
              </div>

              <div>
                <h1 className="text-heading text-2xl md:text-3xl">AI Interaction Logs</h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                  Complete record of every AI prompt, response, and model selection —
                  built for traceability, compliance review, and operational confidence.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                <Shield className="w-3.5 h-3.5" />
                <span>Immutable AI audit trail</span>
                <span className="opacity-40">•</span>
                <span>Incomplete records excluded from this view</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2 h-9 text-xs rounded-xl bg-transparent self-start lg:self-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total AI Calls"
            value={stats.total}
            icon={<Bot className="h-4 w-4 text-purple-400" />}
            valueClassName="text-purple-400"
          />
          <MetricCard
            label="Distinct Models"
            value={stats.models}
            icon={<Cpu className="h-4 w-4 text-blue-400" />}
            valueClassName="text-blue-400"
          />
          <MetricCard
            label="With Cost Notes"
            value={stats.withCost}
            icon={<DollarSign className="h-4 w-4 text-amber-400" />}
            valueClassName="text-amber-400"
          />
          <MetricCard
            label="Filtered Out"
            value={stats.skipped}
            icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        <div className="surface-elevated rounded-2xl p-4 md:p-5">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search prompts, responses, model names…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-sm bg-background/50 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/30 border border-border">
              <Cpu className="h-3.5 w-3.5 text-muted-foreground ml-2" />
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="h-8 bg-transparent text-xs text-foreground outline-none px-2 min-w-[180px]"
              >
                <option value="all">All Models</option>
                {uniqueModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              className="h-9 text-xs gap-1 rounded-xl"
            >
              <ArrowUpDown className="h-3 w-3" />
              {sortDir === "desc" ? "Newest first" : "Oldest first"}
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-3 px-4 py-4 rounded-2xl bg-purple-500/5 border border-purple-500/15 surface-elevated">
          <Sparkles className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-purple-300">AI Governance Notice</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Every AI interaction is recorded as an audit event. Expand any entry to inspect
              the complete prompt and full response output exactly as captured during runtime.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {logs.length} interactions
              {stats.skipped > 0 && (
                <span className="ml-2 text-muted-foreground/60">
                  · {stats.skipped} incomplete {stats.skipped === 1 ? "record" : "records"} hidden
                </span>
              )}
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="surface-elevated rounded-2xl py-20 flex flex-col items-center justify-center text-center">
              <Bot className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No AI interactions found
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {search || modelFilter !== "all"
                  ? "Try adjusting your filters"
                  : "AI interactions will appear here once workflows run"}
              </p>
            </div>
          ) : (
            filtered.map((log) => <AILogCard key={log.recordId} log={log} />)
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
