/**
 * NexusOps — 404 Not Found page
 *
 * Shown when no route matches. Provides navigation back to home.
 */
import { useLocation } from "wouter";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/hooks/use-auth";

export default function NotFoundPage(): JSX.Element {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const destination = user ? "/dashboard" : "/";

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--space-6)", textAlign: "center" }}>
      <Logo size="sm" />
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", color: "var(--color-brand)", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "var(--space-8)", marginBottom: "var(--space-2)" }}>
        404
      </p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "var(--space-4)", letterSpacing: "-0.02em" }}>
        Page not found
      </h1>
      <p style={{ fontSize: "0.9375rem", color: "var(--color-text-secondary)", marginBottom: "var(--space-8)", maxWidth: 360, lineHeight: 1.6 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button onClick={() => setLocation(destination)}
          style={{ background: "var(--color-brand)", border: "none", borderRadius: "var(--radius-md)", padding: "0.65rem 1.5rem", fontSize: "0.9375rem", fontWeight: 700, color: "#000", cursor: "pointer", fontFamily: "var(--font-display)" }}>
          {user ? "Back to Dashboard" : "Back to home"}
        </button>
        {user && (
          <button onClick={() => setLocation("/workflows")}
            style={{ background: "transparent", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", padding: "0.65rem 1.5rem", fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "var(--font-display)" }}>
            View Workflows
          </button>
        )}
      </div>
    </div>
  );
}
