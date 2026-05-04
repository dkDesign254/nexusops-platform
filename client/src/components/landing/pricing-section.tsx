/**
 * NexusOps — LandingPage PricingSection
 *
 * Reads pricing plans from Airtable (via usePricing hook).
 * Falls back to three hardcoded tiers while loading or if Airtable is empty.
 * Anchored at id="pricing" so the navbar "Pricing" link scrolls here.
 */
import { CheckCircle, Zap, Shield, Building2 } from "lucide-react";
import { usePricing } from "@/hooks/use-pricing";
import type { PricingPlan } from "@/lib/airtable";

// ─── Fallback plans ───────────────────────────────────────────────────────────

const FALLBACK: PricingPlan[] = [
  {
    recordId: "starter",
    name: "Starter",
    slug: "starter",
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
    description: "Governance basics for solo builders and small teams getting started with AI automation.",
    features: ["10 workflow runs/mo", "Full audit log", "2 team members", "Email support", "1 AI runtime"],
    isPopular: false,
    isActive: true,
    sortOrder: 1,
    workflowLimit: 10,
    seatsIncluded: 2,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual: null,
    tier: "starter",
  },
  {
    recordId: "pro",
    name: "Pro",
    slug: "pro",
    monthlyPriceUsd: 49,
    annualPriceUsd: 490,
    description: "Unlimited governance for growing teams running production AI workflows at scale.",
    features: ["Unlimited workflow runs", "Full AI traceability", "5 team members", "Priority support", "Advanced reports", "API access", "Runtime split analytics"],
    isPopular: true,
    isActive: true,
    sortOrder: 2,
    workflowLimit: -1,
    seatsIncluded: 5,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual: null,
    tier: "pro",
  },
  {
    recordId: "enterprise",
    name: "Enterprise",
    slug: "enterprise",
    monthlyPriceUsd: null,
    annualPriceUsd: null,
    description: "Custom contracts, SSO, dedicated support, and on-premise deployment for large organisations.",
    features: ["Unlimited everything", "Dedicated CSM", "SSO / SAML", "Custom integrations", "SLA guarantee", "On-prem or private cloud", "Custom data retention"],
    isPopular: false,
    isActive: true,
    sortOrder: 3,
    workflowLimit: -1,
    seatsIncluded: -1,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual: null,
    tier: "enterprise",
  },
];

function planIcon(tier: string | null) {
  if (tier === "enterprise") return <Building2 size={20} />;
  if (tier === "pro") return <Shield size={20} />;
  return <Zap size={20} />;
}

function PricingCard({ plan, featured }: { plan: PricingPlan; featured: boolean }) {
  const accent = featured ? "var(--color-brand)" : "rgba(255,255,255,0.18)";

  return (
    <div
      style={{
        position: "relative",
        background: featured ? "rgba(61,255,160,0.06)" : "var(--color-bg-elevated)",
        border: `1px solid ${accent}`,
        borderRadius: 16,
        padding: "2rem 1.75rem",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 260,
        maxWidth: 340,
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 40px rgba(0,0,0,0.3)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {featured && (
        <span style={{
          position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
          background: "var(--color-brand)", color: "#000", fontSize: "0.6875rem",
          fontWeight: 700, fontFamily: "var(--font-display)", padding: "0.2rem 0.8rem",
          borderRadius: 99, whiteSpace: "nowrap", letterSpacing: "0.04em",
        }}>
          MOST POPULAR
        </span>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: featured ? "var(--color-brand)" : "var(--color-text-secondary)" }}>
        {planIcon(plan.tier)}
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.125rem", color: "var(--color-text-primary)" }}>
          {plan.name}
        </span>
      </div>

      <p style={{ fontSize: "0.8125rem", color: "var(--color-text-tertiary)", lineHeight: 1.6, marginBottom: "1.25rem", minHeight: 52 }}>
        {plan.description}
      </p>

      <div style={{ marginBottom: "1.5rem" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "2.25rem", color: "var(--color-text-primary)", letterSpacing: "-0.03em" }}>
          {plan.monthlyPriceUsd != null ? `$${plan.monthlyPriceUsd}` : "Custom"}
        </span>
        {plan.monthlyPriceUsd != null && (
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-tertiary)", marginLeft: "0.35rem" }}>/month</span>
        )}
        {plan.annualPriceUsd != null && plan.annualPriceUsd > 0 && (
          <p style={{ fontSize: "0.6875rem", color: "var(--color-brand)", marginTop: "0.25rem" }}>
            ${plan.annualPriceUsd}/yr · save ${(plan.monthlyPriceUsd! * 12 - plan.annualPriceUsd).toFixed(0)}
          </p>
        )}
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {plan.features.map((f, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
            <CheckCircle size={14} style={{ color: "var(--color-brand)", flexShrink: 0, marginTop: 2 }} />
            {f}
          </li>
        ))}
      </ul>

      <a
        href="/auth?mode=signup"
        style={{
          display: "block", textAlign: "center", padding: "0.7rem",
          borderRadius: 8,
          background: featured ? "var(--color-brand)" : "transparent",
          border: `1px solid ${featured ? "var(--color-brand)" : "rgba(255,255,255,0.2)"}`,
          color: featured ? "#000" : "var(--color-text-primary)",
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem",
          textDecoration: "none", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!featured) (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--color-brand)";
        }}
        onMouseLeave={(e) => {
          if (!featured) (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.2)";
        }}
      >
        {plan.tier === "enterprise" ? "Contact sales" : plan.monthlyPriceUsd === 0 ? "Start free" : "Get started"}
      </a>
    </div>
  );
}

export function PricingSection(): JSX.Element {
  const { plans, loading } = usePricing();
  const displayPlans = !loading && plans.length > 0 ? plans : FALLBACK;

  return (
    <section id="pricing" style={{ padding: "6rem 1.5rem", background: "var(--color-bg-base)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--color-brand)", textTransform: "uppercase", marginBottom: "0.75rem", fontFamily: "var(--font-display)" }}>
            Pricing
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.75rem, 4vw, 2.75rem)", color: "var(--color-text-primary)", letterSpacing: "-0.03em", margin: "0 0 1rem" }}>
            Governance that scales with your team
          </h2>
          <p style={{ fontSize: "1rem", color: "var(--color-text-secondary)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            Start free, upgrade when you need it. Every plan includes full audit trails, AI tracing, and runtime-independent governance.
          </p>
        </div>

        {loading ? (
          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ flex: 1, minWidth: 260, maxWidth: 340, height: 480, borderRadius: 16 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap", alignItems: "stretch" }}>
            {displayPlans.map((plan) => (
              <PricingCard key={plan.recordId} plan={plan} featured={plan.isPopular} />
            ))}
          </div>
        )}

        <p style={{ textAlign: "center", marginTop: "2.5rem", fontSize: "0.8125rem", color: "var(--color-text-tertiary)" }}>
          All plans include a 14-day free trial. No credit card required to start.
        </p>
      </div>
    </section>
  );
}
