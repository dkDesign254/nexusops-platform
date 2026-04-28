/**
 * NexusOps — GAIA AI
 * Route: /gaia (protected)
 *
 * In-app guide, keyword router, section cards, FAQ, and platform walkthrough tour.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { useWorkflows } from "@/hooks/use-workflows";
import { useT } from "@/contexts/LocaleContext";
import {
  Activity, ArrowRight, BarChart3, Bot, Brain, ChevronDown, ChevronUp,
  FileText, LayoutDashboard, MessageSquareText, Settings, Sparkles, Workflow,
} from "lucide-react";
import { toast } from "sonner";

// ── Tour ────────────────────────────────────────────────────────────────────

const TOUR_STEP_COUNT = 8;
const TOUR_ROUTES = [null, "/dashboard", "/workflows", "/audit", "/ai-interactions", "/reports", "/performance", "/gaia"];

function TourCard({ step, total, onNext, onSkip, T }: {
  step: number; total: number; onNext: () => void; onSkip: () => void;
  T: (k: Parameters<ReturnType<typeof useT>>[0]) => string;
}) {
  const key = step as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  const titleKey = `tour.${key}.title` as Parameters<typeof T>[0];
  const descKey = `tour.${key}.desc` as Parameters<typeof T>[0];
  const isLast = step === total;
  return (
    <div style={{
      position: "fixed", bottom: 32, right: 32, zIndex: 200,
      background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-default)",
      borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)",
      padding: "var(--space-5)", maxWidth: 340, width: "calc(100vw - 64px)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
        <span style={{ fontSize: "0.6875rem", color: "var(--color-brand)", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {step} / {total}
        </span>
        <button onClick={onSkip} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", fontSize: "0.75rem", fontFamily: "var(--font-display)" }}>
          {T("gaia.tourSkip")}
        </button>
      </div>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)", marginBottom: "0.4rem" }}>{T(titleKey)}</p>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "var(--space-4)" }}>{T(descKey)}</p>
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <button
          onClick={onNext}
          style={{ flex: 1, background: "var(--color-brand)", border: "none", borderRadius: "var(--radius-md)", padding: "0.55rem", color: "var(--color-text-inverse)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
          {isLast ? T("gaia.tourDone") : T("gaia.tourNext")}
        </button>
      </div>
    </div>
  );
}

// ── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ icon, title, desc, cta, onClick }: { icon: React.ReactNode; title: string; desc: string; cta: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ textAlign: "left", background: hovered ? "var(--color-bg-hover)" : "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: "var(--space-5)", cursor: "pointer", transition: "all var(--transition-fast)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-3)" }}>
        <div style={{ padding: "var(--space-2)", background: "rgba(14,164,114,0.1)", borderRadius: "var(--radius-md)", border: "1px solid rgba(14,164,114,0.2)" }}>{icon}</div>
        <ArrowRight size={14} style={{ color: "var(--color-text-tertiary)", marginTop: 2 }} />
      </div>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)", marginBottom: "0.35rem" }}>{title}</p>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.55, marginBottom: "var(--space-3)" }}>{desc}</p>
      <p style={{ fontSize: "0.75rem", color: "var(--color-brand)", fontFamily: "var(--font-display)", fontWeight: 500 }}>{cta}</p>
    </button>
  );
}

// ── FAQ item ──────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  { q: "What is NexusOps?", a: "NexusOps is an AI agent operations platform. It monitors every AI-powered workflow running in your organisation, providing governance, observability, and accountability across Make, n8n, and other automation runtimes." },
  { q: "What are Workflows?", a: "A workflow is any automated process that runs on a connected runtime (Make, n8n, etc.). NexusOps logs every run, tracks success/failure, and links each workflow to its execution logs, AI decisions, and reports." },
  { q: "What are Execution Logs?", a: "Execution Logs give you a step-by-step trace of every workflow run. Each entry shows the event type, which step ran, the runtime, status code, and any error messages — making it easy to debug failures." },
  { q: "What are AI Interactions?", a: "AI Interactions show every prompt sent to a language model during workflow execution and the response returned. This is how you audit what AI said, catch hallucinations, and understand why your workflow behaved a certain way." },
  { q: "What are Final Reports?", a: "Final Reports are AI-generated executive summaries produced after a workflow batch completes. They need your approval before going to stakeholders. You can approve or review them here." },
  { q: "What is Campaign Data?", a: "Campaign Data connects your workflow activity to business performance — ad spend, conversion rates, and campaign-level outcomes. Use it to see whether your AI automations are driving real results." },
  { q: "What does GAIA AI do?", a: "GAIA AI is your in-app operator guide. Type what you're looking for and GAIA will route you to the right section. It can't run queries yet, but it understands plain-language requests and navigates the platform for you." },
  { q: "How do I see only failed workflows?", a: "Click 'Show failed workflows' in the suggestion chips above, or type 'failed' in the Ask GAIA box. You can also filter workflows on the Workflows page and Execution Logs page directly." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-4) 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)" }}>{q}</span>
        {open ? <ChevronUp size={16} style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }} />}
      </button>
      {open && (
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.65, paddingBottom: "var(--space-4)" }}>{a}</p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GAIAPage(): JSX.Element {
  const [, setLocation] = useLocation();
  const { data: workflows } = useWorkflows();
  const T = useT();
  const [prompt, setPrompt] = useState("");
  const [tourStep, setTourStep] = useState<number | null>(null);

  function handleAsk() {
    const text = prompt.trim().toLowerCase();
    if (!text) { toast.error("Type a request first."); return; }

    if (text.includes("failed") || text.includes("failure")) { setLocation("/audit?status=failed"); return; }
    if (text.includes("pending")) { setLocation("/audit?status=pending"); return; }
    if (text.includes("completed") || text.includes("success")) { setLocation("/audit?status=completed"); return; }
    if (text.includes("make")) { setLocation("/workflows?runtime=make"); return; }
    if (text.includes("n8n")) { setLocation("/workflows?runtime=n8n"); return; }
    if (text.includes("workflow")) { setLocation("/workflows"); return; }
    if (text.includes("log") || text.includes("execution") || text.includes("error")) { setLocation("/audit"); return; }
    if (text.includes("ai") || text.includes("prompt") || text.includes("model")) { setLocation("/ai-interactions"); return; }
    if (text.includes("report") || text.includes("summary")) { setLocation("/reports"); return; }
    if (text.includes("performance") || text.includes("campaign") || text.includes("conversion")) { setLocation("/performance"); return; }
    if (text.includes("setting") || text.includes("api") || text.includes("key")) { setLocation("/settings"); return; }
    if (text.includes("dashboard") || text.includes("overview")) { setLocation("/dashboard"); return; }

    toast.info("GAIA understood the request but that route isn't mapped yet. Try a more specific keyword.");
  }

  function startTour() {
    setTourStep(1);
  }

  function advanceTour() {
    if (tourStep === null) return;
    const next = tourStep + 1;
    if (next > TOUR_STEP_COUNT) {
      setTourStep(null);
      return;
    }
    const route = TOUR_ROUTES[next];
    if (route && route !== "/gaia") setLocation(route);
    setTourStep(next);
  }

  const CARDS = [
    { icon: <Workflow size={16} style={{ color: "var(--color-brand)" }} />, title: T("gaia.card.workflows"), desc: T("gaia.card.workflows.desc"), cta: T("gaia.card.workflows.cta"), route: "/workflows" },
    { icon: <Activity size={16} style={{ color: "#60a5fa" }} />, title: T("gaia.card.execLogs"), desc: T("gaia.card.execLogs.desc"), cta: T("gaia.card.execLogs.cta"), route: "/audit" },
    { icon: <Bot size={16} style={{ color: "#a78bfa" }} />, title: T("gaia.card.aiLogs"), desc: T("gaia.card.aiLogs.desc"), cta: T("gaia.card.aiLogs.cta"), route: "/ai-interactions" },
    { icon: <FileText size={16} style={{ color: "#fb923c" }} />, title: T("gaia.card.reports"), desc: T("gaia.card.reports.desc"), cta: T("gaia.card.reports.cta"), route: "/reports" },
    { icon: <BarChart3 size={16} style={{ color: "#34d399" }} />, title: T("gaia.card.performance"), desc: T("gaia.card.performance.desc"), cta: T("gaia.card.performance.cta"), route: "/performance" },
    { icon: <Settings size={16} style={{ color: "#f87171" }} />, title: T("gaia.card.settings"), desc: T("gaia.card.settings.desc"), cta: T("gaia.card.settings.cta"), route: "/settings" },
  ];

  const CHIPS = [
    { label: T("gaia.chip.failedWf"), action: () => setLocation("/audit?status=failed") },
    { label: T("gaia.chip.makeWf"), action: () => setLocation("/workflows?runtime=make") },
    { label: T("gaia.chip.n8nWf"), action: () => setLocation("/workflows?runtime=n8n") },
    { label: T("gaia.chip.aiLogs"), action: () => { setPrompt("Explain AI logs"); } },
    { label: T("gaia.chip.reports"), action: () => setLocation("/reports") },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title={T("gaia.title")} />
        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

            {/* Hero */}
            <section style={{ background: "var(--color-bg-surface)", borderRadius: "var(--radius-xl)", padding: "var(--space-7)", border: "1px solid var(--color-border-subtle)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at top right, rgba(14,164,114,0.08), transparent 40%)" }} />
              <div style={{ position: "relative" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", borderRadius: "var(--radius-full)", border: "1px solid rgba(14,164,114,0.3)", background: "rgba(14,164,114,0.08)", padding: "0.3rem 0.75rem", marginBottom: "var(--space-4)" }}>
                  <Sparkles size={12} style={{ color: "var(--color-brand)" }} />
                  <span style={{ fontSize: "0.75rem", color: "var(--color-brand)", fontFamily: "var(--font-display)", fontWeight: 600 }}>GAIA AI · NexusOps Guide</span>
                </div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
                  {T("gaia.title")}
                </h1>
                <p style={{ fontSize: "0.9375rem", color: "var(--color-text-secondary)", maxWidth: 640, lineHeight: 1.6 }}>
                  {T("gaia.subtitle")}
                </p>
                <div style={{ marginTop: "var(--space-5)", display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <LayoutDashboard size={14} style={{ color: "var(--color-text-tertiary)" }} />
                    <span style={{ fontSize: "0.8125rem", color: "var(--color-text-tertiary)" }}>{workflows.length} workflows monitored</span>
                  </div>
                  <button onClick={startTour}
                    style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", background: "none", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", padding: "0.4rem 0.85rem", cursor: "pointer", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontSize: "0.8125rem", transition: "all var(--transition-fast)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-brand)"; e.currentTarget.style.color = "var(--color-brand)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-default)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}>
                    <Sparkles size={13} /> {T("gaia.tourStart")}
                  </button>
                </div>
              </div>
            </section>

            {/* Ask GAIA */}
            <section style={{ background: "var(--color-bg-surface)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)", border: "1px solid rgba(14,164,114,0.2)", boxShadow: "0 0 0 1px rgba(14,164,114,0.06), 0 4px 32px rgba(14,164,114,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                <div style={{ padding: "var(--space-2)", background: "rgba(14,164,114,0.1)", borderRadius: "var(--radius-md)", border: "1px solid rgba(14,164,114,0.2)" }}>
                  <Brain size={16} style={{ color: "var(--color-brand)" }} />
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>{T("gaia.askTitle")}</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: 2 }}>{T("gaia.askSub")}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAsk(); }}
                  placeholder={T("gaia.placeholder")}
                  style={{ flex: 1, minWidth: 200, height: 44, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)", background: "var(--color-bg-elevated)", color: "var(--color-text-primary)", fontFamily: "var(--font-display)", fontSize: "0.875rem", padding: "0 var(--space-4)", outline: "none" }}
                />
                <button onClick={handleAsk}
                  style={{ height: 44, padding: "0 var(--space-5)", background: "var(--color-brand)", border: "none", borderRadius: "var(--radius-md)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "var(--space-2)", whiteSpace: "nowrap" }}>
                  <MessageSquareText size={15} /> {T("gaia.btn")}
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
                {CHIPS.map((chip) => (
                  <button key={chip.label} onClick={chip.action}
                    style={{ padding: "0.35rem 0.85rem", borderRadius: "var(--radius-full)", border: "1px solid var(--color-border-default)", background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontSize: "0.8125rem", cursor: "pointer", transition: "all var(--transition-fast)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-brand)"; e.currentTarget.style.color = "var(--color-brand)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-default)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}>
                    {chip.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Section cards */}
            <section>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)", marginBottom: "var(--space-4)" }}>{T("gaia.cardsTitle")}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
                {CARDS.map((card) => (
                  <SectionCard key={card.route} icon={card.icon} title={card.title} desc={card.desc} cta={card.cta} onClick={() => setLocation(card.route)} />
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section style={{ background: "var(--color-bg-surface)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)", border: "1px solid var(--color-border-subtle)" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)", marginBottom: "var(--space-4)" }}>{T("gaia.faqTitle")}</p>
              {FAQ_ITEMS.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </section>

          </div>
        </main>
      </div>

      {tourStep !== null && (
        <TourCard
          step={tourStep}
          total={TOUR_STEP_COUNT}
          onNext={advanceTour}
          onSkip={() => setTourStep(null)}
          T={T}
        />
      )}
    </div>
  );
}
