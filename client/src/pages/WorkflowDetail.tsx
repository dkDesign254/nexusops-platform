import DashboardLayout from "@/components/DashboardLayout";
import {
  EventTypeBadge,
  LogStatusIcon,
  RuntimeBadge,
  SectionHeader,
  StatusBadge,
} from "@/components/AgentOpsUI";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Terminal,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useLocation, useParams } from "wouter";

function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-36 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function ReportSection({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h4>
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{content || "—"}</p>
    </div>
  );
}

export default function WorkflowDetail() {
  const params = useParams<{ id: string }>();
  const recordId = params.id;
  const [, setLocation] = useLocation();

  const { data: workflow, isLoading: wfLoading } = trpc.airtable.workflowById.useQuery(
    { recordId: recordId ?? "" },
    { enabled: !!recordId }
  );

  const { data: execLogs, isLoading: execLoading } = trpc.airtable.executionLogs.useQuery(
    { workflowRecordId: recordId },
    { enabled: !!recordId }
  );

  const { data: aiLogs, isLoading: aiLoading } = trpc.airtable.aiLogs.useQuery(
    { workflowRecordId: recordId },
    { enabled: !!recordId }
  );

  const { data: reports, isLoading: reportLoading } = trpc.airtable.finalReports.useQuery(
    { workflowRecordId: recordId },
    { enabled: !!recordId }
  );

  const { data: perfData, isLoading: perfLoading } = trpc.airtable.performanceData.useQuery(
    { workflowRecordId: recordId },
    { enabled: !!recordId }
  );

  if (wfLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!workflow) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
          <XCircle className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Workflow not found.</p>
          <Button variant="outline" onClick={() => setLocation("/")} className="gap-2 bg-transparent">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const report = reports?.[0];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back + header */}
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="mt-0.5 text-muted-foreground hover:text-foreground gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold text-foreground tracking-tight">{workflow.name}</h1>
              <StatusBadge status={workflow.status} />
              <RuntimeBadge runtime={workflow.runtime} />
            </div>
            <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded mt-2 inline-block">
              {workflow.workflowId}
            </code>
          </div>
        </div>

        {/* Workflow metadata */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Workflow Details</h2>
          <InfoRow label="Workflow ID" value={<code className="font-mono text-primary text-xs">{workflow.workflowId}</code>} />
          <InfoRow label="Name" value={workflow.name} />
          <InfoRow label="Requested By" value={workflow.requestedBy} />
          <InfoRow label="Runtime" value={<RuntimeBadge runtime={workflow.runtime} />} />
          <InfoRow label="Status" value={<StatusBadge status={workflow.status} />} />
          <InfoRow label="Report Period" value={<span className="font-mono text-xs">{workflow.reportPeriod ?? "—"}</span>} />
          <InfoRow label="Date Requested" value={formatDate(workflow.dateRequested)} />
          <InfoRow label="Date Completed" value={formatDate(workflow.dateCompleted)} />
          {workflow.notes && <InfoRow label="Notes" value={<span className="text-muted-foreground">{workflow.notes}</span>} />}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="execution">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="execution" className="gap-2 text-xs">
              <Terminal className="w-3.5 h-3.5" />
              Execution Logs
              {execLogs && execLogs.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs">
                  {execLogs.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2 text-xs">
              <Bot className="w-3.5 h-3.5" />
              AI Logs
              {aiLogs && aiLogs.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-400 text-xs">
                  {aiLogs.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2 text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              Performance Data
              {perfData && perfData.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs">
                  {perfData.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="report" className="gap-2 text-xs">
              <FileText className="w-3.5 h-3.5" />
              Final Report
            </TabsTrigger>
          </TabsList>

          {/* Execution Logs */}
          <TabsContent value="execution" className="mt-6">
            <SectionHeader
              title="Execution Logs"
              description="Step-by-step execution trace from the external runtime"
            />
            {execLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : !execLogs || execLogs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">No execution logs recorded for this workflow.</div>
            ) : (
              <div className="space-y-2">
                {execLogs.map((log, idx) => (
                  <div
                    key={log.recordId}
                    className={`relative flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                      log.status === "failure" || log.status === "error"
                        ? "border-red-500/20 bg-red-500/5"
                        : "border-border bg-card hover:bg-accent/20"
                    }`}
                  >
                    {idx < execLogs.length - 1 && (
                      <div className="absolute left-[23px] top-[52px] bottom-[-5px] w-px bg-border z-0" />
                    )}
                    <div className="shrink-0 z-10">
                      <LogStatusIcon status={log.status} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{log.stepName}</span>
                        <EventTypeBadge eventType={log.eventType} />
                        <RuntimeBadge runtime={log.runtime} />
                      </div>
                      {log.message && (
                        <p className={`text-xs mt-1.5 leading-relaxed font-mono ${
                          log.status === "failure" ? "text-red-300" : "text-muted-foreground"
                        }`}>{log.message}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <code className="text-xs font-mono text-muted-foreground/60">{log.logId}</code>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {formatDate(log.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* AI Logs */}
          <TabsContent value="ai" className="mt-6">
            <SectionHeader
              title="AI Interaction Log"
              description="Every prompt sent and response received from the LLM — fully auditable"
            />
            {aiLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : !aiLogs || aiLogs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">No AI interactions recorded for this workflow.</div>
            ) : (
              <div className="space-y-4">
                {aiLogs.map((log) => (
                  <div key={log.recordId} className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bot className="w-4 h-4 text-fuchsia-400" />
                        <code className="text-xs font-mono text-fuchsia-400">{log.logId}</code>
                        <span className="text-xs text-muted-foreground">Model: {log.modelUsed}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {log.costNotes && <span className="text-amber-400/70">{log.costNotes}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Prompt</p>
                        <pre className="text-xs text-foreground/80 font-mono bg-muted/30 rounded-lg p-3 whitespace-pre-wrap leading-relaxed overflow-auto max-h-48">
                          {log.promptText || "—"}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Response</p>
                        <pre className="text-xs text-foreground/80 font-mono bg-muted/30 rounded-lg p-3 whitespace-pre-wrap leading-relaxed overflow-auto max-h-64">
                          {log.responseText || "—"}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Performance Data */}
          <TabsContent value="performance" className="mt-6">
            <SectionHeader
              title="Performance Data"
              description="Marketing campaign metrics linked to this workflow"
            />
            {perfLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : !perfData || perfData.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">No performance data linked to this workflow.</div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {["Campaign", "Impressions", "Clicks", "Conversions", "Spend", "CTR", "Reporting Period"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {perfData.map((row, idx) => {
                      const ctr = row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(2) : "0.00";
                      return (
                        <tr key={row.recordId} className={`border-b border-border last:border-0 ${idx % 2 === 0 ? "bg-card" : "bg-background"}`}>
                          <td className="px-4 py-3 text-xs font-medium text-foreground">{row.performanceDataId}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">{row.impressions.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">{row.clicks.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">{row.conversions.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-emerald-400 tabular-nums">${row.spend.toFixed(2)}</td>
                          <td className="px-4 py-3 text-xs text-blue-400 tabular-nums">{ctr}%</td>
                          <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{row.reportingPeriod ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* Final Report */}
          <TabsContent value="report" className="mt-6">
            <SectionHeader
              title="Final Report"
              description="AI-generated marketing performance report from Airtable"
            />
            {reportLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : !report ? (
              <div className="text-center py-16 text-muted-foreground text-sm">No report generated for this workflow yet.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{report.reportId}</code>
                    {report.approved && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(report.reportTimestamp)}
                  </span>
                </div>
                <ReportSection title="Executive Summary" content={report.executiveSummary} />
                <ReportSection title="Key Insights" content={report.keyInsights} />
                <ReportSection title="Risks or Anomalies" content={report.risksOrAnomalies} />
                <ReportSection title="Recommendation" content={report.recommendation} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
