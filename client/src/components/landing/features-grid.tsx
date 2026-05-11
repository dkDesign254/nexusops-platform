/**
 * NexusOps — FeaturesGrid
 *
 * 3x2 grid of feature cards covering the six core governance capabilities.
 * Each card uses a Lucide icon, title, and two-sentence description.
 */
import type { ReactNode } from "react";
import { Activity, Bot, ArrowLeftRight, FileCheck, AlertTriangle, GitCompare } from "lucide-react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  accent: string;
}

function FeatureCard({ icon, title, description, accent }: FeatureCardProps): JSX.Element {
  return (
    <div className="card-hover" style={{ background: "var(--color-bg-surface)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className="icon-glow" style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: `${accent}18`, border: `1px solid ${accent}35`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.5rem", fontSize: "0.9375rem", letterSpacing: "-0.01em" }}>
          {title}
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
          {description}
        </p>
      </div>
    </div>
  );
}

const FEATURES: FeatureCardProps[] = [
  {
    icon: <Activity size={18} />,
    title: "Execution Log",
    description: "Every workflow step logged with event type, timestamp, runtime, and status. The full trace, forever.",
    accent: "#3b82f6",
  },
  {
    icon: <Bot size={18} />,
    title: "AI Interaction Tracing",
    description: "Verbatim prompts and model responses captured at the moment of execution. Know exactly what the AI was told and what it said.",
    accent: "#a78bfa",
  },
  {
    icon: <ArrowLeftRight size={18} />,
    title: "Runtime Independence",
    description: "Govern workflows running on Make, n8n, or any future runtime. Your governance layer never changes when your runtime does.",
    accent: "var(--color-brand)",
  },
  {
    icon: <FileCheck size={18} />,
    title: "Report Accountability",
    description: "AI-generated outputs move through a structured approval workflow before they are considered final. No unreviewed AI output reaches production.",
    accent: "#f59e0b",
  },
  {
    icon: <AlertTriangle size={18} />,
    title: "Anomaly Detection",
    description: "Automatic identification of silent failures, missing log entries, stalled workflows, and governance gaps across every execution.",
    accent: "var(--color-status-failed)",
  },
  {
    icon: <GitCompare size={18} />,
    title: "Cross-Runtime Audit",
    description: "Run the same workflow on two runtimes and compare governance traces side by side. Prove consistency. Demonstrate independence.",
    accent: "#ea4e9d",
  },
];

export function FeaturesGrid(): JSX.Element {
  return (
    <section id="features" style={{ maxWidth: 1200, margin: "0 auto", padding: "var(--space-20) var(--space-6)" }}>
      <div style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--color-brand)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-body)", marginBottom: "var(--space-3)" }}>
          Platform capabilities
        </p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.03em" }}>
          Everything you need to{" "}
          <span className="text-gradient">govern AI at scale</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-5)" }}>
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </section>
  );
}
