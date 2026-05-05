/**
 * NexusOps — GAIA AI
 * Route: /gaia (protected)
 *
 * Phase 7: Full-featured Gaia interface — chat with session history,
 * suggested prompts, document upload, suggested agents/workflows,
 * "Create from this" action buttons, and FAQ shortcuts.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Bot, ChevronRight, FileText, Loader2, Plus, Send,
  Sparkles, Upload, Workflow, X, Zap, HelpCircle,
  RefreshCw, Copy, ThumbsUp, AlertTriangle, CheckCircle2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Session {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
}

// ─── Suggested Prompts ────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  { icon: <Workflow size={14} />, label: "Build a weekly reporting workflow", prompt: "I need a weekly report that checks campaign performance, flags low ROAS campaigns, summarises results, and recommends next steps. Which runtime should I use and what integrations do I need?" },
  { icon: <Bot size={14} />, label: "Set up an anomaly detection agent", prompt: "Help me create an agent that monitors my marketing campaign ROAS and CTR in real time and raises an alert when metrics drop below a threshold. Walk me through what I need step by step." },
  { icon: <Zap size={14} />, label: "Explain how Make and n8n differ", prompt: "I'm not technical. Can you explain the difference between Make and n8n, and help me decide which one to use for a simple weekly email report?" },
  { icon: <AlertTriangle size={14} />, label: "Review my governance setup", prompt: "What governance risks exist in my current NexusOps setup? Review what I have and tell me what's missing or risky." },
  { icon: <FileText size={14} />, label: "Turn my document into a workflow plan", prompt: "I'll upload a use case document. Please analyse it and produce a step-by-step workflow plan with governance requirements and required integrations." },
  { icon: <HelpCircle size={14} />, label: "What can NexusOps do for me?", prompt: "I'm new here. What can NexusOps do? Give me a plain-English overview of the platform and suggest where I should start." },
];

// ─── FAQ Shortcuts ────────────────────────────────────────────────────────────

const FAQ_SHORTCUTS = [
  "How do I connect Airtable?",
  "What is runtime-independent automation?",
  "How does the AI generate reports?",
  "Why do I need execution logs?",
  "How do I create my first agent?",
];

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, onCopy }: { msg: Message; onCopy: (text: string) => void }) {
  const isUser = msg.role === "user";
  const lines = msg.content.split("\n");

  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      gap: "var(--space-3)",
      marginBottom: "var(--space-4)",
      alignItems: "flex-start",
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: "var(--radius-full)",
        background: isUser ? "rgba(61,255,160,0.12)" : "rgba(96,165,250,0.12)",
        border: `1px solid ${isUser ? "rgba(61,255,160,0.3)" : "rgba(96,165,250,0.3)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {isUser
          ? <span style={{ fontSize: "0.75rem", color: "var(--color-brand)" }}>You</span>
          : <Sparkles size={14} style={{ color: "#60a5fa" }} />}
      </div>

      {/* Content */}
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{
          background: isUser ? "rgba(61,255,160,0.07)" : "var(--color-bg-elevated)",
          border: `1px solid ${isUser ? "rgba(61,255,160,0.2)" : "var(--color-border-subtle)"}`,
          borderRadius: "var(--radius-lg)",
          padding: "0.75rem var(--space-4)",
        }}>
          {lines.map((line, i) => (
            <p key={i} style={{
              margin: i === 0 ? 0 : "0.5rem 0 0",
              fontSize: "0.875rem",
              color: "var(--color-text-primary)",
              lineHeight: 1.65,
              fontFamily: "var(--font-body)",
              whiteSpace: "pre-wrap",
            }}>
              {line || " "}
            </p>
          ))}
        </div>
        {!isUser && (
          <div style={{ display: "flex", gap: "var(--space-2)", paddingLeft: 4 }}>
            <button
              onClick={() => onCopy(msg.content)}
              title="Copy"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", gap: 4, fontSize: "0.6875rem", fontFamily: "var(--font-display)" }}
            >
              <Copy size={11} /> Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Suggested Action Panel ───────────────────────────────────────────────────

function SuggestedActions({ lastResponse, onNavigate }: { lastResponse: string; onNavigate: (path: string) => void }) {
  const lower = lastResponse.toLowerCase();
  const suggestWorkflow = lower.includes("workflow") || lower.includes("runtime") || lower.includes("make") || lower.includes("n8n");
  const suggestAgent = lower.includes("agent") || lower.includes("monitor") || lower.includes("anomaly");
  const suggestIntegrations = lower.includes("integration") || lower.includes("connect") || lower.includes("airtable");

  if (!suggestWorkflow && !suggestAgent && !suggestIntegrations) return null;

  return (
    <div style={{
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border-subtle)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-4)",
      marginTop: "var(--space-3)",
    }}>
      <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-3)" }}>
        Suggested next steps
      </p>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        {suggestWorkflow && (
          <button
            onClick={() => onNavigate("/builder")}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.4rem 0.875rem", background: "rgba(61,255,160,0.08)", border: "1px solid rgba(61,255,160,0.25)", borderRadius: "var(--radius-md)", color: "var(--color-brand)", fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
          >
            <Workflow size={13} /> Build this workflow
          </button>
        )}
        {suggestAgent && (
          <button
            onClick={() => onNavigate("/agents")}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.4rem 0.875rem", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: "var(--radius-md)", color: "#60a5fa", fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
          >
            <Bot size={13} /> Create an agent
          </button>
        )}
        {suggestIntegrations && (
          <button
            onClick={() => onNavigate("/integrations")}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.4rem 0.875rem", background: "rgba(192,132,252,0.08)", border: "1px solid rgba(192,132,252,0.25)", borderRadius: "var(--radius-md)", color: "#c084fc", fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
          >
            <Zap size={13} /> Connect integrations
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Document Upload ──────────────────────────────────────────────────────────

function DocumentUpload({ onExtracted }: { onExtracted: (text: string, filename: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const process = useCallback((file: File) => {
    if (file.size > 600_000) { toast.error("File too large — max 600 KB"); return; }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string).slice(0, 8000);
      onExtracted(text, file.name);
      setLoading(false);
      toast.success(`"${file.name}" ready to analyse`);
    };
    reader.onerror = () => { toast.error("Failed to read file"); setLoading(false); };
    reader.readAsText(file);
  }, [onExtracted]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) process(f); }}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `1px dashed ${dragging ? "var(--color-brand)" : "var(--color-border-subtle)"}`,
        borderRadius: "var(--radius-md)", padding: "0.875rem",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
        cursor: loading ? "not-allowed" : "pointer",
        background: dragging ? "rgba(61,255,160,0.04)" : "transparent",
        transition: "all 0.15s",
        color: "var(--color-text-tertiary)", fontSize: "0.8125rem", fontFamily: "var(--font-display)",
      }}
    >
      <input ref={inputRef} type="file" accept=".txt,.md,.pdf,.csv,.json" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) process(f); }} />
      {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={14} />}
      {loading ? "Reading…" : "Upload use case (.txt, .md, .csv, .json)"}
    </div>
  );
}

