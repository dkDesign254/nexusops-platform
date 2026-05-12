/**
 * NexusOps — BookADemoPage
 * Route: /book-a-demo (public — no auth required)
 *
 * Split-layout page:
 *   Left  — value proposition, social proof, key benefits
 *   Right — 9-field booking form → writes to Airtable Demo Bookings table
 *
 * On submit the form calls createDemoBooking() from lib/airtable.ts
 * and shows a success state with next-steps messaging.
 *
 * Team-size options, use-case options, and preferred-date picker are
 * all self-contained in this file to avoid unnecessary shared components.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import {
  CheckCircle, ArrowRight, Shield, Zap, Globe,
  Users, Lock, ChevronLeft, Loader2,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { createDemoBooking, type DemoBookingInput } from "@/lib/airtable";
import { toast } from "sonner";

// ─── Constants ─────────────────────────────────────────────────────────────────

const TEAM_SIZE_OPTIONS = [
  "Just me (1)",
  "2–10",
  "11–50",
  "51–200",
  "201–1000",
  "1000+",
];

const USE_CASE_OPTIONS = [
  "AI Workflow Governance",
  "Compliance Auditing",
  "Agent Orchestration",
  "LLM Output Monitoring",
  "Multi-runtime Automation",
  "Other",
];

const BENEFIT_ITEMS = [
  { icon: <Shield size={18} />, text: "See live governance controls in action" },
  { icon: <Zap size={18} />, text: "Custom onboarding for your tech stack" },
  { icon: <Globe size={18} />, text: "Multi-region data residency options" },
  { icon: <Users size={18} />, text: "Hands-on team workspace setup" },
  { icon: <Lock size={18} />, text: "SSO, RBAC & audit trail walkthrough" },
];

// ─── Field component ───────────────────────────────────────────────────────────

function Field({
  label, required = false, children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label style={{
        fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.8125rem",
        color: "var(--color-text-primary)",
      }}>
        {label}
        {required && <span style={{ color: "#f87171", marginLeft: "0.2rem" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "0.55rem 0.75rem",
  border: "1px solid var(--color-border-default)",
  borderRadius: "var(--radius-md)",
  background: "var(--color-bg-elevated)",
  color: "var(--color-text-primary)",
  fontFamily: "var(--font-body)", fontSize: "0.875rem",
  outline: "none",
  transition: "border-color var(--transition-fast)",
};

// ─── Success state ─────────────────────────────────────────────────────────────

function SuccessState({ onBack }: { onBack: () => void }): JSX.Element {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--space-8)", textAlign: "center" }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: "rgba(14,164,114,0.1)", display: "flex",
        alignItems: "center", justifyContent: "center",
        margin: "0 auto var(--space-5)",
        border: "1px solid rgba(14,164,114,0.3)",
      }}>
        <CheckCircle size={32} style={{ color: "var(--color-brand)" }} />
      </div>
      <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.5rem", color: "var(--color-text-primary)" }}>
        Request received!
      </h2>
      <p style={{ margin: "0.75rem 0 0", maxWidth: 400, fontSize: "0.9375rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", lineHeight: 1.6 }}>
        Our team will reach out within one business day to confirm your demo slot and personalise the session.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "var(--space-6)", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.55rem var(--space-5)", borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border-default)", background: "transparent",
            color: "var(--color-text-secondary)", fontFamily: "var(--font-display)",
            fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
          }}
        >
          <ChevronLeft size={14} /> Back to site
        </button>
        <a
          href="https://docs.nexusops.ai"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            padding: "0.55rem var(--space-5)", borderRadius: "var(--radius-md)",
            border: "none", background: "var(--color-brand)", color: "#000",
            fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700,
            textDecoration: "none", cursor: "pointer",
          }}
        >
          Explore docs <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

interface FormState {
  fullName: string;
  workEmail: string;
  company: string;
  jobTitle: string;
  teamSize: string;
  primaryUseCase: string;
  currentTools: string;
  preferredDate: string;
  message: string;
}

const EMPTY_FORM: FormState = {
  fullName: "", workEmail: "", company: "", jobTitle: "",
  teamSize: "", primaryUseCase: "", currentTools: "",
  preferredDate: "", message: "",
};

export default function BookADemoPage(): JSX.Element {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<FormState> = {};
    if (!form.fullName.trim()) errs.fullName = "Required";
    if (!form.workEmail.trim() || !/\S+@\S+\.\S+/.test(form.workEmail)) errs.workEmail = "Valid email required";
    if (!form.company.trim()) errs.company = "Required";
    if (!form.teamSize) errs.teamSize = "Please select team size";
    if (!form.primaryUseCase) errs.primaryUseCase = "Please select a use case";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const input: DemoBookingInput = {
        fullName:       form.fullName.trim(),
        workEmail:      form.workEmail.trim(),
        company:        form.company.trim(),
        jobTitle:       form.jobTitle.trim(),
        teamSize:       form.teamSize,
        primaryUseCase: form.primaryUseCase,
        currentTools:   form.currentTools.trim(),
        preferredDate:  form.preferredDate,
        message:        form.message.trim(),
        source:         "website",
      };
      await createDemoBooking(input);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Submission failed. Please try again or email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-base)", display: "flex", flexDirection: "column" }}>

      {/* Nav */}
      <header style={{
        borderBottom: "1px solid var(--color-border-subtle)",
        padding: "var(--space-4) var(--space-6)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--color-bg-surface)",
      }}>
        <button onClick={() => setLocation("/")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <Logo size="sm" />
        </button>
        <button
          onClick={() => setLocation("/auth")}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.45rem var(--space-4)", borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border-default)", background: "transparent",
            color: "var(--color-text-secondary)", fontFamily: "var(--font-display)",
            fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer",
          }}
        >
          Sign in
        </button>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", flexDirection: "row", flexWrap: "wrap" }}>

        {/* Left panel */}
        <div style={{
          flex: "0 0 clamp(280px, 40%, 480px)",
          background: "var(--color-bg-surface)",
          borderRight: "1px solid var(--color-border-subtle)",
          padding: "var(--space-8) var(--space-7)",
          display: "flex", flexDirection: "column", gap: "var(--space-6)",
        }}>
          <div>
            <span style={{
              display: "inline-block", padding: "0.2rem 0.625rem", borderRadius: 99,
              background: "rgba(14,164,114,0.1)", color: "var(--color-brand)",
              fontSize: "0.6875rem", fontFamily: "var(--font-display)", fontWeight: 700,
              letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "var(--space-3)",
            }}>
              Book a Demo
            </span>
            <h1 style={{
              margin: 0, fontFamily: "var(--font-display)", fontWeight: 800,
              fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "var(--color-text-primary)",
              lineHeight: 1.15,
            }}>
              See NexusOps in action
            </h1>
            <p style={{
              margin: "0.75rem 0 0", fontSize: "0.9375rem", color: "var(--color-text-secondary)",
              fontFamily: "var(--font-body)", lineHeight: 1.65,
            }}>
              Get a personalised 45-minute walkthrough of the platform tailored to your team's AI governance challenges.
            </p>
          </div>

          {/* Benefits list */}
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {BENEFIT_ITEMS.map((item, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "var(--radius-md)",
                  background: "rgba(14,164,114,0.1)", border: "1px solid rgba(14,164,114,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--color-brand)", flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>

          {/* Social proof */}
          <div style={{
            marginTop: "auto",
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-4)",
          }}>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", lineHeight: 1.6, fontStyle: "italic" }}>
              "NexusOps gave our compliance team full visibility into every AI-generated decision across 14 workflows — in under a week."
            </p>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", fontWeight: 600 }}>
              — Head of AI Operations, Series B FinTech
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div style={{ flex: 1, minWidth: 320, padding: "var(--space-8) var(--space-7)", display: "flex", flexDirection: "column" }}>
          {submitted ? (
            <SuccessState onBack={() => setLocation("/")} />
          ) : (
            <>
              <h2 style={{ margin: "0 0 var(--space-6)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
                Request your demo
              </h2>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 540 }}>

                {/* Name + Email */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                  <Field label="Full Name" required>
                    <input
                      value={form.fullName} onChange={set("fullName")}
                      placeholder="Jane Smith" style={{ ...inputStyle, borderColor: errors.fullName ? "#f87171" : undefined }}
                    />
                    {errors.fullName && <span style={{ fontSize: "0.6875rem", color: "#f87171", fontFamily: "var(--font-display)" }}>{errors.fullName}</span>}
                  </Field>
                  <Field label="Work Email" required>
                    <input
                      type="email" value={form.workEmail} onChange={set("workEmail")}
                      placeholder="jane@company.com" style={{ ...inputStyle, borderColor: errors.workEmail ? "#f87171" : undefined }}
                    />
                    {errors.workEmail && <span style={{ fontSize: "0.6875rem", color: "#f87171", fontFamily: "var(--font-display)" }}>{errors.workEmail}</span>}
                  </Field>
                </div>

                {/* Company + Job Title */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                  <Field label="Company" required>
                    <input
                      value={form.company} onChange={set("company")}
                      placeholder="Acme Corp" style={{ ...inputStyle, borderColor: errors.company ? "#f87171" : undefined }}
                    />
                    {errors.company && <span style={{ fontSize: "0.6875rem", color: "#f87171", fontFamily: "var(--font-display)" }}>{errors.company}</span>}
                  </Field>
                  <Field label="Job Title">
                    <input
                      value={form.jobTitle} onChange={set("jobTitle")}
                      placeholder="VP Engineering" style={inputStyle}
                    />
                  </Field>
                </div>

                {/* Team size + Use case */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                  <Field label="Team Size" required>
                    <select
                      value={form.teamSize} onChange={set("teamSize")}
                      style={{ ...inputStyle, borderColor: errors.teamSize ? "#f87171" : undefined }}
                    >
                      <option value="">Select…</option>
                      {TEAM_SIZE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    {errors.teamSize && <span style={{ fontSize: "0.6875rem", color: "#f87171", fontFamily: "var(--font-display)" }}>{errors.teamSize}</span>}
                  </Field>
                  <Field label="Primary Use Case" required>
                    <select
                      value={form.primaryUseCase} onChange={set("primaryUseCase")}
                      style={{ ...inputStyle, borderColor: errors.primaryUseCase ? "#f87171" : undefined }}
                    >
                      <option value="">Select…</option>
                      {USE_CASE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    {errors.primaryUseCase && <span style={{ fontSize: "0.6875rem", color: "#f87171", fontFamily: "var(--font-display)" }}>{errors.primaryUseCase}</span>}
                  </Field>
                </div>

                {/* Current tools */}
                <Field label="Current Automation Tools">
                  <input
                    value={form.currentTools} onChange={set("currentTools")}
                    placeholder="e.g. Make.com, n8n, Zapier, custom Python…" style={inputStyle}
                  />
                </Field>

                {/* Preferred date */}
                <Field label="Preferred Demo Date">
                  <input
                    type="date" value={form.preferredDate} onChange={set("preferredDate")}
                    min={new Date().toISOString().split("T")[0]}
                    style={inputStyle}
                  />
                </Field>

                {/* Message */}
                <Field label="Anything else we should know?">
                  <textarea
                    value={form.message} onChange={set("message")}
                    rows={3} placeholder="Specific integrations, compliance frameworks, scale requirements…"
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </Field>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    padding: "0.7rem var(--space-6)", borderRadius: "var(--radius-md)",
                    border: "none", background: "var(--color-brand)", color: "#000",
                    fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 700,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                    transition: "all var(--transition-fast)",
                    marginTop: "var(--space-2)",
                  }}
                >
                  {submitting ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
                  {submitting ? "Submitting…" : "Request Demo"}
                  {!submitting && <ArrowRight size={15} />}
                </button>

                <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", textAlign: "center" }}>
                  No spam. Unsubscribe at any time. We respect your privacy.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
