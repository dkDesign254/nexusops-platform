import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

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

function StatusBadge({ status }: { status: string }) {
  const value = status?.toLowerCase() ?? "";

  const styleMap: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const tone = styleMap[value] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${tone}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status}
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

function KpiCard({
  title,
  value,
  description,
  icon,
  tone = "default",
  onClick,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  tone?: "default" | "info" | "success" | "warning" | "danger";
  onClick?: () => void;
}) {
  const toneMap = {
    default: "text-primary bg-primary/10 border-primary/20",
    info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    danger: "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <div
      onClick={onClick}
      className={`surface-elevated rounded-2xl p-5 ${onClick ? "card-hover cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-2xl border ${toneMap[tone]}`}>{icon}</div>
      </div>

      <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="text-sm font-semibold text-foreground mt-2">{title}</p>
      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{description}</p>
    </div>
  );
}

function QuickStartGuide({
  onGoCreate,
  onGoLogs,
  onGoHelp,
}: {
  onGoCreate: () => void;
  onGoLogs: () => void;
  onGoHelp: () => void;
}) {
  return (
    <div className="surface-elevated rounded-2xl p-5 border border-blue-500/15 bg-blue-500/5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 shrink-0">
          <Sparkles className="w-4 h-4 text-blue-400" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Quick Start</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            This workspace helps you monitor AI agents, workflows, logs, reports, and runtime health without needing to understand the whole system first.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <button
              onClick={onGoCreate}
              className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-left hover:bg-primary/15 transition"
            >
              <p className="text-xs font-semibold text-foreground mb-1">1. Create a workflow</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Start building an automation for Make or n8n.
              </p>
            </button>

            <button
              onClick={onGoLogs}
              className="rounded-2xl border border-border/70 bg-background/30 p-4 text-left hover:bg-accent/20 transition"
            >
              <p className="text-xs font-semibold text-foreground mb-1">2. Check logs</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Understand what happened step by step across workflows and AI actions.
              </p>
            </button>

            <button
              onClick={onGoHelp}
              className="rounded-2xl border border-border/70 bg-background/30 p-4 text-left hover:bg-accent/20 transition"
            >
              <p className="text-xs font-semibold text-foreground mb-1">3. Use AI Help</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Let the app guide you to the right area and explain workflows in plain language.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon,
  onClick,
  cta,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  cta: string;
}) {
  return (
    <button
      onClick={onClick}
      className="surface-elevated rounded-2xl p-5 text-left card-hover hover:bg-accent/10 transition"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="p-2 rounded-2xl bg-primary/10 border border-primary/20">
          {icon}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground mt-1" />
      </div>

      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
        {description}
      </p>
      <p className="text-[11px] text-primary mt-3 font-medium">{cta}</p>
    </button>
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

  return (
    <div className="surface-elevated rounded-2xl p-6 glow-primary">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-2xl bg-primary/15 border border-primary/10">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">AI Governance Insights</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            AI-generated summaries and alerts
          </p>
        </div>
      </div>

      {insights?.summary && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 pb-4 border-b border-border/50">
          {insights.summary}
        </p>
      )}

      <div className="space-y-2.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-2xl" />
          ))
        ) : insights?.insights?.length ? (
          insights.insights.map((ins, i) => (
            <div
              key={i}
              className={`rounded-2xl p-3 animate-in ${
                typeStyle[ins.type] ?? typeStyle.info
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <p className="text-xs font-semibold mb-1">{ins.title}</p>
              <p className="text-xs opacity-85 leading-relaxed">{ins.message}</p>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">No insights available yet.</p>
        )}
      </div>
    </div>
  );
}

function WorkflowRegistry() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const { data: workflows, isLoading, refetch, isFetching } =
    trpc.airtable.workflows.useQuery(undefined, {
      refetchInterval: 60000,
    });

  const filtered = useMemo(() => {
    if (!workflows) return [];
    const q = search.toLowerCase();

    return workflows.filter((w) => {
      return (
        !q ||
        w.workflowId.toLowerCase().includes(q) ||
        w.name.toLowerCase().includes(q) ||
        w.requestedBy.toLowerCase().includes(q) ||
        (w.reportPeriod ?? "").toLowerCase().includes(q)
      );
    });
  }, [workflows, search]);

  return (
    <div className="space-y-4">
      <div className="surface-elevated rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
          <div className="relative flex-1 w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search workflows, IDs, requesters…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-muted/30 border-border/60 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 lg:ml-auto">
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
        </div>
      </div>

      <div className="surface-elevated rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/15">
                {["Workflow ID", "Name", "Runtime", "Status", "Requested By", "Requested"].map(
                  (label) => (
                    <th
                      key={label}
                      className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em] whitespace-nowrap"
                    >
                      {label}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="skeleton h-4 rounded-xl w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Workflow className="w-8 h-8 opacity-30" />
                      <p className="text-sm font-medium">No workflows found</p>
                      <p className="text-xs opacity-70">
                        Create your first workflow or adjust your search.
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
                    <td className="px-4 py-4 text-xs font-medium text-foreground">
                      {wf.name}
                    </td>
                    <td className="px-4 py-4">
                      <RuntimeBadge runtime={wf.runtime} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={wf.status} />
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      {wf.requestedBy}
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(wf.dateRequested)}
                    </td>
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

  const role = (user?.role as UserRole) ?? "viewer";
  const isAnalyst = role === "admin" || role === "analyst";

  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [relativeTime, setRelativeTime] = useState("");

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
      <div className="max-w-[1440px] mx-auto space-y-6">
        <div className="surface-elevated rounded-3xl p-6 md:p-7 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_28%),radial-gradient(circle_at_left,rgba(16,185,129,0.06),transparent_20%)]" />
          <div className="relative flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary">
                <Sparkles className="w-3 h-3" />
                Agent Operations Command
              </div>

              <div>
                <h1 className="text-heading text-3xl md:text-4xl">
                  Run and understand company workflows from one place.
                </h1>
                <p className="text-sm text-muted-foreground mt-3 max-w-3xl leading-relaxed">
                  Monitor AI-powered workflows, inspect logs, review performance,
                  and apply governance without making the product feel harder than the work itself.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <RoleBadge role={role} />
                {relativeTime && (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono rounded-full bg-muted/20 border border-border/50 px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Synced {relativeTime}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="h-9 text-xs gap-1.5 bg-transparent rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </Button>

              {isAnalyst && (
                <Button
                  size="sm"
                  onClick={() => setLocation("/workflows/new")}
                  className="h-9 text-xs gap-1.5 rounded-xl bg-[var(--primary)] text-white hover:opacity-90"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Workflow
                </Button>
              )}
            </div>
          </div>
        </div>

        <QuickStartGuide
          onGoCreate={() => setLocation("/workflows/new")}
          onGoLogs={() => setLocation("/logs")}
          onGoHelp={() => setLocation("/help")}
        />

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))
          ) : (
            <>
              <KpiCard
                title="Active Agents"
                value={stats?.running ?? 0}
                description="Currently executing"
                icon={<Bot className="w-4 h-4" />}
                tone="info"
                onClick={() => setLocation("/logs")}
              />
              <KpiCard
                title="Completed"
                value={stats?.completed ?? 0}
                description="Successful runs"
                icon={<CheckCircle2 className="w-4 h-4" />}
                tone="success"
                onClick={() => setLocation("/reports")}
              />
              <KpiCard
                title="Pending"
                value={stats?.pending ?? 0}
                description="Awaiting execution"
                icon={<Clock className="w-4 h-4" />}
                tone="warning"
              />
              <KpiCard
                title="Errors"
                value={stats?.failed ?? 0}
                description="Need investigation"
                icon={<AlertTriangle className="w-4 h-4" />}
                tone="danger"
                onClick={() => setLocation("/logs")}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard
              title="Create or configure a workflow"
              description="Set up a new automation flow for Make or n8n and move into operations quickly."
              icon={<Workflow className="w-4 h-4 text-primary" />}
              onClick={() => setLocation("/workflows/new")}
              cta="Open workflow setup"
            />
            <ActionCard
              title="Inspect execution logs"
              description="Trace runtime events, failures, and step-by-step workflow behaviour."
              icon={<Activity className="w-4 h-4 text-blue-400" />}
              onClick={() => setLocation("/logs")}
              cta="Open execution logs"
            />
            <ActionCard
              title="Review reports"
              description="Read summaries, insights, anomalies, and recommendations."
              icon={<FileText className="w-4 h-4 text-amber-400" />}
              onClick={() => setLocation("/reports")}
              cta="Open reports"
            />
            <ActionCard
              title="Use AI Help"
              description="Get guided help understanding workflows and where to go next."
              icon={<Bot className="w-4 h-4 text-purple-400" />}
              onClick={() => setLocation("/help")}
              cta="Open AI Help"
            />
          </div>

          <InsightsPanel />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Workflow Registry</h2>
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

          <WorkflowRegistry />
        </div>

        {role === "viewer" && (
          <div className="surface-elevated rounded-2xl p-5 border border-blue-500/15 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-sm font-semibold text-foreground">Read-only mode</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Viewer accounts can inspect dashboards, workflow outcomes, reports, and trends, but cannot create or administer workflows.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

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

function StatusBadge({ status }: { status: string }) {
  const value = status?.toLowerCase() ?? "";

  const styleMap: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const tone = styleMap[value] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${tone}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status}
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

function KpiCard({
  title,
  value,
  description,
  icon,
  tone = "default",
  onClick,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  tone?: "default" | "info" | "success" | "warning" | "danger";
  onClick?: () => void;
}) {
  const toneMap = {
    default: "text-primary bg-primary/10 border-primary/20",
    info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    danger: "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <div
      onClick={onClick}
      className={`surface-elevated rounded-2xl p-5 ${onClick ? "card-hover cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-2xl border ${toneMap[tone]}`}>{icon}</div>
      </div>

      <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="text-sm font-semibold text-foreground mt-2">{title}</p>
      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{description}</p>
    </div>
  );
}

function QuickStartGuide({
  onGoCreate,
  onGoLogs,
  onGoHelp,
}: {
  onGoCreate: () => void;
  onGoLogs: () => void;
  onGoHelp: () => void;
}) {
  return (
    <div className="surface-elevated rounded-2xl p-5 border border-blue-500/15 bg-blue-500/5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 shrink-0">
          <Sparkles className="w-4 h-4 text-blue-400" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Quick Start</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            This workspace helps you monitor AI agents, workflows, logs, reports, and runtime health without needing to understand the whole system first.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <button
              onClick={onGoCreate}
              className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-left hover:bg-primary/15 transition"
            >
              <p className="text-xs font-semibold text-foreground mb-1">1. Create a workflow</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Start building an automation for Make or n8n.
              </p>
            </button>

            <button
              onClick={onGoLogs}
              className="rounded-2xl border border-border/70 bg-background/30 p-4 text-left hover:bg-accent/20 transition"
            >
              <p className="text-xs font-semibold text-foreground mb-1">2. Check logs</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Understand what happened step by step across workflows and AI actions.
              </p>
            </button>

            <button
              onClick={onGoHelp}
              className="rounded-2xl border border-border/70 bg-background/30 p-4 text-left hover:bg-accent/20 transition"
            >
              <p className="text-xs font-semibold text-foreground mb-1">3. Use AI Help</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Let the app guide you to the right area and explain workflows in plain language.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon,
  onClick,
  cta,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  cta: string;
}) {
  return (
    <button
      onClick={onClick}
      className="surface-elevated rounded-2xl p-5 text-left card-hover hover:bg-accent/10 transition"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="p-2 rounded-2xl bg-primary/10 border border-primary/20">
          {icon}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground mt-1" />
      </div>

      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
        {description}
      </p>
      <p className="text-[11px] text-primary mt-3 font-medium">{cta}</p>
    </button>
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

  return (
    <div className="surface-elevated rounded-2xl p-6 glow-primary">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-2xl bg-primary/15 border border-primary/10">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">AI Governance Insights</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            AI-generated summaries and alerts
          </p>
        </div>
      </div>

      {insights?.summary && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 pb-4 border-b border-border/50">
          {insights.summary}
        </p>
      )}

      <div className="space-y-2.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-2xl" />
          ))
        ) : insights?.insights?.length ? (
          insights.insights.map((ins, i) => (
            <div
              key={i}
              className={`rounded-2xl p-3 animate-in ${
                typeStyle[ins.type] ?? typeStyle.info
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <p className="text-xs font-semibold mb-1">{ins.title}</p>
              <p className="text-xs opacity-85 leading-relaxed">{ins.message}</p>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">No insights available yet.</p>
        )}
      </div>
    </div>
  );
}

function WorkflowRegistry() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const { data: workflows, isLoading, refetch, isFetching } =
    trpc.airtable.workflows.useQuery(undefined, {
      refetchInterval: 60000,
    });

  const filtered = useMemo(() => {
    if (!workflows) return [];
    const q = search.toLowerCase();

    return workflows.filter((w) => {
      return (
        !q ||
        w.workflowId.toLowerCase().includes(q) ||
        w.name.toLowerCase().includes(q) ||
        w.requestedBy.toLowerCase().includes(q) ||
        (w.reportPeriod ?? "").toLowerCase().includes(q)
      );
    });
  }, [workflows, search]);

  return (
    <div className="space-y-4">
      <div className="surface-elevated rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
          <div className="relative flex-1 w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search workflows, IDs, requesters…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-muted/30 border-border/60 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 lg:ml-auto">
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
        </div>
      </div>

      <div className="surface-elevated rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/15">
                {["Workflow ID", "Name", "Runtime", "Status", "Requested By", "Requested"].map(
                  (label) => (
                    <th
                      key={label}
                      className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em] whitespace-nowrap"
                    >
                      {label}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="skeleton h-4 rounded-xl w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Workflow className="w-8 h-8 opacity-30" />
                      <p className="text-sm font-medium">No workflows found</p>
                      <p className="text-xs opacity-70">
                        Create your first workflow or adjust your search.
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
                    <td className="px-4 py-4 text-xs font-medium text-foreground">
                      {wf.name}
                    </td>
                    <td className="px-4 py-4">
                      <RuntimeBadge runtime={wf.runtime} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={wf.status} />
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      {wf.requestedBy}
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(wf.dateRequested)}
                    </td>
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

  const role = (user?.role as UserRole) ?? "viewer";
  const isAnalyst = role === "admin" || role === "analyst";

  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [relativeTime, setRelativeTime] = useState("");

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
      <div className="max-w-[1440px] mx-auto space-y-6">
        <div className="surface-elevated rounded-3xl p-6 md:p-7 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_28%),radial-gradient(circle_at_left,rgba(16,185,129,0.06),transparent_20%)]" />
          <div className="relative flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary">
                <Sparkles className="w-3 h-3" />
                Agent Operations Command
              </div>

              <div>
                <h1 className="text-heading text-3xl md:text-4xl">
                  Run and understand company workflows from one place.
                </h1>
                <p className="text-sm text-muted-foreground mt-3 max-w-3xl leading-relaxed">
                  Monitor AI-powered workflows, inspect logs, review performance,
                  and apply governance without making the product feel harder than the work itself.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <RoleBadge role={role} />
                {relativeTime && (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono rounded-full bg-muted/20 border border-border/50 px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Synced {relativeTime}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="h-9 text-xs gap-1.5 bg-transparent rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </Button>

              {isAnalyst && (
                <Button
                  size="sm"
                  onClick={() => setLocation("/workflows/new")}
                  className="h-9 text-xs gap-1.5 rounded-xl bg-[var(--primary)] text-white hover:opacity-90"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Workflow
                </Button>
              )}
            </div>
          </div>
        </div>

        <QuickStartGuide
          onGoCreate={() => setLocation("/workflows/new")}
          onGoLogs={() => setLocation("/logs")}
          onGoHelp={() => setLocation("/help")}
        />

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))
          ) : (
            <>
              <KpiCard
                title="Active Agents"
                value={stats?.running ?? 0}
                description="Currently executing"
                icon={<Bot className="w-4 h-4" />}
                tone="info"
                onClick={() => setLocation("/logs")}
              />
              <KpiCard
                title="Completed"
                value={stats?.completed ?? 0}
                description="Successful runs"
                icon={<CheckCircle2 className="w-4 h-4" />}
                tone="success"
                onClick={() => setLocation("/reports")}
              />
              <KpiCard
                title="Pending"
                value={stats?.pending ?? 0}
                description="Awaiting execution"
                icon={<Clock className="w-4 h-4" />}
                tone="warning"
              />
              <KpiCard
                title="Errors"
                value={stats?.failed ?? 0}
                description="Need investigation"
                icon={<AlertTriangle className="w-4 h-4" />}
                tone="danger"
                onClick={() => setLocation("/logs")}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard
              title="Create or configure a workflow"
              description="Set up a new automation flow for Make or n8n and move into operations quickly."
              icon={<Workflow className="w-4 h-4 text-primary" />}
              onClick={() => setLocation("/workflows/new")}
              cta="Open workflow setup"
            />
            <ActionCard
              title="Inspect execution logs"
              description="Trace runtime events, failures, and step-by-step workflow behaviour."
              icon={<Activity className="w-4 h-4 text-blue-400" />}
              onClick={() => setLocation("/logs")}
              cta="Open execution logs"
            />
            <ActionCard
              title="Review reports"
              description="Read summaries, insights, anomalies, and recommendations."
              icon={<FileText className="w-4 h-4 text-amber-400" />}
              onClick={() => setLocation("/reports")}
              cta="Open reports"
            />
            <ActionCard
              title="Use AI Help"
              description="Get guided help understanding workflows and where to go next."
              icon={<Bot className="w-4 h-4 text-purple-400" />}
              onClick={() => setLocation("/help")}
              cta="Open AI Help"
            />
          </div>

          <InsightsPanel />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Workflow Registry</h2>
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

          <WorkflowRegistry />
        </div>

        {role === "viewer" && (
          <div className="surface-elevated rounded-2xl p-5 border border-blue-500/15 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-sm font-semibold text-foreground">Read-only mode</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Viewer accounts can inspect dashboards, workflow outcomes, reports, and trends, but cannot create or administer workflows.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
