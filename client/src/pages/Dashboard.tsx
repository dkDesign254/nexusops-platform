import DashboardLayout from "@/components/DashboardLayout";
import {
  EmptyState,
  RuntimeBadge,
  SectionHeader,
  StatsCard,
  StatusBadge,
} from "@/components/AgentOpsUI";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useLocation } from "wouter";

function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: stats, isLoading: statsLoading } = trpc.airtable.dashboardStats.useQuery();
  const { data: workflows, isLoading: wfLoading } = trpc.airtable.workflows.useQuery();

  const isLoading = statsLoading || wfLoading;

  const refresh = () => {
    utils.airtable.dashboardStats.invalidate();
    utils.airtable.workflows.invalidate();
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Governance Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Runtime-independent supervision of AI-driven marketing workflows · Live from Airtable
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
              className="gap-2 bg-transparent"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setLocation("/workflows/new")}
              className="gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              New Workflow
            </Button>
          </div>
        </div>

        {/* Stats grid */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              label="Total Workflows"
              value={stats?.total ?? 0}
              icon={<Activity className="w-4 h-4" />}
            />
            <StatsCard
              label="Completed"
              value={stats?.completed ?? 0}
              icon={<CheckCircle2 className="w-4 h-4" />}
            />
            <StatsCard
              label="Running"
              value={stats?.running ?? 0}
              icon={<Loader2 className="w-4 h-4" />}
            />
            <StatsCard
              label="Failed"
              value={stats?.failed ?? 0}
              icon={<AlertTriangle className="w-4 h-4" />}
            />
          </div>
        )}

        {/* Runtime split */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Make Runtime</p>
                <p className="text-3xl font-semibold text-foreground mt-1">{stats.make}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">n8n Runtime</p>
                <p className="text-3xl font-semibold text-foreground mt-1">{stats.n8n}</p>
              </div>
            </div>
          </div>
        )}

        {/* Workflow table */}
        <div>
          <SectionHeader
            title="All Workflows"
            description="Weekly Marketing Performance Reporting executions — sourced from Airtable"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/workflows/new")}
                className="gap-2 bg-transparent text-xs"
              >
                <Plus className="w-3 h-3" />
                Create
              </Button>
            }
          />

          {wfLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !workflows || workflows.length === 0 ? (
            <EmptyState
              icon={<Activity className="w-8 h-8" />}
              title="No workflows yet"
              description="Create your first Weekly Marketing Performance Reporting workflow to get started."
              action={
                <Button
                  size="sm"
                  onClick={() => setLocation("/workflows/new")}
                  className="gap-2 mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Workflow
                </Button>
              }
            />
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Workflow ID", "Workflow", "Runtime", "Status", "Requested By", "Report Period", "Date Requested", "Date Completed"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workflows.map((wf, idx) => (
                    <tr
                      key={wf.recordId}
                      onClick={() => setLocation(`/workflows/${wf.recordId}`)}
                      className={`border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-accent/40 ${
                        idx % 2 === 0 ? "bg-card" : "bg-background"
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <code className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {wf.workflowId}
                        </code>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-foreground text-xs">{wf.name}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <RuntimeBadge runtime={wf.runtime} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={wf.status} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">{wf.requestedBy}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">{wf.reportPeriod ?? "—"}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {formatDate(wf.dateRequested)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {wf.dateCompleted ? (
                          <span className="flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {new Date(wf.dateCompleted).toLocaleDateString()}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending note */}
        {!statsLoading && stats && stats.pending > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-5 py-4 flex items-start gap-3">
            <Clock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-300">
                {stats.pending} workflow{stats.pending !== 1 ? "s" : ""} pending execution
              </p>
              <p className="text-xs text-amber-400/60 mt-0.5">
                These workflows have been routed to their respective runtimes and are awaiting execution confirmation.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
