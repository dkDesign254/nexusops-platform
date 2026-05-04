/**
 * NexusOps — PlanGate
 *
 * Wraps any feature behind a plan tier check.
 * If the user's plan doesn't meet the requirement, renders an upgrade CTA
 * overlay instead of (or alongside) the children.
 *
 * Usage:
 *   <PlanGate requiredPlan="pro" currentPlan={user.plan}>
 *     <AdvancedFeature />
 *   </PlanGate>
 *
 * Plans in ascending order: starter < pro < enterprise
 */
import type { ReactNode } from "react";
import { Link } from "wouter";
import { Lock, Zap } from "lucide-react";

export type PlanTier = "starter" | "pro" | "enterprise";

const PLAN_RANK: Record<PlanTier, number> = {
  starter: 0,
  pro: 1,
  enterprise: 2,
};

const PLAN_DISPLAY: Record<PlanTier, string> = {
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

interface PlanGateProps {
  /** Minimum plan required to access this feature */
  requiredPlan: PlanTier;
  /** The user's current plan (defaults to "starter") */
  currentPlan?: PlanTier | string | null;
  /** Feature name shown in the upgrade prompt */
  featureName?: string;
  /** Render children anyway but with an overlay (default: false — replace entirely) */
  overlay?: boolean;
  children: ReactNode;
}

export function PlanGate({
  requiredPlan,
  currentPlan,
  featureName,
  overlay = false,
  children,
}: PlanGateProps): JSX.Element {
  const normalised = (currentPlan ?? "starter") as PlanTier;
  const currentRank = PLAN_RANK[normalised] ?? 0;
  const requiredRank = PLAN_RANK[requiredPlan];
  const hasAccess = currentRank >= requiredRank;

  if (hasAccess) return <>{children}</>;

  const prompt = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        padding: "var(--space-6)",
        background: "linear-gradient(135deg, rgba(61,255,160,0.04) 0%, rgba(0,0,0,0) 100%)",
        border: "1px dashed rgba(61,255,160,0.25)",
        borderRadius: "var(--radius-lg)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(61,255,160,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-brand)",
        }}
      >
        <Lock size={20} />
      </div>
      <div>
        <p
          style={{
            margin: "0 0 0.25rem",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "0.9375rem",
            color: "var(--color-text-primary)",
          }}
        >
          {featureName ? `${featureName} requires ${PLAN_DISPLAY[requiredPlan]}` : `${PLAN_DISPLAY[requiredPlan]} plan required`}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "0.8125rem",
            color: "var(--color-text-tertiary)",
            fontFamily: "var(--font-body)",
          }}
        >
          You're on the {PLAN_DISPLAY[normalised] ?? "Starter"} plan. Upgrade to unlock this feature.
        </p>
      </div>
      <Link href="/billing">
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.5rem 1.25rem",
            background: "var(--color-brand)",
            color: "var(--color-bg-base)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "0.875rem",
            borderRadius: "var(--radius-full)",
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          <Zap size={14} />
          Upgrade to {PLAN_DISPLAY[requiredPlan]}
        </span>
      </Link>
    </div>
  );

  if (!overlay) return prompt;

  // Overlay mode — show children behind a semi-transparent lock
  return (
    <div style={{ position: "relative" }}>
      <div style={{ pointerEvents: "none", userSelect: "none", opacity: 0.3, filter: "blur(2px)" }}>
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(9,11,15,0.5)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        {prompt}
      </div>
    </div>
  );
}

/**
 * UpgradeBanner — inline banner shown at the top of a page
 * when the user is approaching or has hit a plan limit.
 */
interface UpgradeBannerProps {
  message: string;
  ctaText?: string;
}

export function UpgradeBanner({ message, ctaText = "Upgrade now" }: UpgradeBannerProps): JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.625rem var(--space-4)",
        background: "linear-gradient(90deg, rgba(61,255,160,0.08) 0%, rgba(0,212,255,0.05) 100%)",
        border: "1px solid rgba(61,255,160,0.2)",
        borderRadius: "var(--radius-md)",
        marginBottom: "var(--space-4)",
      }}
    >
      <Zap size={15} style={{ color: "var(--color-brand)", flexShrink: 0 }} />
      <p style={{ margin: 0, flex: 1, fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>
        {message}
      </p>
      <Link href="/billing">
        <span
          style={{
            fontSize: "0.8125rem",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            color: "var(--color-brand)",
            cursor: "pointer",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          {ctaText} →
        </span>
      </Link>
    </div>
  );
}
