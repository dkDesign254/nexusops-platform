/**
 * NexusOps — BillingPage
 *
 * Route: /billing (protected — requires auth session)
 * Displays the current plan, usage summary, and upgrade options.
 * Stripe integration will be wired here in a future sprint.
 */
import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { useT } from "@/contexts/LocaleContext";
import { usePricing } from "@/hooks/use-pricing";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Zap, Building2, ExternalLink, Loader2 } from "lucide-react";
import type { PricingPlan } from "@/lib/airtable";

function PlanCard({ plan, isCurrent }: { plan: PricingPlan; isCurrent: boolean }): JSX.Element {
  const color = isCurrent ? "var(--color-brand)" : "var(--color-text-secondary)";
  const isEnterprise = plan.name.toLowerCase().includes("enterprise") || plan.monthlyPriceUsd == null;
  const [loading, setLoading] = useState(false);

  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
    onError: (err) => {
      console.error("[Billing] Checkout error:", err.message);
      setLoading(false);
    },
  });

  function handleUpgrade() {
    if (isCurrent || isEnterprise || !plan.stripePriceIdMonthly) return;
    setLoading(true);
    checkoutMutation.mutate({
      priceId: plan.stripePriceIdMonthly,
      successUrl: `${window.location.origin}/billing?upgraded=1`,
      cancelUrl: `${window.location.origin}/billing`,
    });
  }

  return (
    <div
      style={{
        background: "var(--color-bg-elevated)",
        border: `1px solid ${isCurrent ? "var(--color-brand)" : "var(--color-border-subtle)"}`,
        borderRadius: 12,
        padding: "1.5rem",
        position: "relative",
        flex: 1,
        minWidth: 240,
      }}
    >
      {isCurrent && (
        <span
          style={{
            position: "absolute",
            top: -11,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--color-brand)",
            color: "#000",
            fontSize: "0.6875rem",
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            padding: "0.15rem 0.65rem",
            borderRadius: 99,
            whiteSpace: "nowrap",
          }}
        >
          Current plan
        </span>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        {isEnterprise ? (
          <Building2 size={18} style={{ color }} />
        ) : (
          <Zap size={18} style={{ color }} />
        )}
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)" }}>
          {plan.name}
        </span>
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginBottom: "1rem", lineHeight: 1.5 }}>
        {plan.description}
      </p>

      <div style={{ marginBottom: "1rem" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.75rem", color: "var(--color-text-primary)" }}>
          {plan.monthlyPriceUsd != null ? `$${plan.monthlyPriceUsd}` : "Custom"}
        </span>
        {plan.monthlyPriceUsd != null && (
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginLeft: "0.25rem" }}>/mo</span>
        )}
      </div>

      {plan.features.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {plan.features.slice(0, 6).map((f, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
              <CheckCircle size={13} style={{ color: "var(--color-brand)", flexShrink: 0, marginTop: 1 }} />
              {f}
            </li>
          ))}
        </ul>
      )}

      {isEnterprise ? (
        <a
          href="mailto:sales@nexusops.io"
          style={{
            display: "block",
            textAlign: "center",
            width: "100%",
            padding: "0.55rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-brand)",
            background: "rgba(61,255,160,0.1)",
            color: "var(--color-brand)",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "0.8125rem",
            textDecoration: "none",
            boxSizing: "border-box",
          }}
        >
          Contact sales
        </a>
      ) : (
        <button
          disabled={isCurrent || loading}
          onClick={handleUpgrade}
          style={{
            width: "100%",
            padding: "0.55rem",
            borderRadius: "var(--radius-sm)",
            border: isCurrent ? "1px solid var(--color-border-subtle)" : "1px solid var(--color-brand)",
            background: isCurrent ? "transparent" : "rgba(61,255,160,0.1)",
            color: isCurrent ? "var(--color-text-tertiary)" : "var(--color-brand)",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "0.8125rem",
            cursor: isCurrent || loading ? "default" : "pointer",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
          }}
        >
          {loading && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
          {isCurrent ? "Active" : plan.stripePriceIdMonthly ? "Upgrade" : "Upgrade (configure Stripe)"}
        </button>
      )}
    </div>
  );
}

const FALLBACK_PLANS: PricingPlan[] = [
  {
    recordId: "starter",
    name: "Starter",
    slug: "starter",
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
    description: "For small teams getting started with AI governance.",
    features: ["5 workflows/mo", "Basic audit logs", "Email support", "1 team member"],
    isPopular: false,
    isActive: true,
    sortOrder: 1,
    workflowLimit: 5,
    seatsIncluded: 1,
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
    description: "Unlimited workflows with full AI traceability and reports.",
    features: ["Unlimited workflows", "Full AI traceability", "Priority support", "5 team members", "Advanced reports", "API access"],
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
    description: "Custom contracts, SSO, and dedicated support for large teams.",
    features: ["Unlimited everything", "Dedicated support", "SSO/SAML", "Custom integrations", "SLA guarantee", "On-prem option"],
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

export default function BillingPage(): JSX.Element {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const T = useT();
  const { plans, loading } = usePricing();

  const displayPlans = !loading && plans.length > 0 ? plans : FALLBACK_PLANS;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex">
        <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar title={T("nav.billing")} />

        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

            {/* Header */}
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
                Billing & Plans
              </h1>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                Manage your subscription, usage, and payment details.
              </p>
            </div>

            {/* Current usage summary */}
            <div
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: 12,
                padding: "1.25rem",
              }}
            >
              <p style={{ margin: "0 0 1rem", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
                Usage this billing period
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
                {[
                  { label: "Workflows run", value: "—", sub: "of unlimited" },
                  { label: "AI interactions", value: "—", sub: "this month" },
                  { label: "Reports generated", value: "—", sub: "of unlimited" },
                  { label: "Next billing", value: "—", sub: "Stripe not configured" },
                ].map((item) => (
                  <div key={item.label} style={{ padding: "0.75rem", background: "var(--color-bg-base)", borderRadius: 8, border: "1px solid var(--color-border-subtle)" }}>
                    <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {item.label}
                    </p>
                    <p style={{ margin: "0.25rem 0 0.1rem", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
                      {item.value}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--color-text-tertiary)" }}>
                      {item.sub}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan cards */}
            <div>
              <p style={{ margin: "0 0 1rem", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
                Available plans
              </p>
              {loading ? (
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton" style={{ flex: 1, minWidth: 240, height: 340, borderRadius: 12 }} />
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  {displayPlans.map((plan, i) => (
                    <PlanCard key={plan.recordId} plan={plan} isCurrent={i === 0} />
                  ))}
                </div>
              )}
            </div>

            {/* Stripe notice */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.875rem 1.25rem",
                background: "rgba(255,179,71,0.06)",
                border: "1px solid rgba(255,179,71,0.2)",
                borderRadius: 10,
              }}
            >
              <ExternalLink size={16} style={{ color: "#ffb347", flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                <strong style={{ color: "#ffb347" }}>Stripe not yet configured.</strong>{" "}
                Payment processing will be available in the next release. Contact your account manager to discuss enterprise pricing.
              </p>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
