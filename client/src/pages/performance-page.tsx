/**
 * NexusOps — PerformancePage
 * Route: /performance (protected)
 *
 * Shows per-campaign metrics (CTR, ROAS, impressions, clicks) as cards
 * plus CTR and ROAS trend bar charts at the top.
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { usePerformanceData } from "@/hooks/use-performance-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortName(name: string, max = 14): string {
  return name.length > max ? name.slice(0, max - 1) + "…" : name;
}

// ─── Chart components ─────────────────────────────────────────────────────────

function CTRChart({ rows }: { rows: Array<{ campaign_name: string; ctr: number | null }> }) {
  const data = rows
    .filter((r) => r.ctr != null)
    .map((r) => ({ name: shortName(r.campaign_name), value: parseFloat(((r.ctr ?? 0) * 100).toFixed(2)) }))
    .slice(0, 10);

  if (!data.length) return null;

  return (
    <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: "var(--space-5)" }}>
      <p style={{ margin: "0 0 var(--space-4)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
        CTR by Campaign (%)
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 24, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="name" tick={{ fill: "var(--color-text-tertiary)", fontSize: 10, fontFamily: "var(--font-display)" }} angle={-30} textAnchor="end" interval={0} />
          <YAxis tick={{ fill: "var(--color-text-tertiary)", fontSize: 10 }} unit="%" width={36} />
          <Tooltip
            formatter={(v: number) => [`${v}%`, "CTR"]}
            contentStyle={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={`hsl(${155 + i * 12}, 70%, 55%)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ROASChart({ rows }: { rows: Array<{ campaign_name: string; roas: number | null }> }) {
  const data = rows
    .filter((r) => r.roas != null)
    .map((r) => ({ name: shortName(r.campaign_name), value: parseFloat((r.roas ?? 0).toFixed(2)) }))
    .slice(0, 10);

  if (!data.length) return null;

  return (
    <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: "var(--space-5)" }}>
      <p style={{ margin: "0 0 var(--space-4)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
        ROAS by Campaign (×)
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 24, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="name" tick={{ fill: "var(--color-text-tertiary)", fontSize: 10, fontFamily: "var(--font-display)" }} angle={-30} textAnchor="end" interval={0} />
          <YAxis tick={{ fill: "var(--color-text-tertiary)", fontSize: 10 }} unit="×" width={36} />
          <Tooltip
            formatter={(v: number) => [`${v}×`, "ROAS"]}
            contentStyle={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => {
              const v = data[i].value;
              const fill = v >= 8 ? "#4ade80" : v >= 4 ? "#facc15" : "#f87171";
              return <Cell key={i} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PerformancePage(): JSX.Element {
  const { data, loading } = usePerformanceData();

  const filtered = data.filter(
    (row) => row.campaign_name && !/^rec[A-Za-z0-9]{14}$/.test(row.campaign_name)
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="Campaign Data" />
        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

            {loading ? (
              <>
                {/* Chart skeletons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                  {[0, 1].map((i) => <div key={i} className="skeleton" style={{ height: 260, borderRadius: "var(--radius-lg)" }} />)}
                </div>
                {/* Card skeletons */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: "var(--radius-lg)" }} />)}
                </div>
              </>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-16)", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)" }}>
                No performance data yet.
              </div>
            ) : (
              <>
                {/* Charts row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
                  <CTRChart rows={filtered} />
                  <ROASChart rows={filtered} />
                </div>

                {/* Campaign cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
                  {filtered.map((row) => (
                    <div key={row.id} style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: "var(--space-5)" }}>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "var(--space-3)" }}>{row.campaign_name}</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                        {[
                          { label: "Impressions", value: row.impressions?.toLocaleString() ?? "n/a" },
                          { label: "Clicks", value: row.clicks?.toLocaleString() ?? "n/a" },
                          { label: "CTR", value: row.ctr != null ? (row.ctr * 100).toFixed(2) + "%" : "n/a", highlight: row.ctr != null ? (row.ctr >= 0.02 ? "green" : row.ctr >= 0.01 ? "yellow" : "red") : null },
                          { label: "ROAS", value: row.roas != null ? row.roas.toFixed(2) + "×" : "n/a", highlight: row.roas != null ? (row.roas >= 8 ? "green" : row.roas >= 4 ? "yellow" : "red") : null },
                        ].map((m) => (
                          <div key={m.label}>
                            <p style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>{m.label}</p>
                            <p style={{
                              fontFamily: "var(--font-display)",
                              fontWeight: 700,
                              fontSize: "1.125rem",
                              color: m.highlight === "green" ? "#4ade80" : m.highlight === "yellow" ? "#facc15" : m.highlight === "red" ? "#f87171" : "var(--color-text-primary)",
                            }}>{m.value}</p>
                          </div>
                        ))}
                      </div>
                      {row.reporting_period && (
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", marginTop: "var(--space-3)" }}>
                          {row.reporting_period}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
