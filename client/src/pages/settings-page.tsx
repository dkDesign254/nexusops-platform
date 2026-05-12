/**
 * NexusOps — SettingsPage
 * Route: /settings (protected)
 *
 * Three-tab layout: Profile · Notifications · API & Webhooks
 *
 * Profile tab:
 *   - Editable full_name, organisation — saved to Supabase profiles via useProfile.updateProfile()
 *   - Language selector — 7 supported languages, saved to profiles.language_code
 *   - Theme selector (light/dark) — saved to profiles.theme and applied via ThemeContext
 *   - Avatar URL display (upload support is a future extension)
 *
 * Notifications tab:
 *   - Workflow failures, report ready, anomalies — local state (extend with Supabase later)
 *
 * API tab:
 *   - Ingest webhook URL from profile.nexusopsWebhookUrl (falls back to /api/webhooks/ingest)
 *   - Show/copy/rotate API key (simple server-side token; extend with api_keys table)
 *   - Supported runtime badges
 */
import { useEffect, useState } from "react";
import {
  Copy, Check, Eye, EyeOff, RefreshCw,
  User, Bell, Key, Loader2,
} from "lucide-react";
import { MobileSidebar, Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useTheme } from "@/contexts/ThemeContext";
import { LANGUAGES, useLocale } from "@/contexts/LocaleContext";
import type { LanguageCode } from "@/contexts/LocaleContext";
import { toast } from "sonner";

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = "profile" | "notifications" | "api";

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "profile", label: "Profile", icon: <User size={14} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={14} /> },
  { id: "api", label: "API & Webhooks", icon: <Key size={14} /> },
];

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

// ─── Form input ───────────────────────────────────────────────────────────────

