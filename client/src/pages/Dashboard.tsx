import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type SortKey = "dateRequested" | "workflowId" | "status" | "runtime";
type SortDir = "asc" | "desc";
type UserRole = "admin" | "analyst" | "viewer" | "user" | undefined;

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDateShort(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? "";
  const cfg: Record<string, { cls: string; dot: string; label: string }> = {
    completed: {
      cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-400",
      label: "Completed",
    },
    running: {
      cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      dot: "bg-blue-400",
      label: "Running",
    },
    failed: {
      cls: "bg-red-500/10 text-red-400 border-red-500/20",
      dot: "bg-red-400",
      label: "Failed",
    },
    pending: {
      cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      dot: "bg-amber-400",
      label: "Pending",
    },
    error: {
      cls: "bg-red-500/10 text-red-400 border-red-500/20",
      dot: "bg-red-400",
      label: "Error",
    },
  };
  const c = cfg[s] ?? {
    cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    dot: "bg-zinc-400",
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${c.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function RuntimeBadge({ runtime }: { runtime: string }) {
  const r = runtime?.toLowerCase() ?? "";
  if (r === "make") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
        <Zap className="w-2.5 h-2.5" /> Make
      </span>
    );
  }
  if (r === "n8n") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
        <Zap className="w-2.5 h-2.5" /> n8n
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">{runtime}</span>;
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === "admin") {
    return (
      <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/10">
        <Shield className="w-3 h-3 mr-1" />
        Admin
      </Badge>
    );
  }

  if (role === "analyst") {
    return (
      <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/10">
        <Activity className="w-3 h-3 mr-1" />
        Analyst
      </Badge>
    );
  }

  return (
    <Badge className="bg-zinc-500/10 text-zinc-300 border border-zinc-500/20 hover:bg-zinc-500/10">
      <Eye className="w-3 h-3 mr-1" />
      Viewer
    </Badge>
  );
}

