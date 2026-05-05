/**
 * NexusOps — AIInteractionsPage
 * Routes: /ai-interactions and /ai-logs (protected)
 *
 * Phase 11: Enhanced with search, flag toggle, confidence indicator,
 * GAIA explain button, and CSV export.
 */
import { useState, useMemo, useCallback } from "react";
import { Search, Flag, Download, Sparkles, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { useAILogs } from "@/hooks/use-ai-logs";
import { useT } from "@/contexts/LocaleContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ConfidencePill({ value }: { value: number | null | undefined }) {
  if (value == null) return <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>n/a</span>;
  const pct = Math.round(value * 100);
  const color = pct >= 75 ? "#4ade80" : pct >= 50 ? "#facc15" : "#f87171";
  return (
    <span style={{ fontSize: "0.6875rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)", color, background: `${color}18`, fontFamily: "var(--font-body)", fontWeight: 600 }}>
      {pct}%
    </span>
  );
}

function exportCSV(logs: ReturnType<typeof useAILogs>["data"]): void {
  const headers = ["id", "timestamp", "workflow_id", "model_used", "tokens_used", "confidence", "flagged", "prompt_text", "response_text"];
  const rows = logs.map((l) => headers.map((h) => {
    const val = (l as Record<string, unknown>)[h];
    const s = val == null ? "" : String(val).replace(/\n/g, " ");
    return `"${s.replace(/"/g, '""')}"`;
  }).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nexusops-ai-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── GAIA Explain Panel ───────────────────────────────────────────────────────

function GaiaExplainPanel({ prompt, response, onClose }: { prompt: string; response: string; onClose: () => void }) {
  const gaiaMutation = trpc.gaia.chat.useMutation();
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const explain = useCallback(async () => {
    setLoading(true);
    try {
      const result = await gaiaMutation.mutateAsync({
        messages: [
          { role: "system" as const, content: "You are a governance analyst. Analyse AI interactions for compliance risks. Be concise and structured." },
          { role: "user" as const, content: `Analyse this AI interaction for governance concerns. Prompt: "${prompt.slice(0, 400)}" Response: "${response.slice(0, 400)}". Identify: 1) potential bias or errors, 2) compliance risks, 3) whether human review is recommended.` },
        ],
      });
      setExplanation(result.text || "Unable to generate explanation.");
    } catch {
      setExplanation("GAIA analysis unavailable. Check your LLM configuration.");
    } finally {
      setLoading(false);
    }
  }, [prompt, response, gaiaMutation]);

  // Auto-run on mount
  useState(() => { void explain(); });

  return (
    <div style={{ borderTop: "1px solid var(--color-border-subtle)", padding: "var(--space-4) var(--space-5)", background: "rgba(61,255,160,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "var(--space-3)" }}>
        <Sparkles size={14} style={{ color: "var(--color-brand)" }} />
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.8125rem", color: "var(--color-brand)" }}>GAIA Analysis</span>
        <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", fontSize: "0.75rem", fontFamily: "var(--font-display)" }}>✕ Close</button>
      </div>
      {loading ? (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <div className="skeleton" style={{ width: 16, height: 16, borderRadius: "50%" }} />
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>Analysing…</span>
        </div>
      ) : (
        <pre style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6 }}>
          {explanation}
        </pre>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AIInteractionsPage(): JSX.Element {
  const { data, loading, refetch } = useAILogs();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [gaiaOpen, setGaiaOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showFlagged, setShowFlagged] = useState(false);
  const [localFlags, setLocalFlags] = useState<Record<string, boolean>>({});
  const T = useT();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((log) => {
      const matchSearch = !q ||
        (log.prompt_text ?? "").toLowerCase().includes(q) ||
        (log.response_text ?? "").toLowerCase().includes(q) ||
        (log.model_used ?? "").toLowerCase().includes(q) ||
        (log.workflow_id ?? "").toLowerCase().includes(q);
      const isFlagged = localFlags[log.id] ?? !!log.flagged;
      const matchFlag = !showFlagged || isFlagged;
      return matchSearch && matchFlag;
    });
  }, [data, search, showFlagged, localFlags]);

  const flaggedCount = useMemo(() =>
    data.filter((l) => localFlags[l.id] ?? !!l.flagged).length,
    [data, localFlags]
  );

  async function toggleFlag(id: string, currentFlagged: boolean): Promise<void> {
    const newVal = !currentFlagged;
    setLocalFlags((prev) => ({ ...prev, [id]: newVal }));
    try {
      await supabase.from("ai_interaction_logs").update({ flagged: newVal }).eq("id", id);
      toast.success(newVal ? "Log flagged for review" : "Flag removed");
    } catch {
      setLocalFlags((prev) => ({ ...prev, [id]: currentFlagged }));
      toast.error("Failed to update flag");
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title={T("page.aiInteractions")} />
        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>

            {/* Toolbar */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "var(--space-2)" }}>
              {/* Search */}
              <div style={{ position: "relative", flex: "1 1 220px", minWidth: 0 }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)", pointerEvents: "none" }} />
                <input
                  type="search"
                  placeholder="Search prompt, response, model…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "100%", padding: "0.4rem 0.75rem 0.4rem 2rem", background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-md)", color: "var(--color-text-primary)", fontFamily: "var(--font-body)", fontSize: "0.8125rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Flagged filter */}
              <button
                onClick={() => setShowFlagged(!showFlagged)}
                style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.4rem 0.75rem", borderRadius: "var(--radius-sm)", border: `1px solid ${showFlagged ? "#f87171" : "var(--color-border-subtle)"}`, background: showFlagged ? "rgba(248,113,113,0.08)" : "transparent", color: showFlagged ? "#f87171" : "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
              >
                <Flag size={13} />
                Flagged only
                {flaggedCount > 0 && (
                  <span style={{ background: "#f87171", color: "#fff", borderRadius: "var(--radius-full)", fontSize: "0.625rem", padding: "0.1rem 0.4rem", fontWeight: 700 }}>{flaggedCount}</span>
                )}
              </button>

              {/* CSV export */}
              {!loading && filtered.length > 0 && (
                <button
                  onClick={() => exportCSV(filtered)}
                  style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.4rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-subtle)", background: "transparent", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
                >
                  <Download size={14} />
                  Export CSV
                </button>
              )}
            </div>

            {/* Count */}
            {!loading && (
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", margin: "0 0 var(--space-2)" }}>
                {filtered.length} of {data.length} AI interactions
                {flaggedCount > 0 && ` · ${flaggedCount} flagged`}
              </p>
            )}

            {loading
              ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: "var(--radius-lg)" }} />)
              : filtered.length === 0
              ? <div style={{ textAlign: "center", padding: "var(--space-16)", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)" }}>
                  {data.length === 0 ? T("page.noAiLogs") : "No interactions match the current filter."}
                </div>
              : filtered.map((log) => {
                  const isFlagged = localFlags[log.id] ?? !!log.flagged;
                  const isExpanded = expanded === log.id;
                  const showGaia = gaiaOpen === log.id;
                  return (
                    <div key={log.id} style={{ background: "var(--color-bg-surface)", border: `1px solid ${isFlagged ? "rgba(248,113,113,0.3)" : "var(--color-border-subtle)"}`, borderRadius: "var(--radius-lg)", overflow: "hidden", transition: "border-color 0.2s" }}>
                      {/* Header row */}
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-4) var(--space-5)" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: isFlagged ? "#f87171" : "var(--color-brand)", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", flexShrink: 0 }}>{log.log_display_id ?? "n/a"}</span>
                        <button
                          onClick={() => setExpanded(isExpanded ? null : log.id)}
                          style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", cursor: "pointer", textAlign: "left", minWidth: 0 }}
                        >
                          {isFlagged && <AlertTriangle size={13} style={{ color: "#f87171", flexShrink: 0 }} />}
                          <span style={{ fontSize: "0.875rem", color: "var(--color-text-primary)", fontFamily: "var(--font-display)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {log.prompt_text ? log.prompt_text.slice(0, 100) + (log.prompt_text.length > 100 ? "..." : "") : T("tbl.noPrompt")}
                          </span>
                        </button>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", flexShrink: 0 }}>{log.model_used ?? "n/a"}</span>
                        <ConfidencePill value={log.confidence} />
                        {log.tokens_used != null && (
                          <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", flexShrink: 0 }}>{log.tokens_used} tok</span>
                        )}
                        {/* Action buttons */}
                        <button
                          title={isFlagged ? "Remove flag" : "Flag for review"}
                          onClick={() => void toggleFlag(log.id, isFlagged)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: isFlagged ? "#f87171" : "var(--color-text-tertiary)", padding: "0.25rem", borderRadius: "var(--radius-sm)", flexShrink: 0 }}
                        >
                          <Flag size={14} />
                        </button>
                        <button
                          title="Ask GAIA to explain this interaction"
                          onClick={() => setGaiaOpen(showGaia ? null : log.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: showGaia ? "var(--color-brand)" : "var(--color-text-tertiary)", padding: "0.25rem", borderRadius: "var(--radius-sm)", flexShrink: 0 }}
                        >
                          <Sparkles size={14} />
                        </button>
                        <button
                          onClick={() => setExpanded(isExpanded ? null : log.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", padding: "0.25rem", flexShrink: 0 }}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div style={{ borderTop: "1px solid var(--color-border-subtle)", padding: "var(--space-5)", display: "grid", gap: "var(--space-4)", gridTemplateColumns: "1fr 1fr" }}>
                          <div>
                            <p style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-2)", fontFamily: "var(--font-body)" }}>{T("tbl.prompt")}</p>
                            <pre style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>{log.prompt_text ?? "n/a"}</pre>
                          </div>
                          <div>
                            <p style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-2)", fontFamily: "var(--font-body)" }}>{T("tbl.response")}</p>
                            <pre style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--color-brand-light)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>{log.response_text ?? "n/a"}</pre>
                          </div>
                          {log.timestamp && (
                            <p style={{ gridColumn: "1 / -1", fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", margin: 0 }}>
                              {new Date(log.timestamp).toLocaleString()} · {log.workflow_id ? `Workflow: ${log.workflow_id.slice(0, 12)}…` : "No workflow link"}
                            </p>
                          )}
                        </div>
                      )}

                      {/* GAIA explain */}
                      {showGaia && log.prompt_text && log.response_text && (
                        <GaiaExplainPanel
                          prompt={log.prompt_text}
                          response={log.response_text}
                          onClose={() => setGaiaOpen(null)}
                        />
                      )}
                    </div>
                  );
                })
            }
          </div>
        </main>
      </div>
    </div>
  );
}