// ─── Session History Panel ────────────────────────────────────────────────────

function SessionPanel({ sessions, activeId, onSelect, onNew }: {
  sessions: Session[]; activeId: string; onSelect: (id: string) => void; onNew: () => void;
}) {
  return (
    <div style={{
      width: 220, flexShrink: 0, background: "var(--color-bg-surface)",
      borderRight: "1px solid var(--color-border-subtle)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--color-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, fontFamily: "var(--font-display)", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>History</span>
        <button
          onClick={onNew}
          style={{ background: "rgba(61,255,160,0.1)", border: "1px solid rgba(61,255,160,0.25)", borderRadius: "var(--radius-sm)", padding: "0.2rem 0.5rem", color: "var(--color-brand)", fontFamily: "var(--font-display)", fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
        >
          <Plus size={11} /> New
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {sessions.length === 0 && (
          <p style={{ padding: "var(--space-4)", fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)" }}>No history yet</p>
        )}
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            style={{
              width: "100%", textAlign: "left", padding: "0.75rem var(--space-3)",
              background: s.id === activeId ? "rgba(61,255,160,0.06)" : "transparent",
              borderLeft: s.id === activeId ? "2px solid var(--color-brand)" : "2px solid transparent",
              border: "none", cursor: "pointer",
              borderBottom: "1px solid var(--color-border-subtle)",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.8125rem", fontFamily: "var(--font-display)", fontWeight: 500, color: s.id === activeId ? "var(--color-brand)" : "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</p>
            <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--color-text-tertiary)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.preview}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Gaia, the AI governance and agent-building copilot inside NexusOps.

Your job is to help any user, technical or non-technical, turn organisational pain points into governed AI workflows and agents.

You can: explain AI and automation concepts, analyse workflows and logs, suggest agents, draft workflows, recommend integrations, explain risks, create action plans, simplify technical setup, and guide users step by step.

Rules:
- Be clear, practical, and beginner-friendly. Use plain English, not jargon.
- Separate facts from assumptions.
- Always include governance considerations: traceability, logging, approvals, safe failure handling.
- Suggest the smallest useful first agent before recommending complex systems.
- When the user describes a business problem, respond with: (1) Understanding of the need, (2) Suggested approach, (3) Required integrations, (4) Governance requirements, (5) Next steps.
- Keep responses concise but complete. Use line breaks for readability.`;

export default function GaiaPage(): JSX.Element {
  const [, setLocation] = useLocation();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("default");
  const [sessionMessages, setSessionMessages] = useState<Record<string, Message[]>>({ default: [] });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages = sessionMessages[activeSessionId] ?? [];

  const chatMutation = trpc.gaia.chat.useMutation({
    onSuccess: (data) => {
      const reply: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.source === "error" ? "⚠️ GAIA is currently unavailable — the LLM service is not configured. Please contact your admin." : data.text,
        timestamp: new Date(),
      };
      setSessionMessages((prev) => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] ?? []), reply],
      }));
      setLoading(false);
    },
    onError: (e) => {
      toast.error(e.message);
      setLoading(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    const currentMessages = sessionMessages[activeSessionId] ?? [];
    const updated = [...currentMessages, userMsg];
    setSessionMessages((prev) => ({ ...prev, [activeSessionId]: updated }));

    if (activeSessionId === "default" && currentMessages.length === 0) {
      const title = trimmed.slice(0, 40) + (trimmed.length > 40 ? "…" : "");
      setSessions((prev) => [{ id: "default", title, preview: trimmed.slice(0, 60), timestamp: new Date() }, ...prev.filter(s => s.id !== "default")]);
    }

    setInput("");
    setLoading(true);

    chatMutation.mutate({
      messages: [
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...updated.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
    });
  }, [loading, sessionMessages, activeSessionId, chatMutation]);

  const newSession = useCallback(() => {
    const id = crypto.randomUUID();
    setSessions((prev) => [{ id, title: "New conversation", preview: "", timestamp: new Date() }, ...prev]);
    setSessionMessages((prev) => ({ ...prev, [id]: [] }));
    setActiveSessionId(id);
    setInput("");
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied"));
  }, []);

  const handleDocumentExtracted = useCallback((text: string, filename: string) => {
    const prompt = `I've uploaded a document called "${filename}". Please analyse it and provide:\n1. A summary of the business need or problem described\n2. A suggested NexusOps workflow plan to address it\n3. Required integrations and runtimes\n4. Governance and audit requirements\n5. Recommended next steps\n\nDocument content:\n\n${text}`;
    send(prompt);
  }, [send]);

  const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");
  const isEmpty = messages.length === 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar title="GAIA AI" />

        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* Session history */}
          <div className="hidden lg:flex">
            <SessionPanel
              sessions={sessions}
              activeId={activeSessionId}
              onSelect={setActiveSessionId}
              onNew={newSession}
            />
          </div>

          {/* Main chat area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
              <div style={{ maxWidth: 760, margin: "0 auto" }}>

                {/* Welcome state */}
                {isEmpty && (
                  <div style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "var(--radius-full)", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-4)" }}>
                      <Sparkles size={28} style={{ color: "#60a5fa" }} />
                    </div>
                    <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.375rem", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
                      Hello, I'm GAIA
                    </h2>
                    <p style={{ fontSize: "0.9375rem", color: "var(--color-text-secondary)", lineHeight: 1.6, maxWidth: 480, margin: "0 auto var(--space-6)" }}>
                      I help you turn business problems into governed AI workflows — no technical knowledge required. Describe what you need, upload a document, or choose a starting point below.
                    </p>

                    {/* Suggested prompts */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", textAlign: "left", marginBottom: "var(--space-6)" }}>
                      {SUGGESTED_PROMPTS.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => send(p.prompt)}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: "var(--space-3)",
                            padding: "var(--space-4)", borderRadius: "var(--radius-lg)",
                            background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)",
                            cursor: "pointer", textAlign: "left", transition: "border-color 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(61,255,160,0.3)")}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border-subtle)")}
                        >
                          <span style={{ color: "var(--color-brand)", marginTop: 2, flexShrink: 0 }}>{p.icon}</span>
                          <span style={{ fontSize: "0.8125rem", fontFamily: "var(--font-display)", color: "var(--color-text-primary)", fontWeight: 500, lineHeight: 1.4 }}>{p.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* FAQ shortcuts */}
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                      {FAQ_SHORTCUTS.map((q) => (
                        <button
                          key={q}
                          onClick={() => send(q)}
                          style={{
                            padding: "0.3rem 0.75rem", borderRadius: "var(--radius-full)",
                            background: "transparent", border: "1px solid var(--color-border-subtle)",
                            color: "var(--color-text-secondary)", fontFamily: "var(--font-display)",
                            fontSize: "0.75rem", cursor: "pointer", transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(61,255,160,0.3)"; e.currentTarget.style.color = "var(--color-brand)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-subtle)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversation */}
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} onCopy={copyToClipboard} />
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-4)", alignItems: "flex-start" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "var(--radius-full)", background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Sparkles size={14} style={{ color: "#60a5fa" }} />
                    </div>
                    <div style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: "0.875rem var(--space-4)", display: "flex", gap: 6, alignItems: "center" }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#60a5fa", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested actions after last assistant message */}
                {lastAssistantMsg && !loading && (
                  <SuggestedActions
                    lastResponse={lastAssistantMsg.content}
                    onNavigate={setLocation}
                  />
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input area */}
            <div style={{ borderTop: "1px solid var(--color-border-subtle)", padding: "var(--space-4) var(--space-6)", background: "var(--color-bg-surface)" }}>
              <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>

                {/* Document upload */}
                <DocumentUpload onExtracted={handleDocumentExtracted} />

                {/* Text input */}
                <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end" }}>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    placeholder="Describe your business problem, ask a question, or request a workflow plan… (Enter to send, Shift+Enter for new line)"
                    rows={3}
                    disabled={loading}
                    style={{
                      flex: 1, padding: "0.75rem var(--space-4)", resize: "none",
                      background: "var(--color-bg-base)", border: "1px solid var(--color-border-default)",
                      borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)",
                      fontFamily: "var(--font-body)", fontSize: "0.875rem", lineHeight: 1.5,
                      outline: "none", transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(61,255,160,0.4)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border-default)")}
                  />
                  <button
                    onClick={() => send(input)}
                    disabled={loading || !input.trim()}
                    style={{
                      width: 44, height: 44, borderRadius: "var(--radius-md)",
                      background: loading || !input.trim() ? "var(--color-bg-elevated)" : "var(--color-brand)",
                      border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: loading || !input.trim() ? "var(--color-text-tertiary)" : "var(--color-bg-base)",
                      flexShrink: 0, transition: "all 0.15s",
                    }}
                  >
                    {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={18} />}
                  </button>
                </div>

                <p style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", textAlign: "center", fontFamily: "var(--font-display)" }}>
                  GAIA may make mistakes. Always review AI-generated workflows before deploying to production.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