function StatCard({
  label,
  value,
  icon,
  trend,
  color = "default",
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  color?: "default" | "success" | "warning" | "error" | "info";
}) {
  const colorMap = {
    default: "text-primary bg-primary/10",
    success: "text-emerald-400 bg-emerald-500/10",
    warning: "text-amber-400 bg-amber-500/10",
    error: "text-red-400 bg-red-500/10",
    info: "text-blue-400 bg-blue-500/10",
  };

  return (
    <div className="surface-1 rounded-xl p-5 card-hover group">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</div>
        {trend && (
          <span className="text-[11px] text-emerald-400 flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold tracking-tight text-foreground animate-in-up">
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function AccessPanel({ role }: { role: UserRole }) {
  const admin = role === "admin";
  const analyst = role === "analyst" || role === "admin";

  return (
    <div className="surface-1 rounded-xl p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold">Access Profile</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Dashboard behaviour based on your assigned role
          </p>
        </div>
        <RoleBadge role={role} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Plus className={`w-3.5 h-3.5 ${analyst ? "text-emerald-400" : "text-zinc-500"}`} />
            <p className="text-xs font-semibold">Workflow creation</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {analyst ? "Allowed for analysts and admins." : "Disabled for viewer accounts."}
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Bot className={`w-3.5 h-3.5 ${analyst ? "text-emerald-400" : "text-zinc-500"}`} />
            <p className="text-xs font-semibold">Operational logs</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {analyst ? "AI logs and execution logs are available." : "Read-only dashboard view only."}
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield className={`w-3.5 h-3.5 ${admin ? "text-emerald-400" : "text-zinc-500"}`} />
            <p className="text-xs font-semibold">Administrative controls</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {admin ? "Status updates and governance actions enabled." : "Reserved for admin users only."}
          </p>
        </div>
      </div>
    </div>
  );
}

function AdminControlPanel({ onGoToLogs }: { onGoToLogs: () => void }) {
  return (
    <div className="surface-1 rounded-xl p-5 border border-red-500/20">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-md bg-red-500/15">
          <Shield className="w-3.5 h-3.5 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-semibold">Admin Governance Controls</p>
          <p className="text-[11px] text-muted-foreground">
            Elevated actions and oversight tools
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-red-500/15 bg-red-500/5 p-3">
          <p className="text-xs font-semibold mb-1">Status control</p>
          <p className="text-xs text-muted-foreground">
            Use the workflow table action menu to update workflow states.
          </p>
        </div>

        <div className="rounded-lg border border-red-500/15 bg-red-500/5 p-3">
          <p className="text-xs font-semibold mb-1">User governance</p>
          <p className="text-xs text-muted-foreground">
            Backend role assignment is active. Admin UI can be layered next.
          </p>
        </div>

        <div className="rounded-lg border border-red-500/15 bg-red-500/5 p-3">
          <p className="text-xs font-semibold mb-1">Deep diagnostics</p>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs mt-2 bg-transparent"
            onClick={onGoToLogs}
          >
            Open execution logs
          </Button>
        </div>
      </div>
    </div>
  );
}

function InsightsPanel() {
  const { data: insights, isLoading } = trpc.intelligence.dashboardInsights.useQuery(
    undefined,
    {
      refetchInterval: 120000,
      staleTime: 60000,
    }
  );

  const typeStyle: Record<string, string> = {
    success: "text-emerald-400 bg-emerald-500/8 border border-emerald-500/15",
    warning: "text-amber-400 bg-amber-500/8 border border-amber-500/15",
    info: "text-blue-400 bg-blue-500/8 border border-blue-500/15",
    error: "text-red-400 bg-red-500/8 border border-red-500/15",
  };

  const typeIcon: Record<string, React.ReactNode> = {
    success: <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />,
    info: <Bot className="w-3.5 h-3.5 shrink-0 mt-0.5" />,
    error: <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />,
  };

  return (
    <div className="insight-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-md bg-primary/15">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">AI Governance Insights</p>
          <p className="text-[11px] text-muted-foreground">
            AI-generated · refreshes every 2 minutes
          </p>
        </div>
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
      </div>

      {insights?.summary && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-3 pb-3 border-b border-border/50">
          {insights.summary}
        </p>
      )}

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-10 rounded-lg" />
          ))
        ) : insights?.insights?.length ? (
          insights.insights.map((ins, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg ${
                typeStyle[ins.type] ?? typeStyle.info
              } animate-in-up`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {typeIcon[ins.type] ?? typeIcon.info}
              <div className="min-w-0">
                <p className="text-xs font-semibold mb-0.5">{ins.title}</p>
                <p className="text-xs leading-relaxed opacity-80">{ins.message}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">No insights available yet.</p>
        )}
      </div>
    </div>
  );
}

function AnomalyPanel() {
  const [, setLocation] = useLocation();
  const { data: anomalyData, isLoading } = trpc.intelligence.detectAnomalies.useQuery(
    undefined,
    {
      refetchInterval: 90000,
    }
  );

  const anomalies = anomalyData?.anomalies ?? [];
  if (!isLoading && anomalies.length === 0) return null;

  const severityStyle: Record<string, string> = {
    critical: "text-red-400 bg-red-500/8 border border-red-500/20",
    warning: "text-amber-400 bg-amber-500/8 border border-amber-500/20",
    info: "text-blue-400 bg-blue-500/8 border border-blue-500/20",
  };

  const severityDot: Record<string, string> = {
    critical: "bg-red-400 animate-pulse",
    warning: "bg-amber-400",
    info: "bg-blue-400",
  };

  return (
    <div className="surface-1 rounded-xl p-5 border border-amber-500/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-md bg-amber-500/15">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Anomaly Alerts</p>
          <p className="text-[11px] text-muted-foreground">
            AI-detected governance issues
          </p>
        </div>
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        {anomalies.length > 0 && (
          <span className="text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
            {anomalies.length}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-lg" />
          ))
        ) : (
          anomalies.map((a, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                severityStyle[a.severity] ?? severityStyle.info
              } animate-in-up cursor-pointer hover:opacity-80 transition-opacity`}
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => a.workflowId !== "SYSTEM" && setLocation(`/workflows/${a.workflowId}`)}
            >
              <span
                className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                  severityDot[a.severity] ?? "bg-blue-400"
                }`}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold capitalize">
                    {a.type.replace(/_/g, " ")}
                  </span>
                  {a.workflowId !== "SYSTEM" && (
                    <code className="text-[10px] font-mono opacity-60">{a.workflowId}</code>
                  )}
                </div>
                <p className="text-xs opacity-80 leading-relaxed">{a.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function HealthBar({
  stats,
}: {
  stats:
    | {
        total: number;
        completed: number;
        failed: number;
        pending: number;
        running: number;
      }
    | undefined;
}) {
  if (!stats || stats.total === 0) {
    return (
      <div className="surface-1 rounded-xl p-5">
        <p className="text-sm font-semibold mb-3">Workflow Health</p>
        <div className="skeleton h-2 rounded-full" />
      </div>
    );
  }

  const pct = (n: number) => `${Math.round((n / stats.total) * 100)}%`;

  return (
    <div className="surface-1 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold">Workflow Health</p>
        <span className="text-xs text-muted-foreground">{stats.total} total</span>
      </div>

      <div className="h-2 rounded-full overflow-hidden flex gap-0.5 bg-muted/40">
        {stats.completed > 0 && (
          <div className="bg-emerald-500 rounded-full transition-all" style={{ width: pct(stats.completed) }} />
        )}
        {stats.running > 0 && (
          <div className="bg-blue-500 rounded-full transition-all" style={{ width: pct(stats.running) }} />
        )}
        {stats.pending > 0 && (
          <div className="bg-amber-500 rounded-full transition-all" style={{ width: pct(stats.pending) }} />
        )}
        {stats.failed > 0 && (
          <div className="bg-red-500 rounded-full transition-all" style={{ width: pct(stats.failed) }} />
        )}
      </div>

      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {[
          { label: "Completed", count: stats.completed, color: "bg-emerald-500" },
          { label: "Running", count: stats.running, color: "bg-blue-500" },
          { label: "Pending", count: stats.pending, color: "bg-amber-500" },
          { label: "Failed", count: stats.failed, color: "bg-red-500" },
        ]
          .filter((x) => x.count > 0)
          .map((x) => (
            <div key={x.label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${x.color}`} />
              <span className="text-xs text-muted-foreground">{x.label}</span>
              <span className="text-xs font-semibold text-foreground">{x.count}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

const STATUS_OPTIONS = ["Pending", "Running", "Completed", "Failed"] as const;

type WorkflowStatus = typeof STATUS_OPTIONS[number];

function WorkflowTable({ role }: { role: UserRole }) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [runtimeFilter, setRuntimeFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("dateRequested");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const canAdminister = role === "admin";

  const utils = trpc.useUtils();
  const { data: workflows, isLoading, refetch, isFetching } = trpc.airtable.workflows.useQuery(
    undefined,
    {
      refetchInterval: 60000,
    }
  );

  const updateStatus = trpc.airtable.updateWorkflowStatus.useMutation({
    onMutate: ({ recordId }) => setUpdatingId(recordId),
    onSuccess: (updated) => {
      toast.success(`Status updated to "${updated.status}" for ${updated.name}`);
      utils.airtable.workflows.invalidate();
      utils.airtable.dashboardStats.invalidate();
    },
    onError: (err) => toast.error(`Failed to update status: ${err.message}`),
    onSettled: () => setUpdatingId(null),
  });

  const filtered = useMemo(() => {
    if (!workflows) return [];
    return workflows
      .filter((w) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          w.workflowId.toLowerCase().includes(q) ||
          w.name.toLowerCase().includes(q) ||
          w.requestedBy.toLowerCase().includes(q) ||
          (w.reportPeriod ?? "").toLowerCase().includes(q);
        const matchStatus = statusFilter === "all" || w.status.toLowerCase() === statusFilter;
        const matchRuntime = runtimeFilter === "all" || w.runtime.toLowerCase() === runtimeFilter;
        return matchSearch && matchStatus && matchRuntime;
      })
      .sort((a, b) => {
        let va: string | number = "";
        let vb: string | number = "";

        if (sortKey === "dateRequested") {
          va = a.dateRequested ?? "";
          vb = b.dateRequested ?? "";
        } else if (sortKey === "workflowId") {
          va = a.workflowId;
          vb = b.workflowId;
        } else if (sortKey === "status") {
          va = a.status;
          vb = b.status;
        } else if (sortKey === "runtime") {
          va = a.runtime;
          vb = b.runtime;
        }

        const cmp = String(va).localeCompare(String(vb));
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [workflows, search, statusFilter, runtimeFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) {
      return <ChevronDown className="w-3 h-3 text-muted-foreground/40" />;
    }

    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-primary" />
    ) : (
      <ChevronDown className="w-3 h-3 text-primary" />
    );
  }

  const cols: { key: SortKey; label: string; sortable?: boolean }[] = [
    { key: "workflowId", label: "Workflow ID", sortable: true },
    { key: "workflowId", label: "Name" },
    { key: "runtime", label: "Runtime", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "workflowId", label: "Requested By" },
    { key: "workflowId", label: "Report Period" },
    { key: "dateRequested", label: "Date Requested", sortable: true },
    { key: "workflowId", label: "Completed" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search workflows, IDs, requesters…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-xs bg-muted/30 border-border/60"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-32 bg-muted/30 border-border/60">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={runtimeFilter} onValueChange={setRuntimeFilter}>
            <SelectTrigger className="h-8 text-xs w-28 bg-muted/30 border-border/60">
              <SelectValue placeholder="Runtime" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All runtimes</SelectItem>
              <SelectItem value="make">Make</SelectItem>
              <SelectItem value="n8n">n8n</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="ml-auto">
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {workflows?.length ?? 0} workflows
          </span>
        </div>
      </div>

      <div className="surface-1 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {cols.map((col) => (
                  <th
                    key={col.label}
                    className={`text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap ${
                      col.sortable
                        ? "cursor-pointer select-none hover:text-foreground transition-colors"
                        : ""
                    }`}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && <SortIcon k={col.key} />}
                    </span>
                  </th>
                ))}
                {canAdminister && (
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: canAdminister ? 9 : 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="skeleton h-4 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canAdminister ? 9 : 8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Activity className="w-8 h-8 opacity-30" />
                      <p className="text-sm font-medium">No workflows found</p>
                      <p className="text-xs opacity-70">
                        {search || statusFilter !== "all" || runtimeFilter !== "all"
                          ? "Try adjusting your filters"
                          : "Create your first workflow to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((wf, idx) => (
                  <tr
                    key={wf.recordId}
                    onClick={() => setLocation(`/workflows/${wf.recordId}`)}
                    className={`border-b border-border/50 last:border-0 cursor-pointer row-hover ${
                      idx % 2 === 0 ? "bg-card" : "bg-background/40"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="code-inline">{wf.workflowId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-foreground max-w-[160px] truncate block">
                        {wf.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <RuntimeBadge runtime={wf.runtime} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={wf.status} />
                        {(wf.status?.toLowerCase() === "failed" ||
                          wf.status?.toLowerCase() === "error") && (
                          <span
                            title="Anomaly detected"
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500/20 border border-red-500/30"
                          >
                            <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                          </span>
                        )}
                        {wf.notes &&
                          wf.notes.toLowerCase().includes("error") &&
                          wf.status?.toLowerCase() !== "failed" && (
                            <span
                              title={`Note: ${wf.notes}`}
                              className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30"
                            >
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {wf.requestedBy}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {wf.reportPeriod ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        {fmtDate(wf.dateRequested)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {wf.dateCompleted ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          {fmtDateShort(wf.dateCompleted)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    {canAdminister && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-50 hover:opacity-100"
                              disabled={updatingId === wf.recordId}
                            >
                              {updatingId === wf.recordId ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-[11px]">Set Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {STATUS_OPTIONS.map((s) => (
                              <DropdownMenuItem
                                key={s}
                                className={`text-xs cursor-pointer ${
                                  wf.status?.toLowerCase() === s.toLowerCase()
                                    ? "font-semibold text-primary"
                                    : ""
                                }`}
                                onClick={() =>
                                  updateStatus.mutate({ recordId: wf.recordId, status: s })
                                }
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full mr-2 shrink-0 ${
                                    s === "Completed"
                                      ? "bg-emerald-400"
                                      : s === "Running"
                                      ? "bg-blue-400"
                                      : s === "Failed"
                                      ? "bg-red-400"
                                      : "bg-amber-400"
                                  }`}
                                />
                                {s}
                                {wf.status?.toLowerCase() === s.toLowerCase() && (
                                  <CheckCircle2 className="w-3 h-3 ml-auto text-primary" />
                                )}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-xs cursor-pointer"
                              onClick={() => setLocation(`/workflows/${wf.recordId}`)}
                            >
                              <ArrowUpRight className="w-3 h-3 mr-2" />
                              View details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { user } = useAuth();

  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [relativeTime, setRelativeTime] = useState("");

  const role = (user?.role as UserRole) ?? "viewer";
  const isAdmin = role === "admin";
  const isAnalyst = role === "analyst" || role === "admin";
  const isViewer = !isAnalyst;

  const { data: stats, isLoading: statsLoading, dataUpdatedAt } =
    trpc.airtable.dashboardStats.useQuery(undefined, {
      refetchInterval: 60000,
    });

  useEffect(() => {
    if (dataUpdatedAt) setLastSync(new Date(dataUpdatedAt));
  }, [dataUpdatedAt]);

  useEffect(() => {
    function update() {
      if (!lastSync) {
        setRelativeTime("");
        return;
      }
      const secs = Math.floor((Date.now() - lastSync.getTime()) / 1000);
      if (secs < 10) setRelativeTime("just now");
      else if (secs < 60) setRelativeTime(`${secs}s ago`);
      else if (secs < 3600) setRelativeTime(`${Math.floor(secs / 60)}m ago`);
      else {
        setRelativeTime(
          lastSync.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }
    }

    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [lastSync]);

  const refresh = () => {
    utils.airtable.dashboardStats.invalidate();
    utils.airtable.workflows.invalidate();
    setLastSync(new Date());
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              Governance Dashboard
            </h1>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <p className="text-xs text-muted-foreground">
                Runtime-independent supervision · Weekly Marketing Performance Reporting
              </p>
              <RoleBadge role={role} />
              {relativeTime && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Synced {relativeTime}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="h-8 text-xs gap-1.5 bg-transparent"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </Button>

            {isAnalyst && (
              <Button
                size="sm"
                onClick={() => setLocation("/workflows/new")}
                className="h-8 text-xs gap-1.5"
              >
                <Plus className="w-3 h-3" />
                New Workflow
              </Button>
            )}
          </div>
        </div>

        <AccessPanel role={role} />

        {isAdmin && <AdminControlPanel onGoToLogs={() => setLocation("/logs")} />}

        <div className="flex items-center gap-2 flex-wrap pb-1 border-b border-border/40">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mr-1">
            Quick Actions
          </span>

          {isAnalyst && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 bg-transparent border-border/60 hover:border-primary/50"
              onClick={() => setLocation("/workflows/new")}
            >
              <Plus className="w-3 h-3 text-primary" />
              New Workflow
            </Button>
          )}

          {isAnalyst && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 bg-transparent border-border/60 hover:border-primary/50"
                onClick={() => setLocation("/logs")}
              >
                <Activity className="w-3 h-3 text-blue-400" />
                Execution Logs
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 bg-transparent border-border/60 hover:border-primary/50"
                onClick={() => setLocation("/ai-logs")}
              >
                <Bot className="w-3 h-3 text-purple-400" />
                AI Logs
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 bg-transparent border-border/60 hover:border-primary/50"
            onClick={() => setLocation("/reports")}
          >
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            Reports
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 bg-transparent border-border/60 hover:border-primary/50"
            onClick={() => setLocation("/performance")}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            Performance Data
          </Button>

          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 bg-transparent border-border/60 hover:border-primary/50"
              onClick={() => setLocation("/settings")}
            >
              <Users className="w-3 h-3 text-red-400" />
              Admin Settings
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-xl" />
            ))
          ) : (
            <>
              <StatCard
                label="Total Workflows"
                value={stats?.total ?? 0}
                icon={<Activity className="w-4 h-4" />}
                color="default"
              />
              <StatCard
                label="Completed"
                value={stats?.completed ?? 0}
                icon={<CheckCircle2 className="w-4 h-4" />}
                color="success"
              />
              <StatCard
                label="Pending"
                value={stats?.pending ?? 0}
                icon={<Clock className="w-4 h-4" />}
                color="warning"
              />
              <StatCard
                label="Failed"
                value={stats?.failed ?? 0}
                icon={<AlertTriangle className="w-4 h-4" />}
                color="error"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="surface-1 rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold">Runtime Distribution</p>
            {statsLoading ? (
              <div className="space-y-3">
                <div className="skeleton h-12 rounded-lg" />
                <div className="skeleton h-12 rounded-lg" />
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  {
                    name: "Make",
                    count: stats?.make ?? 0,
                    color: "bg-violet-500",
                    icon: "text-violet-400",
                  },
                  {
                    name: "n8n",
                    count: stats?.n8n ?? 0,
                    color: "bg-orange-500",
                    icon: "text-orange-400",
                  },
                ].map((rt) => {
                  const pct = stats?.total ? Math.round((rt.count / stats.total) * 100) : 0;
                  return (
                    <div key={rt.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className={`w-3.5 h-3.5 ${rt.icon}`} />
                          <span className="text-xs font-medium">{rt.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">{rt.count}</span>
                          <span className="text-[11px] text-muted-foreground">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${rt.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {stats && (
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Success rate</span>
                    <span className="text-sm font-semibold text-emerald-400">
                      {stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : "—"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <HealthBar stats={stats} />
          <InsightsPanel />
        </div>

        <AnomalyPanel />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">All Workflows</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Weekly Marketing Performance Reporting · sourced from Airtable
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => setLocation("/reports")}
            >
              View reports
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>

          <WorkflowTable role={role} />
        </div>

        {isViewer && (
          <div className="surface-1 rounded-xl p-4 border border-blue-500/15 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-sm font-semibold">Read-only mode</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Viewer accounts can inspect governance summaries, reports, performance trends, and workflow outcomes,
              but cannot create workflows or perform operational actions.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
