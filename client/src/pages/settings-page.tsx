/**
 * NexusOps — SettingsPage
 * Route: /settings (protected)
 *
 * Sections: Profile, API & Webhooks, Team, Notifications, Danger Zone
 */
import { useState } from "react";
import { Copy, Check, Eye, EyeOff, RefreshCw } from "lucide-react";
import { MobileSidebar, Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { useAuth } from "@/hooks/use-auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskKey(key: string): string {
  if (key.length < 12) return "••••••••";
  return key.slice(0, 8) + "•".repeat(key.length - 12) + key.slice(-4);
}

function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  function copy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), timeout);
  }
  return { copied, copy };
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border-subtle)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-6)",
    }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 var(--space-5)" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Read-only field ──────────────────────────────────────────────────────────

function ReadOnlyField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", marginBottom: "var(--space-1)" }}>{label}</p>
      <p style={{ fontFamily: mono ? "var(--font-body)" : "var(--font-display)", fontSize: mono ? "0.8125rem" : "0.9375rem", color: "var(--color-text-primary)" }}>{value}</p>
    </div>
  );
}

// ─── Copyable row ─────────────────────────────────────────────────────────────

function CopyableRow({ label, value, sensitive = false }: { label: string; value: string; sensitive?: boolean }) {
  const { copied, copy } = useClipboard();
  const [revealed, setRevealed] = useState(false);

  const displayValue = sensitive && !revealed ? maskKey(value) : value;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", margin: 0 }}>{label}</p>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "var(--color-bg-base)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-sm)",
        padding: "0.5rem 0.75rem",
      }}>
        <code style={{ flex: 1, fontSize: "0.8125rem", color: "var(--color-text-primary)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayValue}
        </code>
        {sensitive && (
          <button
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? "Hide" : "Reveal"}
            title={revealed ? "Hide" : "Reveal"}
            style={{ background: "none", border: "none", padding: "0.125rem", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex", alignItems: "center" }}
          >
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        <button
          onClick={() => copy(value)}
          aria-label="Copy to clipboard"
          title="Copy"
          style={{ background: "none", border: "none", padding: "0.125rem", cursor: "pointer", color: copied ? "var(--color-brand)" : "var(--color-text-tertiary)", display: "flex", alignItems: "center", flexShrink: 0 }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage(): JSX.Element {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { user } = useAuth();

  // Derive webhook URL from current origin
  const webhookBase = typeof window !== "undefined" ? window.location.origin : "https://nexusops.onrender.com";
  const webhookUrl = `${webhookBase}/api/webhooks/ingest`;

  // Placeholder API key — in production, this would come from a server-generated token
  const apiKey = user?.id ? `nxo_${user.id.replace(/-/g, "").slice(0, 32)}` : "nxo_configure_server_side_token";

  // Notification preferences (local state only — extend with DB persistence later)
  const [notifWorkflowFail, setNotifWorkflowFail] = useState(true);
  const [notifReportReady, setNotifReportReady] = useState(true);
  const [notifAnomalies, setNotifAnomalies] = useState(false);

  // Team invite (UI only — extend with tRPC mutation later)
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"analyst" | "viewer">("viewer");
  const [inviteSent, setInviteSent] = useState(false);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    // TODO: call trpc.auth.inviteUser mutation
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 3000);
    setInviteEmail("");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <MobileSidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="Settings" onMobileMenuOpen={() => setMobileNavOpen(true)} />
        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

            {/* Profile */}
            <Section title="Profile">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <ReadOnlyField label="Name" value={user?.name ?? "—"} />
                <ReadOnlyField label="Email" value={user?.email ?? "—"} />
                <ReadOnlyField label="Role" value={user?.role ?? "—"} />
                <ReadOnlyField label="User ID" value={user?.id ?? "—"} mono />
              </div>
            </Section>

            {/* API & Webhooks */}
            <Section title="API & Webhooks">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                <div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: "0 0 var(--space-4)", fontFamily: "var(--font-display)" }}>
                    Point your automation runtimes (Make, n8n, LangChain, CrewAI) at the ingest URL below to log workflow executions.
                    Include your API key in the <code style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.06)", padding: "0.1rem 0.3rem", borderRadius: 4 }}>x-api-key</code> header.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    <CopyableRow label="Ingest Webhook URL" value={webhookUrl} />
                    <CopyableRow label="API Key" value={apiKey} sensitive />
                  </div>
                </div>

                <div style={{ background: "rgba(14,164,114,0.06)", border: "1px solid rgba(14,164,114,0.2)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem" }}>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", lineHeight: 1.6 }}>
                    <strong style={{ color: "var(--color-brand)" }}>Webhook payload format:</strong>{" "}
                    POST JSON with fields: <code style={{ fontSize: "0.6875rem", background: "rgba(255,255,255,0.06)", padding: "0.1rem 0.3rem", borderRadius: 4 }}>workflow_name</code>,{" "}
                    <code style={{ fontSize: "0.6875rem", background: "rgba(255,255,255,0.06)", padding: "0.1rem 0.3rem", borderRadius: 4 }}>status</code>,{" "}
                    <code style={{ fontSize: "0.6875rem", background: "rgba(255,255,255,0.06)", padding: "0.1rem 0.3rem", borderRadius: 4 }}>runtime</code>,{" "}
                    <code style={{ fontSize: "0.6875rem", background: "rgba(255,255,255,0.06)", padding: "0.1rem 0.3rem", borderRadius: 4 }}>steps</code> (array).
                    Optional: <code style={{ fontSize: "0.6875rem", background: "rgba(255,255,255,0.06)", padding: "0.1rem 0.3rem", borderRadius: 4 }}>ai_interactions</code> array.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  <p style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)" }}>
                    Supported runtime secrets
                  </p>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", lineHeight: 1.5 }}>
                    Set <code style={{ fontSize: "0.75rem" }}>MAKE_WEBHOOK_SECRET</code> or <code style={{ fontSize: "0.75rem" }}>N8N_WEBHOOK_SECRET</code> in your Render environment to enable HMAC signature verification on incoming webhooks.
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.6rem", borderRadius: 99, background: "rgba(14,164,114,0.12)", color: "var(--color-brand)", fontSize: "0.6875rem", fontFamily: "var(--font-display)", fontWeight: 600 }}>
                      <RefreshCw size={10} /> Make.com
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.6rem", borderRadius: 99, background: "rgba(236,72,153,0.12)", color: "#f472b6", fontSize: "0.6875rem", fontFamily: "var(--font-display)", fontWeight: 600 }}>
                      <RefreshCw size={10} /> n8n
                    </span>
                    <span style={{ padding: "0.2rem 0.6rem", borderRadius: 99, background: "rgba(255,255,255,0.06)", color: "var(--color-text-tertiary)", fontSize: "0.6875rem", fontFamily: "var(--font-display)" }}>
                      LangChain · CrewAI · Zapier (coming soon)
                    </span>
                  </div>
                </div>
              </div>
            </Section>

            {/* Team */}
            <Section title="Team">
              <p style={{ margin: "0 0 var(--space-4)", fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)" }}>
                Invite teammates to view or analyse governance data. Admin access is granted via the Users panel.
              </p>
              <form onSubmit={handleInvite} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    minWidth: 220,
                    background: "var(--color-bg-base)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.5rem 0.75rem",
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-display)",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-brand)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-default)"; }}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "analyst" | "viewer")}
                  style={{
                    background: "var(--color-bg-base)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.5rem 0.75rem",
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-display)",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="viewer">Viewer</option>
                  <option value="analyst">Analyst</option>
                </select>
                <button
                  type="submit"
                  style={{
                    background: inviteSent ? "rgba(14,164,114,0.2)" : "var(--color-brand)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.5rem 1rem",
                    color: inviteSent ? "var(--color-brand)" : "#000",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {inviteSent ? "✓ Sent!" : "Send invite"}
                </button>
              </form>
              <p style={{ margin: "var(--space-3) 0 0", fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
                Note: Email invites require a configured email provider. Role assignments take effect immediately.
              </p>
            </Section>

            {/* Notifications */}
            <Section title="Notifications">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {([
                  { label: "Workflow failures", desc: "Alert when any workflow enters Failed status", value: notifWorkflowFail, set: setNotifWorkflowFail },
                  { label: "Reports ready for approval", desc: "Alert when a Final Report is generated and awaiting sign-off", value: notifReportReady, set: setNotifReportReady },
                  { label: "Anomaly detections", desc: "Alert when stalled or ghost workflows are detected", value: notifAnomalies, set: setNotifAnomalies },
                ] as Array<{ label: string; desc: string; value: boolean; set: (v: boolean) => void }>).map(({ label, desc, value, set }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                    <div>
                      <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>{label}</p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)", marginTop: 2 }}>{desc}</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={value}
                      onClick={() => set(!value)}
                      style={{
                        width: 40,
                        height: 22,
                        borderRadius: 99,
                        background: value ? "var(--color-brand)" : "var(--color-border-default)",
                        border: "none",
                        cursor: "pointer",
                        position: "relative",
                        flexShrink: 0,
                        transition: "background 0.2s",
                      }}
                    >
                      <span style={{
                        position: "absolute",
                        top: 3,
                        left: value ? 21 : 3,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left 0.2s",
                      }} />
                    </button>
                  </div>
                ))}
              </div>
            </Section>

          </div>
        </main>
      </div>
    </div>
  );
}
