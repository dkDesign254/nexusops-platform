import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

function fmtDateTime(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ReportRow = {
  recordId: string;
  reportId: string;
  workflowId: string;
  workflowRecordIds: string[];
  executiveSummary: string;
  keyInsights: string;
  risksOrAnomalies: string;
  recommendation: string;
  approved: boolean;
  reportTimestamp: string | null;
};

function ReportCard({
  report,
  onApprove,
  isApproving,
}: {
  report: ReportRow;
  onApprove: (recordId: string) => void;
  isApproving: boolean;
}) {
  const [, setLocation] = useLocation();
  const [expanded, setExpanded] = useState(false);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${report.reportId}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`Exported ${report.reportId}.json`);
  };

  return (
    <div className="surface-elevated rounded-2xl overflow-hidden border border-border/70 card-hover animate-in">
      <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-border/50 bg-muted/10">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 rounded-2xl bg-primary/10 ring-1 ring-primary/10 mt-0.5 shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold font-mono text-foreground">
                {report.reportId}
              </span>
              <span className="text-xs text-muted-foreground">→</span>
              <button
                onClick={() =>
                  setLocation(`/workflows/${report.workflowRecordIds[0] ?? report.workflowId}`)
                }
                className="text-xs text-primary hover:underline font-mono"
              >
                {report.workflowId}
              </button>

              {report.approved ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Approved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-3 h-3" />
                  Pending
                </span>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground font-mono mt-1">
              {fmtDateTime(report.reportTimestamp)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl"
            onClick={exportJSON}
            title="Export JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl"
            onClick={() =>
              setLocation(`/workflows/${report.workflowRecordIds[0] ?? report.workflowId}`)
            }
            title="View workflow"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>

          {!report.approved && (
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 rounded-xl bg-[var(--primary)] text-white hover:opacity-90"
              onClick={() => onApprove(report.recordId)}
              disabled={isApproving}
            >
              {isApproving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3" />
              )}
              Approve
            </Button>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-b border-border/30 bg-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Executive Summary
          </span>
        </div>

        <p
          className={`text-sm text-foreground/90 leading-relaxed ${
            !expanded ? "line-clamp-2" : ""
          }`}
        >
          {report.executiveSummary || (
            <span className="text-muted-foreground italic">No summary available</span>
          )}
        </p>
      </div>

      {expanded && (
        <div className="divide-y divide-border/30">
          <div className="px-5 py-4 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Key Insights
              </span>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
              {report.keyInsights || "—"}
            </p>
          </div>

          <div className="px-5 py-4 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Risks & Anomalies
              </span>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
              {report.risksOrAnomalies || "—"}
            </p>
          </div>

          <div className="px-5 py-4 bg-emerald-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Recommendations
              </span>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
              {report.recommendation || "—"}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors border-t border-border/30"
      >
        {expanded ? "Collapse report" : "Expand full report"}
        <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );
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

function ChartCard({
  title,
  subtitle,
  children,
  icon,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="surface-elevated rounded-2xl p-5 border border-border/70 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="p-2 rounded-2xl bg-primary/10 ring-1 ring-primary/10">
          {icon}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function ReportsPage() {
  const [search, setSearch] = useState("");
  const [filterApproved, setFilterApproved] = useState<"all" | "approved" | "pending">("all");
  const utils = trpc.useUtils();

  const { data: reports = [], isLoading, dataUpdatedAt, refetch } =
    trpc.airtable.finalReports.useQuery({}, { refetchInterval: 60000 });

  const approveMutation = trpc.airtable.approveReport.useMutation({
    onSuccess: () => {
      toast.success("Report approved and synced to Airtable");
      utils.airtable.finalReports.invalidate();
    },
    onError: (err) => toast.error(`Approval failed: ${err.message}`),
  });

  const validReports = useMemo(
    () => reports.filter((r) => r.executiveSummary && r.executiveSummary.trim() !== ""),
    [reports]
  );

  const skippedCount = reports.length - validReports.length;

  const filtered = useMemo(() => {
    return validReports.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        r.reportId.toLowerCase().includes(q) ||
        r.workflowId.toLowerCase().includes(q) ||
        r.executiveSummary.toLowerCase().includes(q);

      const matchFilter =
        filterApproved === "all" ||
        (filterApproved === "approved" && r.approved) ||
        (filterApproved === "pending" && !r.approved);

      return matchSearch && matchFilter;
    });
  }, [validReports, search, filterApproved]);

  const approvedCount = validReports.filter((r) => r.approved).length;
  const pendingCount = validReports.filter((r) => !r.approved).length;
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—";

  const { data: perfData = [] } = trpc.airtable.performanceData.useQuery({});

  const periodMap = new Map<
    string,
    { period: string; spend: number; conversions: number; clicks: number }
  >();

  for (const row of perfData) {
    const key = row.reportingPeriod ?? "Unknown";
    const existing = periodMap.get(key) ?? {
      period: key,
      spend: 0,
      conversions: 0,
      clicks: 0,
    };

    periodMap.set(key, {
      period: key,
      spend: existing.spend + row.spend,
      conversions: existing.conversions + row.conversions,
      clicks: existing.clicks + row.clicks,
    });
  }

  const trendData = Array.from(periodMap.values()).sort((a, b) =>
    a.period.localeCompare(b.period)
  );

  return (
    <DashboardLayout
      breadcrumbs={[{ label: "Dashboard", path: "/" }, { label: "Reports" }]}
    >
      <div className="max-w-[1180px] mx-auto space-y-6">
        <div className="surface-elevated rounded-3xl p-6 md:p-7 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_28%),radial-gradient(circle_at_left,rgba(16,185,129,0.06),transparent_22%)]" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary">
                <Sparkles className="w-3 h-3" />
                Executive Reporting Intelligence
              </div>

              <div>
                <h1 className="text-heading text-2xl md:text-3xl">Final Reports</h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                  Review AI-generated governance summaries, approve decision-ready reports,
                  and track execution quality across operational workflows.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                <Bot className="w-3.5 h-3.5" />
                <span>Sourced from Airtable</span>
                <span className="opacity-40">•</span>
                <span>Last synced {lastUpdated}</span>
                {filtered.length !== validReports.length && (
                  <>
                    <span className="opacity-40">•</span>
                    <span>
                      Showing {filtered.length} of {validReports.length}
                    </span>
                  </>
                )}
                {skippedCount > 0 && (
                  <>
                    <span className="opacity-40">•</span>
                    <span>
                      {skippedCount} incomplete {skippedCount === 1 ? "record" : "records"} hidden
                    </span>
                  </>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs bg-transparent rounded-xl self-start lg:self-auto"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {trendData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="Spend Trend by Period"
              subtitle="Total marketing spend per reporting period"
              icon={<TrendingUp className="w-4 h-4 text-primary" />}
            >
              <ResponsiveContainer width="100%" height={180}>
                <LineChart
                  data={trendData}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="spend"
                    stroke="hsl(38 92% 55%)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "hsl(38 92% 55%)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Conversions by Period"
              subtitle="Goal completions per reporting period"
              icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
            >
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={trendData}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Bar
                    dataKey="conversions"
                    fill="hsl(152 69% 45%)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            label="Total Reports"
            value={validReports.length}
            icon={<FileText className="w-4 h-4 text-primary" />}
          />
          <MetricCard
            label="Approved"
            value={approvedCount}
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            valueClassName="text-emerald-400"
          />
          <MetricCard
            label="Pending Approval"
            value={pendingCount}
            icon={<Clock className="w-4 h-4 text-amber-400" />}
            valueClassName="text-amber-400"
          />
        </div>

        <div className="surface-elevated rounded-2xl p-4 md:p-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by report ID, workflow ID, or summary content…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-muted/30 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/30 border border-border">
              <Filter className="w-3.5 h-3.5 text-muted-foreground ml-2" />
              {(["all", "approved", "pending"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterApproved(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    filterApproved === f
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-56 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="surface-elevated rounded-2xl py-24 flex flex-col items-center gap-4 text-muted-foreground">
            <FileText className="w-10 h-10 opacity-20" />
            <div className="text-center">
              <p className="text-sm font-medium">No reports found</p>
              <p className="text-xs opacity-60 mt-1">
                {search || filterApproved !== "all"
                  ? "Try adjusting your search or filter"
                  : "Reports appear here after workflow completion and AI generation"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((report) => (
              <ReportCard
                key={report.recordId}
                report={report}
                onApprove={(recordId) => approveMutation.mutate({ recordId })}
                isApproving={
                  approveMutation.isPending &&
                  approveMutation.variables?.recordId === report.recordId
                }
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
