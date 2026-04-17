import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Filter,
  ArrowUpDown,
  ChevronRight,
  ChevronDown,
  Copy,
  ExternalLink,
  Layers,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

function StatusIcon({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  if (s === "failed" || s === "error" || s === "failure") return <XCircle className="h-3.5 w-3.5 text-red-400" />;
  return <Clock className="h-3.5 w-3.5 text-amber-400" />;
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const variants: Record<string, string> = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
    failure: "bg-red-500/10 text-red-400 border-red-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${variants[s] ?? "bg-muted/50 text-muted-foreground border-border"}`}>
      <StatusIcon status={status} />
      {status}
    </span>
  );
}

function RuntimeBadge({ runtime }: { runtime: string }) {
  const r = runtime.toLowerCase();
  if (r === "make")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
        <Zap className="h-3 w-3" /> Make
      </span>
    );
  if (r === "n8n")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
        <Zap className="h-3 w-3" /> n8n
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted/50 text-muted-foreground border border-border">
      {runtime}
    </span>
  );
}

function EventTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    "Workflow Created": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Workflow Completed": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Step Completed": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Step Failed": "bg-red-500/10 text-red-400 border-red-500/20",
    "AI Triggered": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "AI Request Sent": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "AI Response Received": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "Report Generated": "bg-teal-500/10 text-teal-400 border-teal-500/20",
    "Data Retrieved": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "Runtime Triggered": "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "error": "bg-red-500/10 text-red-400 border-red-500/20",
    "routing": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "intake": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "completion": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "report": "bg-teal-500/10 text-teal-400 border-teal-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors[type] ?? "bg-muted/50 text-muted-foreground border-border"}`}>
      {type}
    </span>
  );
}

function fmtTimestamp(ts: string | null): string {
  if (!ts || ts === "None") return "—";
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch {
    return ts;
  }
}

interface LogRow {
  recordId: string;
  logId: string;
  workflowRecordIds: string[];
  runtime: string;
  stepName: string;
  eventType: string;
  status: string;
  timestamp: string | null;
  message: string | null;
}

