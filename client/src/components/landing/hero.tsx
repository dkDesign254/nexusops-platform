/**
 * NexusOps — Hero section
 *
 * Primary landing section with headline, subheadline, dual CTAs,
 * a social proof strip, and the HeroDiagram animation.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { HeroDiagram } from "./hero-diagram";

const RUNTIMES = ["Make", "n8n", "Zapier", "LangChain", "CrewAI"];

function DemoModal({ onClose }: { onClose: () => void }): JSX.Element {
  const lines = [
    "$ nexusops connect --runtime make",
    "> Connected to Make.com runtime ✓",
    "$ nexusops watch --workflow WF-2026-001",
    "> [10:42:01] intake       ✓  Data received from trigger",
    "> [10:42:02] routing      ✓  Dispatched to AI step",
    "> [10:42:03] ai_call      ✓  Prompt sent to claude-sonnet-4-6",
    "> [10:42:05] ai_response  ✓  Response received (842 tokens)",
    "> [10:42:06] report       ✓  Draft report written",
    "> [10:42:07] approval     ⏳ Awaiting human approval...",
    "> [10:42:07] completion   —  Pending",
    "> Governance coverage: 7/7 events logged ✓",
  ];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-6)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-xl)", padding: "var(--space-6)", maxWidth: 560, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>60-second governance demo</p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--color-text-tertiary)", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
        </div>
        <div style={{ background: "var(--color-bg-base)", borderRadius: "var(--radius-md)", padding: "var(--space-4)", fontFamily: "var(--font-body)", fontSize: "0.75rem", lineHeight: 2, overflow: "hidden" }}>
          <div style={{ animation: "scroll-log 8s linear infinite" }}>
            {[...lines, ...lines].map((line, i) => (
              <div key={i} style={{ color: line.startsWith("$") ? "var(--color-brand-light)" : line.includes("✓") ? "var(--color-status-completed)" : line.includes("⏳") ? "var(--color-status-running)" : "var(--color-text-secondary)" }}>
                {line}
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: "var(--space-3)", textAlign: "center", fontFamily: "var(--font-body)" }}>
          This is a preview — connect your runtime to see live traces.
        </p>
      </div>
    </div>
  );
}

export function Hero(): JSX.Element {
  const [, setLocation] = useLocation();
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <section className="hero-ambient" style={{ maxWidth: 1200, margin: "0 auto", padding: "var(--space-20) var(--space-6) var(--space-16)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-16)", alignItems: "center" }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left — copy */}
        <div>
          <div className="fade-in-up visible" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", borderRadius: "var(--radius-full)", border: "1px solid rgba(14,164,114,0.3)", background: "rgba(14,164,114,0.08)", padding: "0.3rem 0.8rem", fontSize: "0.75rem", color: "var(--color-brand)", fontFamily: "var(--font-body)", marginBottom: "var(--space-5)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-brand)", display: "inline-block", animation: "pulse-dot 2s ease infinite" }} />
            Runtime-independent AI governance
          </div>

          <h1 className="fade-in-up visible delay-1" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", color: "var(--color-text-primary)", marginBottom: "var(--space-5)" }}>
            AI runs your workflows.{" "}
            <span className="text-gradient">NexusOps governs them.</span>
          </h1>

          <p className="fade-in-up visible delay-2" style={{ fontSize: "1.0625rem", color: "var(--color-text-secondary)", lineHeight: 1.7, marginBottom: "var(--space-8)", maxWidth: 480 }}>
            The governance layer that sits above every AI automation runtime — logging every decision, tracing every prompt, catching every failure. Runtime-independent. Audit-ready. Enterprise-grade.
          </p>

          <div className="fade-in-up visible delay-3" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-8)" }}>
            <button
              onClick={() => setLocation("/auth?mode=signup")}
              className="btn-primary shimmer-border"
              style={{ border: "none", padding: "0.75rem 1.75rem", fontSize: "0.9375rem", fontWeight: 700, cursor: "pointer" }}
            >
              Start governing free →
            </button>
            <button
              onClick={() => setDemoOpen(true)}
              className="btn-ghost"
              style={{ padding: "0.75rem 1.5rem", fontSize: "0.9375rem", cursor: "pointer" }}
            >
              See a live demo
            </button>
          </div>

          {/* Social proof */}
          <div className="fade-in-up visible delay-4">
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginBottom: "var(--space-3)", fontFamily: "var(--font-body)" }}>
              Trusted by teams running AI on
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {RUNTIMES.map((rt) => (
                <span key={rt} style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", borderRadius: "var(--radius-sm)", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", transition: "border-color 200ms ease" }}>
                  {rt}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right — diagram */}
        <div className="fade-in-up visible delay-2">
          <HeroDiagram />
        </div>
      </div>

      {demoOpen && <DemoModal onClose={() => setDemoOpen(false)} />}
    </section>
  );
}
