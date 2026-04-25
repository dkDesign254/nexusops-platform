import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Shield,
  Sparkles,
  AlertTriangle,
  Bot,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

function StatusIcon({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  if (s === "failed" || s === "error" || s === "failure") {
    return <XCircle className="h-3.5 w-3.5 text-red-400" />;
  }
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
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
        variants[s] ?? "bg-muted/50 text-muted-foreground border-border"
      }`}
    >
      <StatusIcon status={status} />
      {status}
    </span>
  );
}

function RuntimeBadge({ runtime }: { runtime: string }) {
  const r = runtime.toLowerCase();

  if (r === "make") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
        <Zap className="h-3 w-3" />
        Make
      </span>
    );
  }

  if (r === "n8n") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
        <Zap className="h-3 w-3" />
        n8n
      </span>
    );
  }

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
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    routing: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    intake: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    completion: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    report: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${
        colors[type] ?? "bg-muted/50 text-muted-foreground border-border"
      }`}
    >
      {type}
    </span>
  );
}

function fmtTimestamp(ts: string | null): string {
  if (!ts || ts === "None") return "—";
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
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
      <div className="p-2.5 rounded-2xl bg-muted/40 ring-1 ring-border/50">{icon}</div>
      <div>
        <p className={`text-2xl font-semibold tracking-tight ${valueClassName ?? "text-foreground"}`}>
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function LogTableRow({
  log,
  idx,
  onNavigate,
}: {
  log: LogRow;
  idx: number;
  onNavigate: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayId =
    log.logId && !log.logId.startsWith("rec") ? log.logId : `#${log.recordId.slice(-6)}`;

  return (
    <>
      <tr
        className={`border-b border-border/40 hover:bg-primary/5 transition-colors cursor-pointer group ${
          idx % 2 === 0 ? "" : "bg-muted/5"
        } ${expanded ? "bg-muted/10" : ""}`}
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="px-5 py-4">
          <div className="flex items-center gap-1.5">
            {expanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            <code className="text-[11px] font-mono text-primary/80 bg-primary/5 px-2 py-1 rounded-lg">
              {displayId}
            </code>
          </div>
        </td>

        <td className="px-3 py-4">
          <span className="text-xs font-medium text-foreground">{log.stepName}</span>
        </td>

        <td className="px-3 py-4">
          <EventTypeBadge type={log.eventType} />
        </td>

        <td className="px-3 py-4">
          <RuntimeBadge runtime={log.runtime} />
        </td>

        <td className="px-3 py-4">
          <StatusBadge status={log.status} />
        </td>

        <td className="px-3 py-4">
          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
            {fmtTimestamp(log.timestamp)}
          </span>
        </td>

        <td className="px-3 py-4 max-w-[260px]">
          <span className="text-xs text-muted-foreground truncate block">
            {log.message ?? "—"}
          </span>
        </td>

        <td className="px-3 py-4">
          {log.workflowRecordIds[0] && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(log.workflowRecordIds[0]);
              }}
              title="View workflow"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-border/40 bg-muted/10">
          <td colSpan={8} className="px-5 py-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.16em] mb-2">
                    Full Message
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed font-mono bg-background/50 border border-border/60 rounded-2xl px-4 py-3 whitespace-pre-wrap break-all">
                    {log.message ?? "No message recorded for this log entry."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <span className="text-[11px] text-muted-foreground">Record ID: </span>
                  <code className="text-[11px] font-mono text-muted-foreground">
                    {log.recordId}
                  </code>
                </div>

                {log.logId && log.logId !== log.recordId && (
                  <div>
                    <span className="text-[11px] text-muted-foreground">Log ID: </span>
                    <code className="text-[11px] font-mono text-muted-foreground">
                      {log.logId}
                    </code>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(log.message ?? "");
                    toast.success("Message copied to clipboard");
                  }}
                >
                  <Copy className="h-3 w-3" />
                  Copy message
                </Button>

                {log.workflowRecordIds[0] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] gap-1 text-primary hover:text-primary rounded-xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(log.workflowRecordIds[0]);
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                    View workflow
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
  const [location, setLocation] = useLocation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("status") ?? "all";
  });
  const [runtimeFilter, setRuntimeFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("runtime") ?? "all";
  });
  const [eventFilter, setEventFilter] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("runtime");
    const s = params.get("status");
    if (r) setRuntimeFilter(r);
    if (s) setStatusFilter(s);
  }, [location]);
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

    if (statusFilter !== "all") {
      result = result.filter((l) => l.status.toLowerCase() === statusFilter);
    }

    if (runtimeFilter !== "all") {
      result = result.filter((l) => l.runtime.toLowerCase() === runtimeFilter);
    }

    if (eventFilter !== "all") {
      result = result.filter((l) => l.eventType === eventFilter);
    }

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
    const failed = logs.filter((l) =>
      ["failed", "error", "failure"].includes(l.status.toLowerCase())
    ).length;
    const rate = total > 0 ? Math.round((success / total) * 100) : 0;
    return { total, success, failed, rate };
  }, [logs]);

  const uniqueEventTypes = useMemo(
    () => Array.from(new Set(logs.map((l) => l.eventType))),
    [logs]
  );

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
        <tr className="border-b border-border/60 bg-muted/15">
          <th className="text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground px-5 py-3 w-[110px]">
            Entry
          </th>
          <th className="text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground px-3 py-3">
            Step
          </th>
          <th className="text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground px-3 py-3">
            Event
          </th>
          <th className="text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground px-3 py-3">
            Runtime
          </th>
          <th className="text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground px-3 py-3">
            Status
          </th>
          <th className="text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground px-3 py-3">
            Timestamp
          </th>
          <th className="text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground px-3 py-3">
            Message
          </th>
          <th className="px-3 py-3 w-8" />
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
    <DashboardLayout
      breadcrumbs={[{ label: "Dashboard", path: "/" }, { label: "Execution Logs" }]}
    >
      <div className="max-w-[1280px] mx-auto space-y-6">
        <div className="surface-elevated rounded-3xl p-6 md:p-7 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_28%),radial-gradient(circle_at_left,rgba(16,185,129,0.06),transparent_22%)]" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary">
                <Sparkles className="w-3 h-3" />
                Runtime Execution Intelligence
              </div>

              <div>
                <h1 className="text-heading text-2xl md:text-3xl">Execution Logs</h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                  Immutable step-by-step trace of workflow execution across Make and n8n,
                  designed for diagnostics, governance review, and operational confidence.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                <Bot className="w-3.5 h-3.5" />
                <span>Sourced from Airtable</span>
                <span className="opacity-40">•</span>
                <span>{logs.length} total entries</span>
                <span className="opacity-40">•</span>
                <span>Click any row to expand details</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={groupByWorkflow ? "default" : "outline"}
                size="sm"
                onClick={() => setGroupByWorkflow((v) => !v)}
                className={`gap-2 h-9 text-xs rounded-xl ${
                  groupByWorkflow ? "bg-[var(--primary)] text-white hover:opacity-90" : ""
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Group by Workflow
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-2 h-9 text-xs rounded-xl bg-transparent"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Entries"
            value={stats.total}
            icon={<Activity className="w-4 h-4 text-primary" />}
          />
          <MetricCard
            label="Successful"
            value={stats.success}
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            valueClassName="text-emerald-400"
          />
          <MetricCard
            label="Failed"
            value={stats.failed}
            icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
            valueClassName="text-red-400"
          />
          <MetricCard
            label="Success Rate"
            value={`${stats.rate}%`}
            icon={<Shield className="w-4 h-4 text-primary" />}
            valueClassName={
              stats.rate >= 80
                ? "text-emerald-400"
                : stats.rate >= 50
                ? "text-amber-400"
                : "text-red-400"
            }
          />
        </div>

        <div className="surface-elevated rounded-2xl p-4 md:p-5">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search steps, events, messages…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-sm bg-background/50 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/30 border border-border">
                <Filter className="h-3.5 w-3.5 text-muted-foreground ml-2" />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 bg-transparent text-xs text-foreground outline-none px-2"
                >
                  <option value="all">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                  <option value="running">Running</option>
                </select>

                <select
                  value={runtimeFilter}
                  onChange={(e) => setRuntimeFilter(e.target.value)}
                  className="h-8 bg-transparent text-xs text-foreground outline-none px-2"
                >
                  <option value="all">All Runtimes</option>
                  <option value="make">Make</option>
                  <option value="n8n">n8n</option>
                </select>

                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="h-8 bg-transparent text-xs text-foreground outline-none px-2"
                >
                  <option value="all">All Events</option>
                  {uniqueEventTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
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
        </div>

        <div className="surface-elevated rounded-2xl overflow-hidden card-hover">
          <div className="px-5 py-4 border-b border-border/50 bg-muted/10 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {logs.length} total · operational trace across all runtimes
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground hidden md:block">
              Expand rows to inspect full messages and linked workflows
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2 px-5 py-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 rounded-2xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Activity className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No execution logs found
              </p>
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
                  <div className="flex items-center gap-2 px-5 py-3 bg-muted/20 border-b border-border/40">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.16em]">
                      Workflow
                    </span>
                    <code className="text-[11px] font-mono text-primary/70 bg-primary/5 px-2 py-1 rounded-lg">
                      {wfId === "unlinked" ? "Unlinked" : wfId}
                    </code>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {rows.length} entries
                    </span>
                    {wfId !== "unlinked" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] gap-1 text-primary rounded-xl"
                        onClick={() => setLocation(`/workflows/${wfId}`)}
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </Button>
                    )}
                  </div>

                  <div className="overflow-x-auto">{renderTable(rows)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">{renderTable(filtered)}</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
