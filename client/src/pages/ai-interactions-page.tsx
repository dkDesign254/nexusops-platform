/**
 * NexusOps - AIInteractionsPage
 * Routes: /ai-interactions and /ai-logs (protected)
 */
import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { useAILogs } from "@/hooks/use-ai-logs";
import { useT } from "@/contexts/LocaleContext";

export default function AIInteractionsPage(): JSX.Element {
  const { data, loading } = useAILogs();
  const [expanded, setExpanded] = useState<string | null>(null);
  const T = useT();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title={T("page.aiInteractions")} />
        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: "var(--radius-lg)" }} />)
              : data.length === 0
              ? <div style={{ textAlign: "center", padding: "var(--space-16)", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)" }}>{T("page.noAiLogs")}</div>
              : data.map((log) => (
                <div key={log.id} style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                  <button onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "var(--space-4)", padding: "var(--space-4) var(--space-5)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-brand)", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", flexShrink: 0 }}>{log.log_display_id ?? "n/a"}</span>
                    <span style={{ fontSize: "0.875rem", color: "var(--color-text-primary)", fontFamily: "var(--font-display)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.prompt_text ? log.prompt_text.slice(0, 100) + (log.prompt_text.length > 100 ? "..." : "") : T("tbl.noPrompt")}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", flexShrink: 0 }}>{log.model_used ?? "n/a"}</span>
                    <span style={{ color: "var(--color-text-tertiary)", fontSize: "0.75rem" }}>{expanded === log.id ? "▲" : "▼"}</span>
                  </button>
                  {expanded === log.id && (
                    <div style={{ borderTop: "1px solid var(--color-border-subtle)", padding: "var(--space-5)", display: "grid", gap: "var(--space-4)", gridTemplateColumns: "1fr 1fr" }}>
                      <div>
                        <p style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-2)", fontFamily: "var(--font-body)" }}>{T("tbl.prompt")}</p>
                        <pre style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>{log.prompt_text ?? "n/a"}</pre>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-2)", fontFamily: "var(--font-body)" }}>{T("tbl.response")}</p>
                        <pre style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--color-brand-light)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>{log.response_text ?? "n/a"}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        </main>
      </div>
    </div>
  );
}
