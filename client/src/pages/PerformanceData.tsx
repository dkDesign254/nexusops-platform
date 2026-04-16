import DashboardLayout from "@/components/DashboardLayout";
import { SectionHeader } from "@/components/AgentOpsUI";
import { trpc } from "@/lib/trpc";
import {
  BarChart2,
  Loader2,
  TrendingUp,
} from "lucide-react";

export default function PerformanceData() {
  const { data: perfData, isLoading } = trpc.airtable.performanceData.useQuery({});

  // Aggregate totals
  const totals = perfData?.reduce(
    (acc, row) => ({
      impressions: acc.impressions + row.impressions,
      clicks: acc.clicks + row.clicks,
      conversions: acc.conversions + row.conversions,
      spend: acc.spend + row.spend,
    }),
    { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
  );

  const overallCtr =
    totals && totals.impressions > 0
      ? ((totals.clicks / totals.impressions) * 100).toFixed(2)
      : "0.00";

  const costPerConversion =
    totals && totals.conversions > 0
      ? (totals.spend / totals.conversions).toFixed(2)
      : "0.00";

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Performance Data
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Marketing campaign metrics from Airtable — impressions, clicks, conversions, and spend
          </p>
        </div>

        {/* Aggregate stats */}
        {totals && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {[
              { label: "Total Impressions", value: totals.impressions.toLocaleString(), color: "text-blue-400" },
              { label: "Total Clicks", value: totals.clicks.toLocaleString(), color: "text-indigo-400" },
              { label: "Total Conversions", value: totals.conversions.toLocaleString(), color: "text-emerald-400" },
              { label: "Total Spend", value: `$${totals.spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "text-amber-400" },
              { label: "Overall CTR", value: `${overallCtr}%`, color: "text-cyan-400" },
              { label: "Cost / Conversion", value: `$${costPerConversion}`, color: "text-rose-400" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className={`text-lg font-semibold tabular-nums ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        <SectionHeader
          title={`${perfData?.length ?? 0} Campaign Record${perfData?.length !== 1 ? "s" : ""}`}
          description="Raw performance data rows from Airtable Performance Data table"
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !perfData || perfData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-accent text-muted-foreground">
              <BarChart2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No performance data</p>
              <p className="text-xs text-muted-foreground mt-1">
                Campaign metrics will appear here once data is added to Airtable.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "Campaign",
                    "Impressions",
                    "Clicks",
                    "Conversions",
                    "Spend",
                    "CTR",
                    "Conv. Rate",
                    "CPC",
                    "Reporting Period",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {perfData.map((row, idx) => {
                  const ctr =
                    row.impressions > 0
                      ? ((row.clicks / row.impressions) * 100).toFixed(2)
                      : "0.00";
                  const convRate =
                    row.clicks > 0
                      ? ((row.conversions / row.clicks) * 100).toFixed(2)
                      : "0.00";
                  const cpc =
                    row.clicks > 0
                      ? (row.spend / row.clicks).toFixed(2)
                      : "0.00";

                  return (
                    <tr
                      key={row.recordId}
                      className={`border-b border-border last:border-0 hover:bg-accent/10 transition-colors ${
                        idx % 2 === 0 ? "bg-card" : "bg-background"
                      }`}
                    >
                      <td className="px-4 py-3 text-xs font-medium text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                          {row.performanceDataId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                        {row.impressions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                        {row.clicks.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-emerald-400 tabular-nums">
                        {row.conversions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-amber-400 tabular-nums">
                        ${row.spend.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-xs text-blue-400 tabular-nums">
                        {ctr}%
                      </td>
                      <td className="px-4 py-3 text-xs text-cyan-400 tabular-nums">
                        {convRate}%
                      </td>
                      <td className="px-4 py-3 text-xs text-indigo-400 tabular-nums">
                        ${cpc}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {row.reportingPeriod ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Totals row */}
              {totals && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/20">
                    <td className="px-4 py-3 text-xs font-semibold text-foreground">Totals</td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground tabular-nums">
                      {totals.impressions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground tabular-nums">
                      {totals.clicks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-emerald-400 tabular-nums">
                      {totals.conversions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-amber-400 tabular-nums">
                      ${totals.spend.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-blue-400 tabular-nums">
                      {overallCtr}%
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">—</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
