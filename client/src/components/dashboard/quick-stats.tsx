/**
 * NexusOps — QuickStats
 *
 * Three summary tiles below the workflows table:
 * - AI calls this week
 * - Reports pending approval
 * - Average execution duration
 */

export interface QuickStatsProps {
  aiCallsThisWeek: number;
  reportsPendingApproval: number;
  avgDurationMins: number | null;
}

function StatTile({ label, value, accent, isZero }: { label: string; value: string; accent: string; isZero?: boolean }): JSX.Element {
  return (
    <div className="card-hover" style={{ background: "var(--color-bg-surface)", border: `1px solid ${accent}20`, borderRadius: "var(--radius-lg)", padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <p style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
        {label}
      </p>
      <p className="stat-number" style={{ fontSize: "1.875rem", color: isZero ? "var(--color-text-tertiary)" : accent }}>
        {value}
      </p>
      {isZero && (
        <p style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", marginTop: 2 }}>No data yet</p>
      )}
    </div>
  );
}

export function QuickStats({ aiCallsThisWeek, reportsPendingApproval, avgDurationMins }: QuickStatsProps): JSX.Element {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-4)" }}
      className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatTile label="AI calls this week" value={aiCallsThisWeek === 0 ? "0" : String(aiCallsThisWeek)} isZero={aiCallsThisWeek === 0} accent="#a78bfa" />
      <StatTile label="Reports pending" value={reportsPendingApproval === 0 ? "0" : String(reportsPendingApproval)} isZero={reportsPendingApproval === 0} accent="var(--color-status-running)" />
      <StatTile label="Avg execution" value={avgDurationMins != null ? `${avgDurationMins.toFixed(1)}m` : "—"} isZero={avgDurationMins == null} accent="var(--color-brand)" />
    </div>
  );
}
