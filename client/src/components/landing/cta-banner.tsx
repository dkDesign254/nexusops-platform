/**
 * NexusOps — CTABanner
 *
 * Full-width call-to-action section near the bottom of the landing page.
 * Directs visitors to sign up or read docs.
 */
import { useLocation } from "wouter";

export function CTABanner(): JSX.Element {
  const [, setLocation] = useLocation();
  return (
    <section style={{ padding: "var(--space-20) var(--space-6)", background: "var(--color-bg-base)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", borderRadius: "var(--radius-full)", border: "1px solid rgba(14,164,114,0.3)", background: "rgba(14,164,114,0.08)", padding: "0.3rem 0.8rem", fontSize: "0.75rem", color: "var(--color-brand)", fontFamily: "var(--font-body)", marginBottom: "var(--space-6)" }}>
          ⬡ Free to start. No credit card.
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.03em", marginBottom: "var(--space-4)" }}>
          Start governing your AI workflows{" "}
          <span className="text-gradient">today.</span>
        </h2>
        <p style={{ fontSize: "1.0625rem", color: "var(--color-text-secondary)", marginBottom: "var(--space-8)", lineHeight: 1.7 }}>
          Free to start. No credit card. No runtime lock-in.
        </p>
        <div style={{ display: "flex", gap: "var(--space-4)", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setLocation("/auth?mode=signup")}
            className="btn-primary shimmer-border"
            style={{ border: "none", padding: "0.875rem 2.25rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}
          >
            Create your account
          </button>
          <button
            onClick={() => setLocation("/docs")}
            className="btn-ghost"
            style={{ padding: "0.875rem 2rem", fontSize: "1rem", cursor: "pointer" }}
          >
            Read the docs
          </button>
        </div>
      </div>
    </section>
  );
}
