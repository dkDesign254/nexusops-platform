import DashboardLayout from "@/components/DashboardLayout";
import { SectionHeader } from "@/components/AgentOpsUI";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";
import { useState } from "react";

function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type AirtableReport = {
  recordId: string;
  reportId: string;
  workflowRecordIds: string[];
  executiveSummary: string;
  keyInsights: string;
  risksOrAnomalies: string;
  recommendation: string;
  approved: boolean;
  reportTimestamp: string | null;
};

function ReportCard({ report }: { report: AirtableReport }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/20 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-primary">{report.reportId}</code>
              {report.approved && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> Approved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(report.reportTimestamp)}
              </span>
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border">
          {/* Executive Summary */}
          <div className="px-5 py-4 border-b border-border bg-blue-500/5">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">
              Executive Summary
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {report.executiveSummary || "—"}
            </p>
          </div>

          {/* Grid: insights + risks */}
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="px-5 py-4 bg-emerald-500/5">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2">
                Key Insights
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {report.keyInsights || "—"}
              </p>
            </div>
            <div className="px-5 py-4 bg-red-500/5">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-2">
                Risks or Anomalies
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {report.risksOrAnomalies || "—"}
              </p>
            </div>
          </div>

          {/* Recommendation */}
          <div className="px-5 py-4 border-t border-border bg-amber-500/5">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2">
              Recommendation
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {report.recommendation || "—"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const { data: reports, isLoading } = trpc.airtable.finalReports.useQuery({});

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-generated Weekly Marketing Performance Reports from Airtable — structured with summary, insights, risks, and recommendations
          </p>
        </div>

        <SectionHeader
          title={`${reports?.length ?? 0} Report${reports?.length !== 1 ? "s" : ""}`}
          description="Click any report to expand the full structured output"
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-accent text-muted-foreground">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No reports yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Reports will appear here once workflows complete and generate AI analysis.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <ReportCard key={report.recordId} report={report} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
