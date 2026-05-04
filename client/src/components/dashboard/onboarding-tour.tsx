/**
 * NexusOps — OnboardingTour
 *
 * First-login guided tour overlay for the dashboard.
 * Fetches steps from Airtable via useTourContent("dashboard", "tour_step").
 * Falls back to 4 hardcoded steps if Airtable returns nothing.
 * Dismissed state is persisted in localStorage ("nexusops_tour_done").
 */
import { useState } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { useTourContent } from "@/hooks/use-tour-content";
import type { TourStep } from "@/lib/airtable";

// ─── Fallback steps ───────────────────────────────────────────────────────────

const FALLBACK_STEPS: TourStep[] = [
  {
    recordId: "step-1",
    helpKey: "welcome",
    type: "tour_step",
    page: "dashboard",
    title: "Welcome to NexusOps",
    bodyText: "Your AI governance command centre. Every workflow, every prompt, every decision — traced and auditable in one place.",
    tourStepOrder: 1,
    ctaLabel: null,
    ctaAction: null,
    targetElementSelector: null,
    active: true,
  },
  {
    recordId: "step-2",
    helpKey: "health-score",
    type: "tour_step",
    page: "dashboard",
    title: "Governance Health Score",
    bodyText: "Your live score (0–100) combines audit completeness, AI traceability, report approvals, and workflow reliability. Aim for 80+.",
    tourStepOrder: 2,
    ctaLabel: null,
    ctaAction: null,
    targetElementSelector: null,
    active: true,
  },
  {
    recordId: "step-3",
    helpKey: "workflows",
    type: "tour_step",
    page: "dashboard",
    title: "Monitor Your Workflows",
    bodyText: "Click Workflows in the sidebar to see every run — status, runtime, duration, and full step-by-step execution logs.",
    tourStepOrder: 3,
    ctaLabel: "Go to Workflows",
    ctaAction: "/workflows",
    targetElementSelector: null,
    active: true,
  },
  {
    recordId: "step-4",
    helpKey: "gaia",
    type: "tour_step",
    page: "dashboard",
    title: "Ask GAIA Anything",
    bodyText: "GAIA is your AI assistant — click the green hexagon button (bottom-right) any time you have a question about the platform or your data.",
    tourStepOrder: 4,
    ctaLabel: null,
    ctaAction: null,
    targetElementSelector: null,
    active: true,
  },
];

const STORAGE_KEY = "nexusops_tour_done";

export interface OnboardingTourProps {
  onDone: () => void;
}

export function OnboardingTour({ onDone }: OnboardingTourProps): JSX.Element | null {
  const { steps: airtableSteps, loading } = useTourContent("dashboard", "tour_step");
  const [step, setStep] = useState(0);

  const steps = !loading && airtableSteps.length > 0 ? airtableSteps : FALLBACK_STEPS;
  const current = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    onDone();
  }

  if (!current) return null;

  return (
    <>
      {/* Full-screen dim overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          zIndex: 200,
          backdropFilter: "blur(2px)",
        }}
        aria-hidden="true"
      />

      {/* Tour card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Platform tour"
        style={{
          position: "fixed",
          bottom: "2.5rem",
          right: "2.5rem",
          zIndex: 201,
          width: 380,
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border-default)",
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-brand)", textTransform: "uppercase", fontFamily: "var(--font-display)" }}>
              Getting started · {step + 1} / {steps.length}
            </p>
            <h3 style={{ margin: "0.25rem 0 0", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.0625rem", color: "var(--color-text-primary)" }}>
              {current.title}
            </h3>
          </div>
          <button
            onClick={dismiss}
            aria-label="Skip tour"
            style={{
              background: "none",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: "0.3rem",
              color: "var(--color-text-tertiary)",
              cursor: "pointer",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.6, fontFamily: "var(--font-display)" }}>
          {current.bodyText}
        </p>

        {/* Step progress dots */}
        <div style={{ display: "flex", gap: "0.375rem", justifyContent: "center" }}>
          {steps.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                borderRadius: 99,
                background: i === step ? "var(--color-brand)" : "var(--color-border-default)",
                transition: "width 0.25s, background 0.25s",
              }}
            />
          ))}
        </div>

        {/* Navigation row */}
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", alignItems: "center" }}>
          {current.ctaLabel && current.ctaAction && (
            <a
              href={current.ctaAction}
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-brand)",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                textDecoration: "none",
                marginRight: "auto",
                padding: "0.4rem 0",
              }}
            >
              {current.ctaLabel} →
            </a>
          )}

          {!isFirst && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                background: "none",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-sm)",
                padding: "0.4rem 0.7rem",
                fontSize: "0.8125rem",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
                fontFamily: "var(--font-display)",
              }}
            >
              <ChevronLeft size={14} /> Back
            </button>
          )}

          {isLast ? (
            <button
              onClick={dismiss}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                background: "var(--color-brand)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "0.4rem 0.9rem",
                fontSize: "0.8125rem",
                color: "#000",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-display)",
              }}
            >
              Get started
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                background: "var(--color-brand)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "0.4rem 0.9rem",
                fontSize: "0.8125rem",
                color: "#000",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-display)",
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/** Returns true if the tour has already been dismissed. */
export function isTourDone(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "1";
}
