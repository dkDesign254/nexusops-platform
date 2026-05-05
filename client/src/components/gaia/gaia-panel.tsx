/**
 * NexusOps — GaiaPanel
 *
 * Slide-in AI assistant panel (380px, full height, fixed right).
 * Page-aware: reads the current route and shows context-specific greetings
 * and tips. Supports a simple chat interface with keyword-matched responses.
 */
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Send, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

export interface GaiaPanelProps {
  /** Whether the panel is visible. */
  isOpen: boolean;
  /** Close the panel. */
  onClose: () => void;
}

interface Message {
  role: "user" | "gaia";
  text: string;
  ts: number;
}

// ─── Page context map ─────────────────────────────────────────────────────────

const PAGE_CONTEXT: Record<string, string> = {
  "/dashboard": "You're on the Dashboard — your governance command centre. I can explain governance scores, alert panels, metric cards, and charts.",
  "/workflows": "You're in Workflows. I can help you filter by status, understand runtimes, create new workflows, and read the table.",
  "/audit": "You're in Execution Logs. I can explain event types, timeline entries, what each step means, and why workflows fail.",
  "/ai-interactions": "You're in AI Interactions. I can explain prompts, responses, token costs, and how to read the diff view.",
  "/reports": "You're in Final Reports. I can explain the approval workflow, how reports are generated, and the compliance lock.",
  "/performance": "You're in Campaign Data. I can explain ROAS, CTR, conversions, spend efficiency, and how data links to workflows.",
  "/integrations": "You're in Integrations. I can help you connect Make, n8n, or any webhook-based runtime to NexusOps.",
  "/billing": "You're in Billing. I can explain plan limits, how to upgrade, and how Stripe manages your subscription.",
  "/settings": "You're in Settings. I can explain profile management, notification preferences, and API key generation.",
  "/gaia": "You're on the GAIA AI page. I'm your guide to everything in NexusOps — ask me anything.",
};

const DEFAULT_CONTEXT = "I can help you navigate NexusOps and understand your AI governance data. Ask me anything about workflows, logs, reports, or platform features.";

// ─── Keyword response matcher ─────────────────────────────────────────────────

function getGaiaResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes("governance") || q.includes("health score") || q.includes("score")) {
    return "The Governance Health Score (0–100) measures how completely your workflows are traced. It combines audit completeness (40%), AI traceability (30%), report approval rate (20%), and workflow reliability (10%). A score above 80 is strong governance.";
  }
  if (q.includes("failed") || q.includes("failure") || q.includes("error")) {
    return "Failed workflows appear in red on the dashboard and trigger bell notifications. Go to Workflows → filter Status = Failed to see all of them. Click any row to view the full execution trace in Audit Logs.";
  }
  if (q.includes("roas")) {
    return "ROAS (Return on Ad Spend) = Revenue ÷ Ad Spend. A ROAS of 8 means for every £1 spent, you earned £8 back. Green bars in Campaign Data show ROAS > 8, amber shows 4–8, red shows < 4.";
  }
  if (q.includes("ctr") || q.includes("click-through") || q.includes("clickthrough")) {
    return "CTR (Click-Through Rate) = Clicks ÷ Impressions × 100. It shows how often people who see your ad actually click it. A higher CTR generally indicates better ad relevance.";
  }
  if (q.includes("approv") || q.includes("report")) {
    return "Final Reports are AI-generated summaries of workflow batches. Go to Final Reports, open a report, review the four sections (Executive Summary, Key Insights, Risks, Recommendation), then click Approve. Approved reports are locked for compliance.";
  }
  if (q.includes("ai interaction") || q.includes("prompt") || q.includes("token")) {
    return "AI Interactions shows every prompt sent to an AI model and the exact response returned, linked to the workflow that triggered it. Each entry includes the model version and estimated token usage.";
  }
  if (q.includes("make") || q.includes("n8n") || q.includes("runtime") || q.includes("connect") || q.includes("integration")) {
    return "NexusOps supports Make.com and n8n as primary runtimes. Go to Integrations to connect your account. For webhooks, copy your personal NexusOps webhook URL from Settings → API tab and paste it into your workflow as the governance endpoint.";
  }
  if (q.includes("webhook") || q.includes("api key")) {
    return "Your personal NexusOps webhook URL is in Settings → API tab. Any automation (Make, n8n, Zapier, LangChain) can POST to this URL to log workflow executions. The format is documented in the Settings page.";
  }
  if (q.includes("audit") || q.includes("execution log") || q.includes("trace")) {
    return "Execution Logs record every step of every workflow run — events, step names, runtimes, and status codes. When a workflow fails, the logs show exactly which step failed and what the error was.";
  }
  if (q.includes("plan") || q.includes("billing") || q.includes("pricing") || q.includes("upgrade")) {
    return "Go to Billing to see your current plan limits and compare plans. Free includes 10 workflows. Starter and Pro offer higher limits and team seats. Enterprise is unlimited. Upgrades go through Stripe Checkout.";
  }
  if (q.includes("language") || q.includes("translation") || q.includes("translate")) {
    return "NexusOps supports English, Swahili, French, Portuguese, and Spanish. Use the language picker in the top bar — changing it updates the entire UI immediately. Your preference is saved to local storage.";
  }
  if (q.includes("hello") || q.includes("hi") || q.includes("help")) {
    return "Hi! I'm GAIA, your NexusOps platform guide. I can help you understand governance scores, navigate workflows, read logs, approve reports, or connect integrations. What do you need help with?";
  }

  return "I can help you navigate NexusOps! Try asking about governance scores, failed workflows, AI logs, reports, campaign metrics, integrations, or billing. I'm here to make the platform clear.";
}