function LogTableRow({ log, idx, onNavigate }: { log: LogRow; idx: number; onNavigate: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  // Display a short unique identifier: use logId if it's not a raw record ID, else use last 8 chars of recordId
  const displayId = log.logId && !log.logId.startsWith("rec") ? log.logId : `#${log.recordId.slice(-6)}`;

  return (
    <>
      <tr
        className={`border-b border-border/40 hover:bg-muted/20 transition-colors cursor-pointer group ${idx % 2 === 0 ? "" : "bg-muted/5"} ${expanded ? "bg-muted/10" : ""}`}
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="px-5 py-3">
          <div className="flex items-center gap-1.5">
            {expanded
              ? <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              : <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            }
            <code className="text-[11px] font-mono text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded">
              {displayId}
            </code>
          </div>
        </td>
        <td className="px-3 py-3">
          <span className="text-xs font-medium text-foreground">{log.stepName}</span>
        </td>
        <td className="px-3 py-3">
          <EventTypeBadge type={log.eventType} />
        </td>
        <td className="px-3 py-3">
          <RuntimeBadge runtime={log.runtime} />
        </td>
        <td className="px-3 py-3">
          <StatusBadge status={log.status} />
        </td>
        <td className="px-3 py-3">
          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
            {fmtTimestamp(log.timestamp)}
          </span>
        </td>
        <td className="px-3 py-3 max-w-[220px]">
          <span className="text-xs text-muted-foreground truncate block">
            {log.message ?? "—"}
          </span>
        </td>
        <td className="px-3 py-3">
          {log.workflowRecordIds[0] && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); onNavigate(log.workflowRecordIds[0]); }}
              title="View workflow"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border/40 bg-muted/10">
          <td colSpan={8} className="px-5 py-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Full Message</p>
                  <p className="text-sm text-foreground/90 leading-relaxed font-mono bg-background/50 border border-border/60 rounded-lg px-4 py-3 whitespace-pre-wrap break-all">
                    {log.message ?? "No message recorded for this log entry."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <span className="text-[11px] text-muted-foreground">Record ID: </span>
                  <code className="text-[11px] font-mono text-muted-foreground">{log.recordId}</code>
                </div>
                {log.logId && log.logId !== log.recordId && (
                  <div>
                    <span className="text-[11px] text-muted-foreground">Log ID: </span>
                    <code className="text-[11px] font-mono text-muted-foreground">{log.logId}</code>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(log.message ?? "");
                    toast.success("Message copied to clipboard");
                  }}
                >
                  <Copy className="h-3 w-3" /> Copy message
                </Button>
                {log.workflowRecordIds[0] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] gap-1 text-primary hover:text-primary"
                    onClick={(e) => { e.stopPropagation(); onNavigate(log.workflowRecordIds[0]); }}
                  >
                    <ExternalLink className="h-3 w-3" /> View workflow
                  </Button>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ExecutionLogsPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [runtimeFilter, setRuntimeFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [groupByWorkflow, setGroupByWorkflow] = useState(false);

  const { data: logs = [], isLoading, refetch } = trpc.airtable.executionLogs.useQuery({});

  const filtered = useMemo(() => {
    let result = [...logs];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.stepName.toLowerCase().includes(q) ||
          l.eventType.toLowerCase().includes(q) ||
          l.logId.toLowerCase().includes(q) ||
          (l.message ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") result = result.filter((l) => l.status.toLowerCase() === statusFilter);
    if (runtimeFilter !== "all") result = result.filter((l) => l.runtime.toLowerCase() === runtimeFilter);
    if (eventFilter !== "all") result = result.filter((l) => l.eventType === eventFilter);
    result.sort((a, b) => {
      const ta = a.timestamp ?? "";
      const tb = b.timestamp ?? "";
      return sortDir === "desc" ? tb.localeCompare(ta) : ta.localeCompare(tb);
    });
    return result;
  }, [logs, search, statusFilter, runtimeFilter, eventFilter, sortDir]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((l) => l.status.toLowerCase() === "success").length;
    const failed = logs.filter((l) => ["failed", "error", "failure"].includes(l.status.toLowerCase())).length;
    const rate = total > 0 ? Math.round((success / total) * 100) : 0;
    return { total, success, failed, rate };
  }, [logs]);

  const uniqueEventTypes = useMemo(() => Array.from(new Set(logs.map((l) => l.eventType))), [logs]);

  // Group by first workflowRecordId
  const grouped = useMemo(() => {
    if (!groupByWorkflow) return null;
    const map = new Map<string, LogRow[]>();
    for (const log of filtered) {
      const key = log.workflowRecordIds[0] ?? "unlinked";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(log);
    }
    return map;
  }, [filtered, groupByWorkflow]);

  const renderTable = (rows: LogRow[], startIdx = 0) => (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border/60 bg-muted/20">
          <th className="text-left text-xs font-medium text-muted-foreground px-5 py-2.5 w-[110px]">Entry</th>
          <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5">Step</th>
          <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5">Event</th>
          <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5">Runtime</th>
          <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5">Status</th>
          <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5">Timestamp</th>
          <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5">Message</th>
          <th className="px-3 py-2.5 w-8" />
        </tr>
      </thead>
      <tbody>
        {rows.map((log, idx) => (
          <LogTableRow
            key={log.recordId}
            log={log}
            idx={startIdx + idx}
            onNavigate={(id) => setLocation(`/workflows/${id}`)}
          />
        ))}
      </tbody>
    </table>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold tracking-tight">Execution Logs</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Immutable step-by-step trace of every workflow execution across all runtimes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={groupByWorkflow ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupByWorkflow((v) => !v)}
              className="gap-2 h-8 text-xs"
            >
              <Layers className="h-3.5 w-3.5" />
              Group by Workflow
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2 h-8 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Entries", value: stats.total, color: "text-foreground" },
            { label: "Successful", value: stats.success, color: "text-emerald-400" },
            { label: "Failed", value: stats.failed, color: "text-red-400" },
            { label: "Success Rate", value: `${stats.rate}%`, color: stats.rate >= 80 ? "text-emerald-400" : stats.rate >= 50 ? "text-amber-400" : "text-red-400" },
          ].map((s) => (
            <Card key={s.label} className="bg-card/50 border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
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
                  placeholder="Search steps, events, messages…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8 text-sm bg-background/50"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                </SelectContent>
              </Select>
              <Select value={runtimeFilter} onValueChange={setRuntimeFilter}>
                <SelectTrigger className="h-8 w-[120px] text-xs">
                  <SelectValue placeholder="Runtime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Runtimes</SelectItem>
                  <SelectItem value="make">Make</SelectItem>
                  <SelectItem value="n8n">n8n</SelectItem>
                </SelectContent>
              </Select>
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {uniqueEventTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
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

        {/* Log Table */}
        <Card className="bg-card/50 border-border/60">
          <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
              </CardTitle>
              <CardDescription className="text-xs">
                {logs.length} total · sourced from Airtable · click any row to expand
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {isLoading ? (
              <div className="flex flex-col gap-2 px-5 pb-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Activity className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No execution logs found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {search || statusFilter !== "all" || runtimeFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Logs will appear here once workflows execute"}
                </p>
              </div>
            ) : groupByWorkflow && grouped ? (
              <div className="divide-y divide-border/40">
                {Array.from(grouped.entries()).map(([wfId, rows]) => (
                  <div key={wfId}>
                    <div className="flex items-center gap-2 px-5 py-2 bg-muted/30 border-b border-border/40">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Workflow
                      </span>
                      <code className="text-[11px] font-mono text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded">
                        {wfId === "unlinked" ? "Unlinked" : wfId}
                      </code>
                      <span className="ml-auto text-[11px] text-muted-foreground">{rows.length} entries</span>
                      {wfId !== "unlinked" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] gap-1 text-primary"
                          onClick={() => setLocation(`/workflows/${wfId}`)}
                        >
                          <ExternalLink className="h-3 w-3" /> View
                        </Button>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      {renderTable(rows)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {renderTable(filtered)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
