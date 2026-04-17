import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

function fmtTimestamp(ts: string | null): string {
  if (!ts || ts === "None") return "—";
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
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

function AILogCard({ log }: { log: AILog }) {
  const [expanded, setExpanded] = useState(false);
  const [, setLocation] = useLocation();

  // Display a clean log ID — if it's a raw Airtable record ID (starts with "rec"), show "—"
  const displayId = log.logId && !log.logId.startsWith("rec") ? log.logId : "—";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Card className="bg-card/50 border-border/60 hover:border-border transition-colors">
      <CardContent className="p-0">
        {/* Header row */}
        <div
          className="flex items-center justify-between gap-4 px-5 py-3.5 cursor-pointer select-none"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-purple-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                {displayId !== "—" && (
                  <code className="text-[11px] font-mono text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded">
                    {displayId}
                  </code>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Cpu className="h-3 w-3" />
                  {log.modelUsed !== "—" ? log.modelUsed : "Unknown model"}
                </span>
                {log.costNotes && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <DollarSign className="h-3 w-3" />
                    {log.costNotes}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[500px]">
                {log.promptText ? `${log.promptText.slice(0, 120)}${log.promptText.length > 120 ? "…" : ""}` : "No prompt text recorded"}
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
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Expanded trace */}
        {expanded && (
          <div className="border-t border-border/60">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border/60">
              {/* Prompt */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Prompt sent to AI</span>
                  </div>
                  {log.promptText && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(log.promptText, "Prompt"); }}
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                  )}
                </div>
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4 max-h-80 overflow-y-auto">
                  <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-mono leading-relaxed">
                    {log.promptText || "No prompt text recorded"}
                  </pre>
                </div>
              </div>
              {/* Response */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">AI response</span>
                  </div>
                  {log.responseText && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(log.responseText, "Response"); }}
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                  )}
                </div>
                <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-4 max-h-80 overflow-y-auto">
                  <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-mono leading-relaxed">
                    {log.responseText || "No response text recorded"}
                  </pre>
                </div>
              </div>
            </div>
            {/* Footer metadata */}
            <div className="px-5 py-3 border-t border-border/40 flex items-center gap-4 flex-wrap bg-muted/10">
              <div>
                <span className="text-[11px] text-muted-foreground">Record ID: </span>
                <code className="text-[11px] font-mono text-muted-foreground">{log.recordId}</code>
              </div>
              {log.workflowRecordIds[0] && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] gap-1 text-primary hover:text-primary"
                  onClick={(e) => { e.stopPropagation(); setLocation(`/workflows/${log.workflowRecordIds[0]}`); }}
                >
                  <ExternalLink className="h-3 w-3" /> View workflow
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AILogsPage() {
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: rawLogs = [], isLoading, refetch } = trpc.airtable.aiLogs.useQuery({});

  // Filter out empty/placeholder records — must have at least a promptText or a timestamp
  const logs = useMemo(
    () => rawLogs.filter((l) => l.promptText.trim() !== "" || (l.timestamp && l.timestamp !== "None")),
    [rawLogs]
  );

  const uniqueModels = useMemo(() => Array.from(new Set(logs.map((l) => l.modelUsed))).filter((m) => m !== "—"), [logs]);

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
    if (modelFilter !== "all") result = result.filter((l) => l.modelUsed === modelFilter);
    result.sort((a, b) => {
      const ta = a.timestamp ?? "";
      const tb = b.timestamp ?? "";
      return sortDir === "desc" ? tb.localeCompare(ta) : ta.localeCompare(tb);
    });
    return result;
  }, [logs, search, modelFilter, sortDir]);

  const stats = useMemo(() => {
    const total = logs.length;
    const models = Array.from(new Set(logs.map((l) => l.modelUsed))).filter((m) => m !== "—").length;
    const withCost = logs.filter((l) => l.costNotes).length;
    const skipped = rawLogs.length - logs.length;
    return { total, models, withCost, skipped };
  }, [logs, rawLogs]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bot className="h-5 w-5 text-purple-400" />
              <h1 className="text-xl font-semibold tracking-tight">AI Interaction Logs</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Complete audit trail of every AI prompt and response — full traceability for governance and compliance
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 h-8 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total AI Calls", value: stats.total, icon: Bot, color: "text-purple-400" },
            { label: "Distinct Models", value: stats.models, icon: Cpu, color: "text-blue-400" },
            { label: "With Cost Notes", value: stats.withCost, icon: DollarSign, color: "text-amber-400" },
            { label: "Filtered Out", value: stats.skipped, icon: AlertCircle, color: "text-muted-foreground" },
          ].map((s) => (
            <Card key={s.label} className="bg-card/50 border-border/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="bg-card/50 border-border/60">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search prompts, responses, model names…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8 text-sm bg-background/50"
                />
              </div>
              <Select value={modelFilter} onValueChange={setModelFilter}>
                <SelectTrigger className="h-8 w-[200px] text-xs">
                  <Cpu className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {uniqueModels.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                className="h-8 text-xs gap-1"
              >
                <ArrowUpDown className="h-3 w-3" />
                {sortDir === "desc" ? "Newest first" : "Oldest first"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Governance notice */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-purple-500/5 border border-purple-500/15">
          <Sparkles className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-purple-300">AI Governance Audit Trail</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Every AI interaction is logged immutably. Click any entry to expand the full prompt and response for compliance review. Incomplete records without prompt text are excluded from this view.
            </p>
          </div>
        </div>

        {/* Log list */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
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
                <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="bg-card/50 border-border/60">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Bot className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No AI interactions found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {search || modelFilter !== "all"
                    ? "Try adjusting your filters"
                    : "AI interactions will appear here once workflows run"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((log) => <AILogCard key={log.recordId} log={log} />)
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