// ─── Suggestion chips ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "What is the Governance Health Score?",
  "Show me how to find failed workflows",
  "Explain AI interaction logs",
  "How do I approve a Final Report?",
  "What does ROAS mean?",
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Slide-in AI assistant panel with page-aware context, chat interface,
 * quick suggestions, and a tour trigger.
 */
export function GaiaPanel({ isOpen, onClose }: GaiaPanelProps): JSX.Element {
  const [location] = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "gaia",
      text: "Hi! I'm GAIA, your NexusOps guide. Ask me anything about the platform, your workflows, or what the data means.",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatHistory = useRef<Array<{ role: "user" | "gaia"; text: string }>>([]);

  const pageContext = PAGE_CONTEXT[location] ?? DEFAULT_CONTEXT;

  const gaiaMutation = trpc.gaia.chat.useMutation();

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  async function sendMessage(text: string): Promise<void> {
    if (!text.trim() || typing) return;
    const trimmed = text.trim();
    const userMsg: Message = { role: "user", text: trimmed, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Keep a rolling history reference for context
    chatHistory.current = [...chatHistory.current, { role: "user", text: trimmed }].slice(-10);

    try {
      const priorHistory = chatHistory.current.slice(0, -1);
      const result = await gaiaMutation.mutateAsync({
        messages: [
          {
            role: "system" as const,
            content: `You are GAIA, the AI governance assistant for NexusOps. Be concise and helpful.\n\nPage context: ${pageContext}`,
          },
          ...priorHistory.map((h) => ({
            role: (h.role === "user" ? "user" : "assistant") as "user" | "assistant",
            content: h.text,
          })),
          { role: "user" as const, content: trimmed },
        ],
      });

      const responseText =
        result.source === "error" || !result.text
          ? getGaiaResponse(trimmed) // keyword fallback when LLM unavailable
          : result.text;

      chatHistory.current = [...chatHistory.current, { role: "gaia", text: responseText }].slice(-10);
      setTyping(false);
      setMessages((prev) => [...prev, { role: "gaia", text: responseText, ts: Date.now() }]);
    } catch {
      // Network/tRPC error — fall back to keyword matching
      const fallback = getGaiaResponse(trimmed);
      chatHistory.current = [...chatHistory.current, { role: "gaia", text: fallback }].slice(-10);
      setTyping(false);
      setMessages((prev) => [...prev, { role: "gaia", text: fallback, ts: Date.now() }]);
    }
  }

  return (
    <>
      {/* Backdrop (mobile) */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 149,
            background: "rgba(0,0,0,0.4)",
          }}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        role="dialog"
        aria-label="GAIA AI assistant"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 380,
          height: "100vh",
          zIndex: 150,
          background: "var(--color-bg-elevated)",
          borderLeft: "1px solid var(--color-border-default)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--color-border-subtle)",
            flexShrink: 0,
          }}
        >
          {/* Hexagon logo */}
          <svg width="32" height="32" viewBox="0 0 32 32">
            <polygon
              points="16,3 28,9.5 28,22.5 16,29 4,22.5 4,9.5"
              fill="rgba(14,164,114,0.15)"
              stroke="var(--color-brand)"
              strokeWidth="1.5"
            />
            <text x="16" y="21" textAnchor="middle" fill="var(--color-brand)" fontSize="13" fontWeight="700" fontFamily="Syne, sans-serif">G</text>
          </svg>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
              GAIA AI
            </p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
              Your platform guide
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close GAIA panel"
            style={{
              background: "none",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: "0.3rem",
              color: "var(--color-text-tertiary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Page context card */}
        <div style={{ padding: "0.75rem 1.25rem", flexShrink: 0 }}>
          <div
            style={{
              background: "rgba(14,164,114,0.08)",
              border: "1px solid rgba(14,164,114,0.2)",
              borderRadius: "var(--radius-md)",
              padding: "0.6rem 0.75rem",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              {pageContext}
            </p>
          </div>
        </div>

        {/* Quick suggestion chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.375rem",
            padding: "0 1.25rem 0.75rem",
            flexShrink: 0,
          }}
        >
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { void sendMessage(s); }}
              style={{
                background: "none",
                border: "1px solid var(--color-border-default)",
                borderRadius: "99px",
                padding: "0.25rem 0.625rem",
                fontSize: "0.6875rem",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
                fontFamily: "var(--font-display)",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-brand)";
                e.currentTarget.style.color = "var(--color-brand)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border-default)";
                e.currentTarget.style.color = "var(--color-text-secondary)";
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.625rem",
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.ts}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "82%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  background: msg.role === "user" ? "var(--color-brand)" : "var(--color-bg-surface)",
                  color: msg.role === "user" ? "#fff" : "var(--color-text-primary)",
                  fontSize: "0.8125rem",
                  lineHeight: 1.5,
                  fontFamily: "var(--font-display)",
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "12px 12px 12px 2px",
                  background: "var(--color-bg-surface)",
                  display: "flex",
                  gap: "4px",
                  alignItems: "center",
                }}
              >
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--color-text-tertiary)",
                      display: "block",
                      animation: `gaia-dot-pulse 1.2s ease-in-out ${delay}ms infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Tour button */}
        <div style={{ padding: "0.75rem 1.25rem 0", flexShrink: 0 }}>
          <button
            onClick={() => alert(`Interactive tour for this page is coming soon!`)}
            style={{
              width: "100%",
              padding: "0.6rem",
              background: "rgba(14,164,114,0.1)",
              border: "1px solid rgba(14,164,114,0.25)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-brand)",
              fontFamily: "var(--font-display)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(14,164,114,0.18)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(14,164,114,0.1)"; }}
          >
            ✦ Start page tour
          </button>
        </div>

        {/* Input */}
        <div
          style={{
            padding: "0.75rem 1.25rem 1.25rem",
            borderTop: "1px solid var(--color-border-subtle)",
            marginTop: "0.75rem",
            flexShrink: 0,
          }}
        >
          <form
            onSubmit={(e) => { e.preventDefault(); void sendMessage(input); }}
            style={{ display: "flex", gap: "0.5rem" }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask GAIA anything…"
              style={{
                flex: 1,
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-md)",
                padding: "0.5rem 0.75rem",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-display)",
                fontSize: "0.8125rem",
                outline: "none",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-brand)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-default)"; }}
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!input.trim() || typing}
              style={{
                background: input.trim() && !typing ? "var(--color-brand)" : "var(--color-bg-surface)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "0.5rem 0.625rem",
                color: input.trim() && !typing ? "#fff" : "var(--color-text-tertiary)",
                cursor: input.trim() && !typing ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                transition: "all 0.15s",
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>

      {/* Dot pulse keyframes (injected once) */}
      <style>{`
        @keyframes gaia-dot-pulse {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
