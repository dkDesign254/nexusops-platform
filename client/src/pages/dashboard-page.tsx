/**
 * NexusOps — DashboardPage
 *
 * Governance command centre. The first page a signed-in user sees.
 * Assembles the sidebar, topbar, and all dashboard widgets into a
 * coherent governance overview.
 *
 * Route: /dashboard (protected — requires auth session)
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { MobileSidebar, Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { MetricsRow } from "@/components/dashboard/metrics-row";
import { GovernanceHealth } from "@/components/dashboard/governance-health";
import { RecentWorkflows } from "@/components/dashboard/recent-workflows";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { GovernanceScoreGauge } from "@/components/dashboard/governance-score-gauge";
import { ExecutionTimelineChart } from "@/components/dashboard/execution-timeline-chart";
import { RuntimeSplitChart } from "@/components/dashboard/runtime-split-chart";
import { AnomalyAlerts } from "@/components/dashboard/anomaly-alerts";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { useWorkflows } from "@/hooks/use-workflows";
import { useT } from "@/contexts/LocaleContext";
import type { WorkflowRow } from "@/components/dashboard/recent-workflows";
import type { ExecutionDot } from "@/components/dashboard/governance-health";

export default function DashboardPage(): JSX.Element {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { metrics, quickStats, loading: metricsLoading } = useDashboardMetrics();
  const { data: workflows, loading: wfLoading } = useWorkflows();
  const T = useT();
  const [, navigate] = useLocation();

  // Map last 10 workflows to execution dots for the governance health timeline
  const recentDots: ExecutionDot[] = workflows.slice(0, 10).map((wf) => ({
    workflowId: wf.workflow_id ?? wf.id,
    status: (wf.status?.toLowerCase() ?? "pending") as ExecutionDot["status"],
    timestamp: wf.date_requested ?? wf.created_at ?? "",
  }));

  // Most recent workflow for runtime badge
  const lastWf = workflows[0];

  // Map workflows to table rows
  const tableRows: WorkflowRow[] = workflows.slice(0, 10).map((wf) => ({
    id: wf.id,
    workflowId: wf.workflow_id ?? wf.id,
    workflowName: wf.workflow_name ?? "—",
    runtime: wf.runtime_used,
    status: wf.status ?? "Pending",
    reportPeriod: wf.report_period,
    durationMins: wf.duration_mins,
  }));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
      </div>

      {/* Mobile sidebar overlay */}
      <MobileSidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar title={T("nav.dashboard")} failedCount={metrics.failed} onMobileMenuOpen={() => setMobileNavOpen(true)} />

        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

            {/* Welcome */}
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
                {T("dash.title")}
              </h1>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                {T("dash.subtitle")}
              </p>
            </div>

            {/* Metrics row */}
            {!metricsLoading && (
              <MetricsRow
                total={metrics.total}
                completed={metrics.completed}
                failed={metrics.failed}
                pending={metrics.pending}
              />
            )}
            {metricsLoading && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)" }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 100, borderRadius: "var(--radius-lg)" }} />
                ))}
              </div>
            )}

            {/* Governance health */}
            <GovernanceHealth
              coveragePercent={metrics.coveragePercent}
              recentExecutions={recentDots}
              lastExecutedAt={lastWf?.date_requested ? new Date(lastWf.date_requested).toLocaleString() : undefined}
              lastRuntime={lastWf?.runtime_used ?? undefined}
            />

            {/* Recent workflows table */}
            <RecentWorkflows workflows={tableRows} loading={wfLoading} />

            {/* Quick stats */}
            <QuickStats
              aiCallsThisWeek={quickStats.aiCallsThisWeek}
              reportsPendingApproval={quickStats.reportsPendingApproval}
              avgDurationMins={quickStats.avgDurationMins}
            />

            {/* Analytics row: Governance gauge + Anomaly alerts */}
            {!wfLoading && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <GovernanceScoreGauge
                  totalWorkflows={metrics.total}
                  completedWorkflows={metrics.completed}
                  failedWorkflows={metrics.failed}
                  totalReports={quickStats.reportsPendingApproval}
                  approvedReports={0}
                  workflowsWithLogs={workflows.filter((w) => (w.log_count ?? 0) > 0).length}
                  workflowsWithAiLogs={0}
                />
                <AnomalyAlerts workflows={workflows} onNavigate={navigate} />
              </div>
            )}

            {/* Charts row: Execution timeline + Runtime split */}
            {!wfLoading && (
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-4)" }}>
                <ExecutionTimelineChart workflows={workflows} />
                <RuntimeSplitChart workflows={workflows} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