function FormInput({
  label, value, onChange, placeholder, readOnly = false,
}: {
  label: string; value: string;
  onChange?: (v: string) => void;
  placeholder?: string; readOnly?: boolean;
}): JSX.Element {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <label style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
        {label}
      </label>
      <input
        value={value}
        readOnly={readOnly}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        style={{
          padding: "0.55rem 0.75rem",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-md)",
          background: readOnly ? "var(--color-bg-elevated)" : "var(--color-bg-surface)",
          color: readOnly ? "var(--color-text-tertiary)" : "var(--color-text-primary)",
          fontFamily: readOnly ? "var(--font-mono)" : "var(--font-body)",
          fontSize: "0.875rem", outline: "none",
          cursor: readOnly ? "default" : "text",
        }}
        onFocus={readOnly ? undefined : (e) => { e.currentTarget.style.borderColor = "var(--color-brand)"; }}
        onBlur={readOnly ? undefined : (e) => { e.currentTarget.style.borderColor = "var(--color-border-default)"; }}
      />
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
      <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", margin: 0 }}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-sm)", padding: "0.5rem 0.75rem" }}>
        <code style={{ flex: 1, fontSize: "0.8125rem", color: "var(--color-text-primary)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayValue}
        </code>
        {sensitive && (
          <button onClick={() => setRevealed((r) => !r)} aria-label={revealed ? "Hide" : "Reveal"} style={{ background: "none", border: "none", padding: "0.125rem", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex" }}>
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        <button onClick={() => copy(value)} aria-label="Copy" style={{ background: "none", border: "none", padding: "0.125rem", cursor: "pointer", color: copied ? "var(--color-brand)" : "var(--color-text-tertiary)", display: "flex", flexShrink: 0 }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }): JSX.Element {
  return (
    <button
      role="switch" aria-checked={value} onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22, borderRadius: 99,
        background: value ? "var(--color-brand)" : "var(--color-border-default)",
        border: "none", cursor: "pointer", position: "relative", flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: value ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

// ─── Tab panels ───────────────────────────────────────────────────────────────

function ProfileTab(): JSX.Element {
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLocale();

  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [organisation, setOrganisation] = useState(profile?.organisation ?? "");
  const [saving, setSaving] = useState(false);

  // Sync form fields when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? "");
      setOrganisation(profile.organisation ?? "");
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ fullName: fullName.trim() || null, organisation: organisation.trim() || null });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = async (lang: LanguageCode) => {
    setLanguage(lang);
    try {
      await updateProfile({ languageCode: lang });
    } catch {
      // Non-fatal — locale is already updated in LocaleContext
    }
  };

  const handleThemeChange = async (t: "light" | "dark") => {
    setTheme(t);
    try {
      await updateProfile({ theme: t });
    } catch {}
  };

  const roleLabel =
    profile?.role === "admin" ? "Admin" :
    profile?.role === "viewer" ? "Viewer" : "Member";

  if (profileLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {[0,1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 54, borderRadius: "var(--radius-md)" }} />)}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {/* Editable fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
        <FormInput label="Full Name" value={fullName} onChange={setFullName} placeholder="Jane Smith" />
        <FormInput label="Organisation" value={organisation} onChange={setOrganisation} placeholder="Acme Corp" />
      </div>

      {/* Read-only fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
        <FormInput label="Email" value={user?.email ?? "—"} readOnly />
        <FormInput label="Role" value={roleLabel} readOnly />
      </div>
      <FormInput label="User ID" value={user?.id ?? "—"} readOnly />

      {/* Language */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <label style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
          Language
        </label>
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
          style={{
            padding: "0.55rem 0.75rem", border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-md)", background: "var(--color-bg-surface)",
            color: "var(--color-text-primary)", fontFamily: "var(--font-body)", fontSize: "0.875rem",
            outline: "none", cursor: "pointer",
          }}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
          ))}
        </select>
      </div>

      {/* Theme */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <label style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
          Appearance
        </label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleThemeChange(t)}
              style={{
                padding: "0.45rem 0.875rem", borderRadius: "var(--radius-md)",
                border: `1px solid ${theme === t ? "var(--color-brand)" : "var(--color-border-default)"}`,
                background: theme === t ? "rgba(14,164,114,0.1)" : "transparent",
                color: theme === t ? "var(--color-brand)" : "var(--color-text-secondary)",
                fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: theme === t ? 600 : 400,
                cursor: "pointer", textTransform: "capitalize",
                transition: "all var(--transition-fast)",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "var(--space-2)" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.55rem var(--space-5)", borderRadius: "var(--radius-md)",
            border: "none", background: "var(--color-brand)", color: "#000",
            fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
          }}
        >
          {saving && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function NotificationsTab(): JSX.Element {
  const [notifWorkflowFail, setNotifWorkflowFail] = useState(true);
  const [notifReportReady, setNotifReportReady] = useState(true);
  const [notifAnomalies, setNotifAnomalies] = useState(false);
  const [notifWeeklyDigest, setNotifWeeklyDigest] = useState(true);

  const items = [
    { label: "Workflow failures", desc: "Alert when any workflow enters Failed status", value: notifWorkflowFail, set: setNotifWorkflowFail },
    { label: "Reports ready for approval", desc: "Alert when a Final Report is generated and awaiting sign-off", value: notifReportReady, set: setNotifReportReady },
    { label: "Anomaly detections", desc: "Alert when stalled or ghost workflows are detected", value: notifAnomalies, set: setNotifAnomalies },
    { label: "Weekly digest", desc: "Weekly email summary of workflow volume and governance health", value: notifWeeklyDigest, set: setNotifWeeklyDigest },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", lineHeight: 1.6 }}>
        Notification preferences are saved locally. Email delivery requires a configured SMTP provider.
      </p>
      {items.map(({ label, desc, value, set }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border-subtle)" }}>
          <div>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>{label}</p>
            <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>{desc}</p>
          </div>
          <Toggle value={value} onChange={set} />
        </div>
      ))}
    </div>
  );
}

function ApiTab(): JSX.Element {
  const { user } = useAuth();
  const { profile } = useProfile();

  const webhookUrl = profile?.nexusopsWebhookUrl ??
    (typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/ingest` : "https://nexusops.onrender.com/api/webhooks/ingest");

  const apiKey = user?.id ? `nxo_${user.id.replace(/-/g, "").slice(0, 32)}` : "nxo_configure_server_side_token";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: "0 0 var(--space-4)", fontFamily: "var(--font-body)" }}>
          Point your automation runtimes (Make, n8n, LangChain, CrewAI) at the ingest URL below to log workflow executions.
          Include your API key in the{" "}
          <code style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.06)", padding: "0.1rem 0.3rem", borderRadius: 4 }}>x-api-key</code> header.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <CopyableRow label="Ingest Webhook URL" value={webhookUrl} />
          <CopyableRow label="API Key" value={apiKey} sensitive />
        </div>
      </div>

      <div style={{ background: "rgba(14,164,114,0.06)", border: "1px solid rgba(14,164,114,0.2)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem" }}>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--color-brand)" }}>Webhook payload format:</strong>{" "}
          POST JSON with fields:{" "}
          <code style={{ fontSize: "0.6875rem", background: "rgba(255,255,255,0.06)", padding: "0.1rem 0.3rem", borderRadius: 4 }}>workflow_name</code>,{" "}
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
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)", lineHeight: 1.5 }}>
          Set <code style={{ fontSize: "0.75rem" }}>MAKE_WEBHOOK_SECRET</code> or <code style={{ fontSize: "0.75rem" }}>N8N_WEBHOOK_SECRET</code> in your Render environment to enable HMAC signature verification on inbound webhooks.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
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
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage(): JSX.Element {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <MobileSidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="Settings" onMobileMenuOpen={() => setMobileNavOpen(true)} />

        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

            {/* Tab bar */}
            <div style={{
              display: "flex", gap: "0.25rem",
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "0.375rem",
            }}>
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.4rem",
                      padding: "0.5rem var(--space-4)", borderRadius: "var(--radius-md)",
                      border: "none", cursor: "pointer", flex: 1,
                      justifyContent: "center",
                      background: active ? "var(--color-bg-elevated)" : "transparent",
                      color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                      fontFamily: "var(--font-display)", fontSize: "0.8125rem",
                      fontWeight: active ? 600 : 400,
                      transition: "all var(--transition-fast)",
                      boxShadow: active ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-6)",
            }}>
              {activeTab === "profile" && <ProfileTab />}
              {activeTab === "notifications" && <NotificationsTab />}
              {activeTab === "api" && <ApiTab />}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
