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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function RuntimeBadge({ runtime }: { runtime: string }) {
  const r = runtime?.toLowerCase() ?? "";

  if (r === "make") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
        <Zap className="w-3 h-3" />
        Make
      </span>
    );
  }

  if (r === "n8n") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
        <Zap className="w-3 h-3" />
        n8n
      </span>
    );
  }

  return <span className="text-xs text-muted-foreground">{runtime}</span>;
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === "admin") {
    return (
      <Badge className="rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/10">
        <Shield className="w-3 h-3 mr-1" />
        Admin
      </Badge>
    );
  }

  if (role === "analyst") {
    return (
      <Badge className="rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/10">
        <Activity className="w-3 h-3 mr-1" />
        Analyst
      </Badge>
    );
  }

  return (
    <Badge className="rounded-full bg-zinc-500/10 text-zinc-300 border border-zinc-500/20 hover:bg-zinc-500/10">
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
  onClick,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  color?: "default" | "success" | "warning" | "error" | "info";
  onClick?: () => void;
}) {
  const colorMap = {
    default: "text-primary bg-primary/10 ring-1 ring-primary/10",
    success: "text-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-500/10",
    warning: "text-amber-400 bg-amber-500/10 ring-1 ring-amber-500/10",
    error: "text-red-400 bg-red-500/10 ring-1 ring-red-500/10",
    info: "text-blue-400 bg-blue-500/10 ring-1 ring-blue-500/10",
  };

  return (
    <button
      onClick={onClick}
      className={`surface-elevated card-hover rounded-2xl p-5 text-left w-full ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-2xl ${colorMap[color]}`}>{icon}</div>
        {trend && (
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 border border-emerald-500/10">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>

      <p className="text-3xl font-semibold tracking-tight text-foreground animate-in">
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
    </button>
  );
}

function AccessPanel({
  role,
  onGoToNewWorkflow,
  onGoToLogs,
  onGoToSettings,
}: {
  role: UserRole;
  onGoToNewWorkflow: () => void;
  onGoToLogs: () => void;
  onGoToSettings: () => void;
}) {
  const analyst = role === "analyst" || role === "admin";
  const admin = role === "admin";

  return (
    <div className="surface-elevated rounded-2xl p-6 card-hover">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-sm font-semibold text-foreground">Access Profile</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Dashboard behaviour based on your assigned role
          </p>
        </div>
        <RoleBadge role={role} />
      </div>

      <div className="space-y-3">
        <div
          onClick={onGoToNewWorkflow}
          className="rounded-2xl border border-border/70 bg-muted/20 p-4 cursor-pointer hover:bg-primary/10 transition"
        >
          <div className="flex items-center gap-2 mb-2">
            <Plus className={`w-3.5 h-3.5 ${analyst ? "text-emerald-400" : "text-zinc-500"}`} />
            <p className="text-xs font-semibold text-foreground">Workflow creation</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {analyst
              ? "Open workflow setup and start a new automation."
              : "Disabled for viewer accounts."}
          </p>
        </div>

        <div
          onClick={onGoToLogs}
          className="rounded-2xl border border-border/70 bg-muted/20 p-4 cursor-pointer hover:bg-blue-500/10 transition"
        >
          <div className="flex items-center gap-2 mb-2">
            <Bot className={`w-3.5 h-3.5 ${analyst ? "text-emerald-400" : "text-zinc-500"}`} />
            <p className="text-xs font-semibold text-foreground">Operational logs</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {analyst
              ? "Open execution and AI logs to inspect operational activity."
              : "Read-only dashboard view only."}
          </p>
        </div>

        <div
          onClick={onGoToSettings}
          className="rounded-2xl border border-border/70 bg-muted/20 p-4 cursor-pointer hover:bg-red-500/10 transition"
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield className={`w-3.5 h-3.5 ${admin ? "text-emerald-400" : "text-zinc-500"}`} />
            <p className="text-xs font-semibold text-foreground">Administrative controls</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {admin
              ? "Open workspace controls, billing, and governance settings."
              : "Reserved for admin users only."}
          </p>
        </div>
      </div>
    </div>
  );
}

function AdminControlPanel({
  onGoToLogs,
  onGoToSettings,
  onGoToSystemLogs,
}: {
  onGoToLogs: () => void;
  onGoToSettings: () => void;
  onGoToSystemLogs: () => void;
}) {
  return (
    <div className="surface-elevated rounded-2xl p-6 border border-red-500/20 card-hover">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-2xl bg-red-500/15 ring-1 ring-red-500/10">
          <Shield className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Admin Controls</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Governance and operational administration
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div
          onClick={onGoToLogs}
          className="rounded-2xl border border-red-500/15 bg-red-500/5 p-4 cursor-pointer hover:bg-red-500/10 transition"
        >
          <p className="text-xs font-semibold text-foreground mb-1">Status control</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Review workflow states, failures, and execution behaviour in the logs view.
          </p>
        </div>

        <div
          onClick={onGoToSettings}
          className="rounded-2xl border border-red-500/15 bg-red-500/5 p-4 cursor-pointer hover:bg-red-500/10 transition"
        >
          <p className="text-xs font-semibold text-foreground mb-1">User governance</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Manage access, roles, and workspace controls from settings.
          </p>
        </div>

        <div
          onClick={onGoToSystemLogs}
          className="rounded-2xl border border-red-500/15 bg-red-500/5 p-4 cursor-pointer hover:bg-red-500/10 transition"
        >
          <p className="text-xs font-semibold text-foreground mb-1">Deep diagnostics</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Inspect system-level events, infrastructure issues, and platform diagnostics.
          </p>
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
    <div className="surface-elevated rounded-2xl p-6 card-hover glow-primary">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-2xl bg-primary/15 ring-1 ring-primary/10">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">AI Governance Insights</p>
          <p className="text-[11px] text-muted-foreground">
            AI-generated · refreshes every 2 minutes
          </p>
        </div>
        {isLoading && (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      {insights?.summary && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 pb-4 border-b border-border/50">
          {insights.summary}
        </p>
      )}

      <div className="space-y-2.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-10 rounded-2xl" />
          ))
        ) : insights?.insights?.length ? (
          insights.insights.map((ins, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-2xl ${
                typeStyle[ins.type] ?? typeStyle.info
              } animate-in`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {typeIcon[ins.type] ?? typeIcon.info}
              <div className="min-w-0">
                <p className="text-xs font-semibold mb-1">{ins.title}</p>
                <p className="text-xs leading-relaxed opacity-85">{ins.message}</p>
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
    { refetchInterval: 90000 }
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
    <div className="surface-elevated rounded-2xl p-6 border border-amber-500/20 card-hover">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-2xl bg-amber-500/15 ring-1 ring-amber-500/10">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Anomaly Alerts</p>
          <p className="text-[11px] text-muted-foreground">AI-detected governance issues</p>
        </div>
        {isLoading && (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        )}
        {anomalies.length > 0 && (
          <span className="text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
            {anomalies.length}
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-2xl" />
          ))
        ) : (
          anomalies.map((a, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-2xl ${
                severityStyle[a.severity] ?? severityStyle.info
              } animate-in cursor-pointer hover:opacity-90 transition-opacity`}
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() =>
                a.workflowId !== "SYSTEM" && setLocation(`/workflows/${a.workflowId}`)
              }
            >
              <span
                className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                  severityDot[a.severity] ?? "bg-blue-400"
                }`}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold capitalize">
                    {a.type.replace(/_/g, " ")}
                  </span>
                  {a.workflowId !== "SYSTEM" && (
                    <code className="text-[10px] font-mono opacity-60">{a.workflowId}</code>
                  )}
                </div>
                <p className="text-xs opacity-85 leading-relaxed">{a.message}</p>
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
      <div className="surface-elevated rounded-2xl p-6">
        <p className="text-sm font-semibold text-foreground mb-3">Workflow Health</p>
        <div className="skeleton h-2 rounded-full" />
      </div>
    );
  }

  const pct = (n: number) => `${Math.round((n / stats.total) * 100)}%`;

  return (
    <div className="surface-elevated rounded-2xl p-6 card-hover">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">Workflow Health</p>
        <span className="text-xs text-muted-foreground">{stats.total} total</span>
      </div>

      <div className="h-2 rounded-full overflow-hidden flex gap-0.5 bg-muted/40">
        {stats.completed > 0 && (
          <div
            className="bg-emerald-500 rounded-full transition-all"
            style={{ width: pct(stats.completed) }}
          />
        )}
        {stats.running > 0 && (
          <div
            className="bg-blue-500 rounded-full transition-all"
            style={{ width: pct(stats.running) }}
          />
        )}
        {stats.pending > 0 && (
          <div
            className="bg-amber-500 rounded-full transition-all"
            style={{ width: pct(stats.pending) }}
          />
        )}
        {stats.failed > 0 && (
          <div
            className="bg-red-500 rounded-full transition-all"
            style={{ width: pct(stats.failed) }}
          />
        )}
      </div>

      <div className="flex items-center gap-4 mt-4 flex-wrap">
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
  const { data: workflows, isLoading, refetch, isFetching } =
    trpc.airtable.workflows.useQuery(undefined, { refetchInterval: 60000 });

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

        const matchStatus =
          statusFilter === "all" || w.status.toLowerCase() === statusFilter;
        const matchRuntime =
          runtimeFilter === "all" || w.runtime.toLowerCase() === runtimeFilter;

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
      <div className="surface-elevated rounded-2xl p-4">
        <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3">
          <div className="relative flex-1 w-full xl:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search workflows, IDs, requesters…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-muted/30 border-border/60 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs w-32 bg-muted/30 border-border/60 rounded-xl">
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
              <SelectTrigger className="h-9 text-xs w-28 bg-muted/30 border-border/60 rounded-xl">
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
              className="h-9 w-9 rounded-xl"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <div className="xl:ml-auto">
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {workflows?.length ?? 0} workflows
            </span>
          </div>
        </div>
      </div>

      <div className="surface-elevated rounded-2xl overflow-hidden card-hover">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/15">
                {cols.map((col) => (
                  <th
                    key={col.label}
                    className={`text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em] whitespace-nowrap ${
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
                  <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
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
                      <td key={j} className="px-4 py-4">
                        <div className="skeleton h-4 rounded-xl w-full" />
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
                    className={`border-b border-border/40 last:border-0 cursor-pointer transition-colors ${
                      idx % 2 === 0 ? "bg-card/60" : "bg-background/20"
                    } hover:bg-primary/5`}
                  >
                    <td className="px-4 py-4">
                      <span className="code-inline">{wf.workflowId}</span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-xs font-medium text-foreground max-w-[220px] truncate block">
                        {wf.name}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <RuntimeBadge runtime={wf.runtime} />
                    </td>

                    <td className="px-4 py-4">
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

                    <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      {wf.requestedBy}
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {wf.reportPeriod ?? "—"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        {fmtDate(wf.dateRequested)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-xs whitespace-nowrap">
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
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-60 hover:opacity-100 rounded-xl"
                              disabled={updatingId === wf.recordId}
                            >
                              {updatingId === wf.recordId ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl">
                            <DropdownMenuLabel className="text-[11px]">
                              Set Status
                            </DropdownMenuLabel>
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
                                  updateStatus.mutate({
                                    recordId: wf.recordId,
                                    status: s,
                                  })
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
    trpc.airtable.dashboardStats.useQuery(undefined, { refetchInterval: 60000 });

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
          lastSync.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
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
    <DashboardLayout breadcrumbs={[{ label: "Workspace" }]}>
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Hero */}
        <div className="surface-elevated rounded-3xl p-6 md:p-7 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_28%),radial-gradient(circle_at_left,rgba(16,185,129,0.06),transparent_20%)]" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary">
                <Sparkles className="w-3 h-3" />
                Enterprise Agent Governance
              </div>

              <div>
                <h1 className="text-heading text-2xl md:text-3xl">Governance Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                  Monitor autonomous workflows across Make and n8n, surface governance exceptions
                  early, and keep every decision path visible, reviewable, and audit-ready.
                </p>
              </div>

              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <RoleBadge role={role} />
                {relativeTime && (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono rounded-full bg-muted/20 border border-border/50 px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Synced {relativeTime}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="h-9 text-xs gap-1.5 bg-background border-border text-foreground hover:bg-accent rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </Button>

              {isAnalyst && (
                <Button
                  size="sm"
                  onClick={() => setLocation("/workflows/new")}
                  className="h-9 text-xs gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Workflow
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="surface-elevated rounded-2xl p-5 border border-blue-500/15 bg-blue-500/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 shrink-0">
              <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-300" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Quick Start</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                This workspace helps you monitor AI agents, workflows, logs, reports, and runtime
                health without needing to understand every technical detail first.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <button
                  onClick={() => setLocation("/workflows/new")}
                  className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-left hover:bg-primary/15 transition"
                >
                  <p className="text-xs font-semibold text-foreground mb-1">1. Create workflow</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Configure a Make or n8n automation.
                  </p>
                </button>

                <button
                  onClick={() => setLocation("/logs")}
                  className="rounded-2xl border border-border/70 bg-background/30 p-4 text-left hover:bg-accent/20 transition"
                >
                  <p className="text-xs font-semibold text-foreground mb-1">2. Check runs</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Review execution status and failures.
                  </p>
                </button>

                <button
                  onClick={() => setLocation("/help")}
                  className="rounded-2xl border border-border/70 bg-background/30 p-4 text-left hover:bg-accent/20 transition"
                >
                  <p className="text-xs font-semibold text-foreground mb-1">3. Ask GAIA AI</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Let the platform guide you to the right area.
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Access Profile */}
        <AccessPanel
          role={role}
          onGoToNewWorkflow={() => setLocation("/workflows/new")}
          onGoToLogs={() => setLocation("/logs")}
          onGoToSettings={() => setLocation("/settings")}
        />

        {/* Admin Controls */}
        {isAdmin && (
          <AdminControlPanel
            onGoToLogs={() => setLocation("/logs")}
            onGoToSettings={() => setLocation("/settings")}
            onGoToSystemLogs={() => setLocation("/system-logs")}
          />
        )}

        {/* Quick Actions */}
        <div className="surface-elevated rounded-2xl p-4 md:p-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground uppercase tracking-[0.16em] font-semibold mr-1">
              Quick Actions
            </span>

            {isAnalyst && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 bg-background border-border text-foreground hover:bg-accent hover:text-foreground rounded-xl"
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
                  className="h-8 text-xs gap-1.5 bg-background border-border text-foreground hover:bg-accent rounded-xl"
                  onClick={() => setLocation("/logs")}
                >
                  <Activity className="w-3 h-3 text-blue-400" />
                  Execution Logs
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 bg-background border-border text-foreground hover:bg-accent rounded-xl"
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
              className="h-8 text-xs gap-1.5 bg-background border-border text-foreground hover:bg-accent rounded-xl"
              onClick={() => setLocation("/reports")}
            >
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              Reports
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 bg-background border-border text-foreground hover:bg-accent rounded-xl"
              onClick={() => setLocation("/performance")}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              Performance Data
            </Button>

            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 bg-background border-border text-foreground hover:bg-accent rounded-xl"
                onClick={() => setLocation("/settings")}
              >
                <Users className="w-3 h-3 text-red-400" />
                Admin Settings
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))
          ) : (
            <>
              <StatCard
                label="Total Workflows"
                value={stats?.total ?? 0}
                icon={<Activity className="w-4 h-4" />}
                color="default"
                onClick={() => setLocation("/logs")}
              />
              <StatCard
                label="Completed"
                value={stats?.completed ?? 0}
                icon={<CheckCircle2 className="w-4 h-4" />}
                color="success"
                onClick={() => setLocation("/logs?status=completed")}
              />
              <StatCard
                label="Pending"
                value={stats?.pending ?? 0}
                icon={<Clock className="w-4 h-4" />}
                color="warning"
                onClick={() => setLocation("/logs?status=pending")}
              />
              <StatCard
                label="Failed"
                value={stats?.failed ?? 0}
                icon={<AlertTriangle className="w-4 h-4" />}
                color="error"
                onClick={() => setLocation("/logs?status=failed")}
              />
            </>
          )}
        </div>

        {/* Runtime Distribution + Health + Insights */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="surface-elevated rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Runtime Distribution</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Agent activity split by orchestration layer
                </p>
              </div>
              <div className="rounded-2xl bg-primary/10 ring-1 ring-primary/10 p-2">
                <Zap className="w-4 h-4 text-primary" />
              </div>
            </div>

            {statsLoading ? (
              <div className="space-y-3">
                <div className="skeleton h-12 rounded-2xl" />
                <div className="skeleton h-12 rounded-2xl" />
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { name: "Make", count: stats?.make ?? 0, color: "bg-violet-500", icon: "text-violet-400" },
                  { name: "n8n", count: stats?.n8n ?? 0, color: "bg-orange-500", icon: "text-orange-400" },
                ].map((rt) => {
                  const pct = stats?.total
                    ? Math.round((rt.count / stats.total) * 100)
                    : 0;
                  return (
                    <div key={rt.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className={`w-3.5 h-3.5 ${rt.icon}`} />
                          <span className="text-xs font-medium text-foreground">{rt.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">{rt.count}</span>
                          <span className="text-[11px] text-muted-foreground">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${rt.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {stats && (
                  <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Success rate</span>
                    <span className="text-sm font-semibold text-emerald-400">
                      {stats.total > 0
                        ? `${Math.round((stats.completed / stats.total) * 100)}%`
                        : "—"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <HealthBar stats={stats} />
          <InsightsPanel />
        </div>

        {/* Anomaly Alerts */}
        <AnomalyPanel />

        {/* Workflow Registry */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">All Workflows</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Live operational records sourced from Airtable
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground rounded-xl"
              onClick={() => setLocation("/reports")}
            >
              View reports
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>

          <WorkflowTable role={role} />
        </div>

        {/* Viewer notice */}
        {isViewer && (
          <div className="surface-elevated rounded-2xl p-5 border border-blue-500/15 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-3.5 h-3.5 text-blue-500 dark:text-blue-300" />
              <p className="text-sm font-semibold text-foreground">Read-only mode</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Viewer accounts can inspect governance summaries, reports, performance trends, and
              workflow outcomes, but cannot create workflows or perform operational actions.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
