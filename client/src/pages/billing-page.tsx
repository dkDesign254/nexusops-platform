/**
 * NexusOps — BillingPage
 *
 * Route: /billing (protected — requires auth session)
 * Displays the current plan, usage summary, and upgrade options.
 *
 * Payment methods supported:
 *   - Stripe (card) — via createCheckoutSession tRPC mutation
 *   - PayPal — via @paypal/react-paypal-js PayPalButtons component
 *   - M-Pesa (Safaricom Daraja STK Push) — via mpesa.initiatePayment tRPC mutation
 *
 * PayPal client ID is read from VITE_PAYPAL_CLIENT_ID (public).
 * M-Pesa uses server-side MPESA_* env vars via tRPC.
 */
import { useState } from "react";
import { MobileSidebar, Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { useT } from "@/contexts/LocaleContext";
import { usePricing } from "@/hooks/use-pricing";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Zap, Building2, ExternalLink, Loader2, Smartphone, X } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
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

// ─── M-Pesa Modal ─────────────────────────────────────────────────────────────

function MpesaModal({
  planSlug,
  amountKes,
  onClose,
}: {
  planSlug: string;
  amountKes: number;
  onClose: () => void;
}): JSX.Element {
  const [phone, setPhone] = useState("+254");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);

  const initMutation = trpc.mpesa.initiatePayment.useMutation({
    onSuccess: (res) => setCheckoutId(res.checkoutRequestId),
    onError: (e) => setPhoneError(e.message),
  });

  const statusQuery = trpc.mpesa.queryStatus.useQuery(
    { checkoutRequestId: checkoutId ?? "" },
    { enabled: !!checkoutId, refetchInterval: 3000, refetchIntervalInBackground: false }
  );

  const paid = statusQuery.data?.success === true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/\s/g, "");
    if (!/^\+?254\d{9}$/.test(cleaned)) {
      setPhoneError("Enter a valid Kenyan number: +254712345678");
      return;
    }
    setPhoneError(null);
    initMutation.mutate({ phone: cleaned, amountKes, planSlug });
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 998, background: "rgba(0,0,0,0.55)" }} aria-hidden="true" />
      <div style={{
        position: "fixed", top: "50%", left: "50%", zIndex: 999,
        transform: "translate(-50%, -50%)",
        width: "min(420px, calc(100vw - 2rem))",
        background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-xl)", padding: "var(--space-6)",
        display: "flex", flexDirection: "column", gap: "var(--space-4)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Smartphone size={18} style={{ color: "#4ade80" }} />
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)" }}>
              Pay with M-Pesa
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-sm)", padding: "0.3rem", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex" }}>
            <X size={14} />
          </button>
        </div>

        {paid ? (
          <div style={{ textAlign: "center", padding: "var(--space-4) 0" }}>
            <CheckCircle size={40} style={{ color: "#4ade80", margin: "0 auto var(--space-3)" }} />
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)" }}>
              Payment confirmed!
            </p>
            <p style={{ margin: "0.4rem 0 var(--space-4)", fontSize: "0.875rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>
              Your plan will be updated shortly.
            </p>
            <button onClick={onClose} style={{ padding: "0.5rem var(--space-5)", borderRadius: "var(--radius-md)", border: "none", background: "var(--color-brand)", color: "#000", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}>
              Done
            </button>
          </div>
        ) : checkoutId ? (
          <div style={{ textAlign: "center", padding: "var(--space-4) 0" }}>
            <Loader2 size={32} style={{ color: "var(--color-brand)", margin: "0 auto var(--space-3)", animation: "spin 1s linear infinite" }} />
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--color-text-primary)" }}>
              Waiting for payment…
            </p>
            <p style={{ margin: "0.4rem 0 0", fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>
              Enter your M-Pesa PIN on your phone to complete the KES {amountKes.toLocaleString()} payment.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ background: "var(--color-bg-elevated)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)", border: "1px solid var(--color-border-subtle)" }}>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Amount</p>
              <p style={{ margin: "0.2rem 0 0", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", color: "var(--color-text-primary)" }}>KES {amountKes.toLocaleString()}</p>
              <p style={{ margin: "0.1rem 0 0", fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>{planSlug} plan upgrade</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.8125rem", color: "var(--color-text-primary)" }}>
                M-Pesa Phone Number <span style={{ color: "#f87171" }}>*</span>
              </label>
              <input
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }}
                placeholder="+254712345678"
                style={{
                  padding: "0.55rem 0.75rem", border: `1px solid ${phoneError ? "#f87171" : "var(--color-border-default)"}`,
                  borderRadius: "var(--radius-md)", background: "var(--color-bg-elevated)",
                  color: "var(--color-text-primary)", fontFamily: "var(--font-body)", fontSize: "0.875rem", outline: "none",
                }}
              />
              {phoneError && <span style={{ fontSize: "0.6875rem", color: "#f87171", fontFamily: "var(--font-display)" }}>{phoneError}</span>}
              <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
                You'll receive an STK Push prompt on your phone.
              </p>
            </div>
            <button
              type="submit"
              disabled={initMutation.isPending}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                padding: "0.65rem var(--space-4)", borderRadius: "var(--radius-md)",
                border: "none", background: "#4ade80", color: "#000",
                fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700,
                cursor: initMutation.isPending ? "not-allowed" : "pointer",
                opacity: initMutation.isPending ? 0.7 : 1,
              }}
            >
              {initMutation.isPending && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
              {initMutation.isPending ? "Sending request…" : "Send M-Pesa Prompt"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

// ─── PayPal section ────────────────────────────────────────────────────────────

const PAYPAL_CLIENT_ID = (import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined) ?? "sb";

function PayPalSection({ amountUsd, planSlug }: { amountUsd: number; planSlug: string }): JSX.Element {
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (paid) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem", background: "rgba(74,222,128,0.1)", borderRadius: "var(--radius-md)", border: "1px solid rgba(74,222,128,0.3)" }}>
        <CheckCircle size={16} style={{ color: "#4ade80", flexShrink: 0 }} />
        <span style={{ fontSize: "0.875rem", color: "#4ade80", fontFamily: "var(--font-display)", fontWeight: 600 }}>PayPal payment successful! Your plan will update shortly.</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD", intent: "capture" }}>
        <PayPalButtons
          style={{ layout: "horizontal", color: "blue", shape: "rect", label: "pay", height: 40 }}
          createOrder={(_data, actions) =>
            actions.order.create({
              intent: "CAPTURE",
              purchase_units: [{
                amount: { value: amountUsd.toFixed(2), currency_code: "USD" },
                description: `NexusOps ${planSlug} plan`,
              }],
            })
          }
          onApprove={async (_data, actions) => {
            if (actions.order) {
              await actions.order.capture();
              setPaid(true);
            }
          }}
          onError={(err) => {
            console.error("[PayPal]", err);
            setError("PayPal payment failed. Please try again.");
          }}
        />
      </PayPalScriptProvider>
      {error && <span style={{ fontSize: "0.6875rem", color: "#f87171", fontFamily: "var(--font-display)" }}>{error}</span>}
    </div>
  );
}

export default function BillingPage(): JSX.Element {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mpesaTarget, setMpesaTarget] = useState<{ planSlug: string; amountKes: number } | null>(null);
  const T = useT();
  const { plans, loading } = usePricing();

  const displayPlans = !loading && plans.length > 0 ? plans : FALLBACK_PLANS;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex">
        <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
      </div>
      <MobileSidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar title={T("nav.billing")} onMobileMenuOpen={() => setMobileNavOpen(true)} />

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

            {/* Alternative payment methods */}
            <div style={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 12,
              padding: "1.25rem",
            }}>
              <p style={{ margin: "0 0 1rem", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
                Alternative payment methods
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>

                {/* PayPal */}
                <div style={{
                  background: "var(--color-bg-base)", border: "1px solid var(--color-border-subtle)",
                  borderRadius: "var(--radius-lg)", padding: "var(--space-4)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: "#003087", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#fff", fontSize: "0.625rem", fontWeight: 900, fontFamily: "sans-serif" }}>PP</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>PayPal</span>
                  </div>
                  <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
                    Pay securely with your PayPal account or card.
                  </p>
                  {displayPlans[1]?.monthlyPriceUsd != null && (
                    <PayPalSection
                      amountUsd={displayPlans[1].monthlyPriceUsd}
                      planSlug={displayPlans[1].slug}
                    />
                  )}
                </div>

                {/* M-Pesa */}
                <div style={{
                  background: "var(--color-bg-base)", border: "1px solid var(--color-border-subtle)",
                  borderRadius: "var(--radius-lg)", padding: "var(--space-4)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Smartphone size={14} style={{ color: "#000" }} />
                    </div>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>M-Pesa</span>
                    <span style={{ fontSize: "0.6125rem", padding: "0.1rem 0.4rem", borderRadius: 99, background: "rgba(74,222,128,0.1)", color: "#4ade80", fontFamily: "var(--font-display)", fontWeight: 600 }}>Kenya</span>
                  </div>
                  <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
                    Pay via Lipa Na M-Pesa STK Push. A prompt will appear on your phone.
                  </p>
                  <button
                    onClick={() => setMpesaTarget({ planSlug: displayPlans[1]?.slug ?? "pro", amountKes: 6000 })}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.4rem",
                      padding: "0.5rem var(--space-4)", borderRadius: "var(--radius-md)",
                      border: "none", background: "#4ade80", color: "#000",
                      fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 700,
                      cursor: "pointer", width: "100%", justifyContent: "center",
                    }}
                  >
                    <Smartphone size={13} /> Pay KES 6,000 via M-Pesa
                  </button>
                </div>

              </div>
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
                <strong style={{ color: "#ffb347" }}>Stripe card payments:</strong>{" "}
                Set <code style={{ fontSize: "0.75rem" }}>STRIPE_SECRET_KEY</code> and <code style={{ fontSize: "0.75rem" }}>VITE_STRIPE_PUBLISHABLE_KEY</code> to enable card checkout. PayPal and M-Pesa are available now.
              </p>
            </div>

          </div>
        </main>
      </div>

      {/* M-Pesa modal */}
      {mpesaTarget && (
        <MpesaModal
          planSlug={mpesaTarget.planSlug}
          amountKes={mpesaTarget.amountKes}
          onClose={() => setMpesaTarget(null)}
        />
      )}
    </div>
  );
}
