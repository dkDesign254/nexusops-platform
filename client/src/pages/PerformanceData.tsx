import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  BarChart2,
  CalendarRange,
  DollarSign,
  Eye,
  Loader2,
  MousePointerClick,
  Target,
  TrendingUp,
  X,
  Sparkles,
  Activity,
  Shield,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CAMPAIGN_COLORS = [
  "hsl(221 83% 63%)",
  "hsl(245 58% 60%)",
  "hsl(152 69% 45%)",
  "hsl(38 92% 55%)",
  "hsl(330 70% 58%)",
  "hsl(190 80% 50%)",
  "hsl(20 85% 55%)",
  "hsl(270 60% 60%)",
];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="surface-elevated rounded-2xl p-3 shadow-xl text-xs max-w-[240px]">
      <p className="font-semibold text-foreground mb-2 break-words">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground tabular-nums">
            {p.name === "Spend (USD)"
              ? `$${p.value.toFixed(2)}`
              : p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <div className="surface-elevated rounded-2xl p-4 flex items-start gap-3 card-hover">
      <div className={`p-2.5 rounded-2xl border shrink-0 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        <p className="text-xl font-semibold tabular-nums text-foreground mt-1">
          {value}
        </p>
        {sublabel && (
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}

function CampaignTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) {
  const name = payload?.value ?? "";
  const words = name.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length > 12 && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current);

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={0}
          dy={12 + i * 12}
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          fontSize={9}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function parseStartDate(period: string | null | undefined): Date | null {
  if (!period) return null;
  const raw = period.split(/\s+to\s+/i)[0].trim();
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

export default function PerformanceData() {
  const { data: perfData, isLoading } = trpc.airtable.performanceData.useQuery({});

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredData = useMemo(() => {
    if (!perfData) return [];
    if (!startDate && !endDate) return perfData;

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate + "T23:59:59") : null;

    return perfData.filter((row) => {
      const d = parseStartDate(row.reportingPeriod);
      if (!d) return true;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }, [perfData, startDate, endDate]);

  const hasFilter = Boolean(startDate || endDate);

  const totals = filteredData.reduce(
    (acc, row) => ({
      impressions: acc.impressions + row.impressions,
      clicks: acc.clicks + row.clicks,
      conversions: acc.conversions + row.conversions,
      spend: acc.spend + row.spend,
    }),
    { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
  );

  const overallCtr =
    totals.impressions > 0
      ? ((totals.clicks / totals.impressions) * 100).toFixed(2)
      : "0.00";

  const costPerConversion =
    totals.conversions > 0 ? (totals.spend / totals.conversions).toFixed(2) : "0.00";

  const chartData = filteredData.map((row) => ({
    name: row.campaignName,
    Impressions: row.impressions,
    Clicks: row.clicks,
    Conversions: row.conversions,
    "Spend (USD)": row.spend,
  }));

  return (
    <DashboardLayout
      breadcrumbs={[{ label: "Dashboard", path: "/" }, { label: "Performance Data" }]}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="surface-elevated rounded-3xl p-6 md:p-7 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_28%),radial-gradient(circle_at_left,rgba(16,185,129,0.06),transparent_22%)]" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary">
                <Sparkles className="w-3 h-3" />
                Performance Intelligence Layer
              </div>

              <div>
                <h1 className="text-heading text-2xl md:text-3xl">Performance Data</h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                  Marketing campaign metrics sourced from Airtable, tracking impressions,
                  clicks, conversions, and advertising spend across active campaigns with
                  derived efficiency indicators.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                <Activity className="w-3.5 h-3.5" />
                <span>Live metrics layer for campaign governance</span>
                {hasFilter && (
                  <>
                    <span className="opacity-40">•</span>
                    <span>Filtered period applied</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="surface-elevated rounded-2xl p-4 md:p-5">
          <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground shrink-0">
              <CalendarRange className="w-4 h-4 text-primary" />
              Filter by Reporting Period
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap">From</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs w-40 bg-muted/30 border-border/60 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap">To</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs w-40 bg-muted/30 border-border/60 rounded-xl"
                />
              </div>

              {hasFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs gap-1 text-muted-foreground hover:text-foreground rounded-xl"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                >
                  <X className="w-3 h-3" />
                  Clear filter
                </Button>
              )}
            </div>

            {hasFilter && (
              <span className="text-xs text-primary font-medium shrink-0">
                {filteredData.length} of {perfData?.length ?? 0} campaigns shown
              </span>
            )}
          </div>
        </div>

        {filteredData.length > 0 && (
          <div>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-foreground">
                Summary{hasFilter ? " (filtered period)" : " — All Campaigns"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Aggregated commercial and engagement indicators across the selected campaigns.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              <StatCard
                label="Total Impressions"
                value={totals.impressions.toLocaleString()}
                sublabel="Ad views across campaigns"
                icon={Eye}
                colorClass="text-blue-400 bg-blue-500/10 border-blue-500/20"
              />
              <StatCard
                label="Total Clicks"
                value={totals.clicks.toLocaleString()}
                sublabel="Users who clicked"
                icon={MousePointerClick}
                colorClass="text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
              />
              <StatCard
                label="Total Conversions"
                value={totals.conversions.toLocaleString()}
                sublabel="Completed goals"
                icon={Target}
                colorClass="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              />
              <StatCard
                label="Total Spend"
                value={`$${totals.spend.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                sublabel="Budget consumed"
                icon={DollarSign}
                colorClass="text-amber-400 bg-amber-500/10 border-amber-500/20"
              />
              <StatCard
                label="Click-Through Rate"
                value={`${overallCtr}%`}
                sublabel="Clicks ÷ Impressions"
                icon={TrendingUp}
                colorClass="text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
              />
              <StatCard
                label="Cost per Conversion"
                value={`$${costPerConversion}`}
                sublabel="Spend ÷ Conversions"
                icon={Shield}
                colorClass="text-rose-400 bg-rose-500/10 border-rose-500/20"
              />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !perfData || perfData.length === 0 ? (
          <div className="surface-elevated rounded-2xl flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-accent text-muted-foreground">
              <BarChart2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No performance data available</p>
              <p className="text-xs text-muted-foreground mt-1">
                Campaign metrics will appear here once data is added to Airtable.
              </p>
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="surface-elevated rounded-2xl flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-accent text-muted-foreground">
              <CalendarRange className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No campaigns in this date range</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting the start or end date, or clear the filter to see all campaigns.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-1">Campaign Charts</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Visual breakdown of campaign outcomes and spend efficiency. Hover over any bar for exact values.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="surface-elevated rounded-2xl p-5 card-hover">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Impressions vs. Clicks
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Compares visibility against interaction for each campaign.
                  </p>

                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 40 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={<CampaignTick />}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Bar dataKey="Impressions" fill="hsl(221 83% 63%)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Clicks" fill="hsl(245 58% 60%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="surface-elevated rounded-2xl p-5 card-hover">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Conversions per Campaign
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Number of completed goals attributed to each campaign.
                  </p>

                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 40 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={<CampaignTick />}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="Conversions" radius={[6, 6, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="surface-elevated rounded-2xl p-5 card-hover">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Advertising Spend per Campaign (USD)
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Total budget consumed by each campaign during the selected period.
                  </p>

                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} margin={{ top: 4, right: 4, left: -4, bottom: 40 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={<CampaignTick />}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="Spend (USD)" fill="hsl(38 92% 55%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="surface-elevated rounded-2xl p-5 card-hover">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Clicks to Conversions — Funnel View
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Shows which campaigns convert traffic most efficiently.
                  </p>

                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 40 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={<CampaignTick />}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Bar dataKey="Clicks" fill="hsl(245 58% 60%)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Conversions" fill="hsl(152 69% 45%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Campaign Records
                  {hasFilter && (
                    <span className="text-muted-foreground font-normal ml-1">
                      — {filteredData.length} shown (filtered)
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Raw campaign metrics from Airtable with derived efficiency indicators.
                </p>
              </div>

              <div className="surface-elevated rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/15">
                        {[
                          { label: "Campaign Name" },
                          { label: "Impressions" },
                          { label: "Clicks" },
                          { label: "Conversions" },
                          { label: "Spend (USD)" },
                          { label: "Click-Through Rate" },
                          { label: "Conversion Rate" },
                          { label: "Cost per Click" },
                          { label: "Reporting Period" },
                        ].map(({ label }) => (
                          <th
                            key={label}
                            className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.12em] whitespace-nowrap"
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredData.map((row, idx) => {
                        const ctr =
                          row.impressions > 0
                            ? ((row.clicks / row.impressions) * 100).toFixed(2)
                            : "0.00";

                        const convRate =
                          row.clicks > 0
                            ? ((row.conversions / row.clicks) * 100).toFixed(2)
                            : "0.00";

                        const cpc = row.clicks > 0 ? (row.spend / row.clicks).toFixed(2) : "0.00";

                        return (
                          <tr
                            key={row.recordId}
                            className={`border-b border-border last:border-0 hover:bg-accent/10 transition-colors ${
                              idx % 2 === 0 ? "bg-card/50" : "bg-background/20"
                            }`}
                          >
                            <td className="px-4 py-3 text-xs font-medium text-foreground whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{
                                    background:
                                      CAMPAIGN_COLORS[idx % CAMPAIGN_COLORS.length],
                                  }}
                                />
                                {row.campaignName}
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
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
