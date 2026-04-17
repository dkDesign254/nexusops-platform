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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Report Card ──────────────────────────────────────────────────────────────

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
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${report.reportId}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`Exported ${report.reportId}.json`);
  };

  return (
    <div className="surface-1 rounded-xl overflow-hidden border border-border hover:border-border/80 transition-all animate-in-up">
      {/* Card header */}
      <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-border/50">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 mt-0.5 shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold font-mono">{report.reportId}</span>
              <span className="text-xs text-muted-foreground">→</span>
              <button
                onClick={() => setLocation(`/workflows/${report.workflowRecordIds[0] ?? report.workflowId}`)}
                className="text-xs text-primary hover:underline font-mono"
              >
                {report.workflowId}
              </button>
              {report.approved ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Approved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-3 h-3" /> Pending
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{fmtDateTime(report.reportTimestamp)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={exportJSON} title="Export JSON">
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLocation(`/workflows/${report.workflowRecordIds[0] ?? report.workflowId}`)} title="View workflow">
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
          {!report.approved && (
            <Button size="sm" className="h-7 text-xs gap-1.5" onClick={() => onApprove(report.recordId)} disabled={isApproving}>
              {isApproving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Approve
            </Button>
          )}
        </div>
      </div>

      {/* Executive Summary — always visible */}
      <div className="px-5 py-4 border-b border-border/30 bg-primary/3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Executive Summary</span>
        </div>
        <p className={`text-sm text-foreground/85 leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}>
          {report.executiveSummary || <span className="text-muted-foreground italic">No summary available</span>}
        </p>
      </div>

      {/* Expanded sections */}
      {expanded && (
        <div className="divide-y divide-border/30">
          <div className="px-5 py-4 bg-blue-500/3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Key Insights</span>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{report.keyInsights || "—"}</p>
          </div>
          <div className="px-5 py-4 bg-amber-500/3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Risks & Anomalies</span>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{report.risksOrAnomalies || "—"}</p>
          </div>
          <div className="px-5 py-4 bg-emerald-500/3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recommendations</span>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{report.recommendation || "—"}</p>
          </div>
        </div>
      )}

      {/* Toggle expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-2.5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors border-t border-border/30"
      >
        {expanded ? "Collapse report" : "Expand full report"}
        <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [search, setSearch] = useState("");
  const [filterApproved, setFilterApproved] = useState<"all" | "approved" | "pending">("all");
  const utils = trpc.useUtils();

  const { data: reports = [], isLoading, dataUpdatedAt, refetch } = trpc.airtable.finalReports.useQuery(
    {},
    { refetchInterval: 60000 }
  );

  const approveMutation = trpc.airtable.approveReport.useMutation({
    onSuccess: () => {
      toast.success("Report approved and synced to Airtable");
      utils.airtable.finalReports.invalidate();
    },
    onError: (err) => toast.error(`Approval failed: ${err.message}`),
  });

  // Filter out empty/placeholder reports — must have at least an executiveSummary
  const validReports = useMemo(
    () => reports.filter((r) => r.executiveSummary && r.executiveSummary.trim() !== ""),
    [reports]
  );
  const skippedCount = reports.length - validReports.length;

  const filtered = useMemo(() => {
    return validReports.filter(r => {
      const matchSearch = !search ||
        r.reportId.toLowerCase().includes(search.toLowerCase()) ||
        r.workflowId.toLowerCase().includes(search.toLowerCase()) ||
        r.executiveSummary.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filterApproved === "all" ||
        (filterApproved === "approved" && r.approved) ||
        (filterApproved === "pending" && !r.approved);
      return matchSearch && matchFilter;
    });
  }, [validReports, search, filterApproved]);

  const approvedCount = validReports.filter(r => r.approved).length;
  const pendingCount = validReports.filter(r => !r.approved).length;
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—";

  // Performance data for charts
  const { data: perfData = [] } = trpc.airtable.performanceData.useQuery({});

  // Aggregate spend and conversions by reporting period for trend charts
  const periodMap = new Map<string, { period: string; spend: number; conversions: number; clicks: number }>();
  for (const row of perfData) {
    const key = row.reportingPeriod ?? "Unknown";
    const existing = periodMap.get(key) ?? { period: key, spend: 0, conversions: 0, clicks: 0 };
    periodMap.set(key, {
      period: key,
      spend: existing.spend + row.spend,
      conversions: existing.conversions + row.conversions,
      clicks: existing.clicks + row.clicks,
    });
  }
  const trendData = Array.from(periodMap.values()).sort((a, b) => a.period.localeCompare(b.period));

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", path: "/" }, { label: "Reports" }]}>
      <div className="max-w-[900px] mx-auto space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Final Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-generated governance reports · Weekly Marketing Performance Reporting
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Performance trend charts */}
        {trendData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="surface-1 rounded-xl p-4 border border-border">
              <p className="text-xs font-semibold text-foreground mb-0.5">Spend Trend by Period</p>
              <p className="text-[11px] text-muted-foreground mb-3">Total marketing spend per reporting period</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                  <Line type="monotone" dataKey="spend" stroke="hsl(38 92% 55%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(38 92% 55%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="surface-1 rounded-xl p-4 border border-border">
              <p className="text-xs font-semibold text-foreground mb-0.5">Conversions by Period</p>
              <p className="text-[11px] text-muted-foreground mb-3">Goal completions per reporting period</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="conversions" fill="hsl(152 69% 45%)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Reports", value: validReports.length, icon: <FileText className="w-4 h-4 text-primary" />, color: "text-foreground" },
            { label: "Approved", value: approvedCount, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, color: "text-emerald-400" },
            { label: "Pending Approval", value: pendingCount, icon: <Clock className="w-4 h-4 text-amber-400" />, color: "text-amber-400" },
          ].map(stat => (
            <div key={stat.label} className="surface-1 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">{stat.icon}</div>
              <div>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + filter bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by report ID, workflow ID, or summary content…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-muted/40 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/40 border border-border">
            <Filter className="w-3.5 h-3.5 text-muted-foreground ml-1.5" />
            {(["all", "approved", "pending"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterApproved(f)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                  filterApproved === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Data freshness */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Bot className="w-3 h-3" />
          <span>Sourced from Airtable · Last synced {lastUpdated}</span>
          {filtered.length !== validReports.length && (
            <span className="ml-2 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Showing {filtered.length} of {validReports.length}
            </span>
          )}
          {skippedCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground/60">
              · {skippedCount} incomplete {skippedCount === 1 ? "record" : "records"} hidden
            </span>
          )}
        </div>

        {/* Reports list */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-48 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-muted-foreground">
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
            {filtered.map(report => (
              <ReportCard
                key={report.recordId}
                report={report}
                onApprove={(recordId) => approveMutation.mutate({ recordId })}
                isApproving={approveMutation.isPending && approveMutation.variables?.recordId === report.recordId}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
