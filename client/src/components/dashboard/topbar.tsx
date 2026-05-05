/**
 * NexusOps — TopBar
 *
 * Dashboard top navigation bar. Shows page title, notification bell,
 * theme toggle, language picker, region picker, and user avatar dropdown.
 */
import { Bell, ChevronDown, LogOut, Menu, Moon, Settings, Sun, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/contexts/ThemeContext";
import { LANGUAGES, REGIONS, useLocale, useT, type LanguageCode, type RegionCode } from "@/contexts/LocaleContext";
import { supabase } from "@/lib/supabase";

export interface TopBarProps {
  title?: string;
  failedCount?: number;
  onMobileMenuOpen?: () => void;
}

export function TopBar({ title = "Dashboard", failedCount = 0, onMobileMenuOpen }: TopBarProps): JSX.Element {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, region, setLanguage, setRegion } = useLocale();
  const T = useT();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [failedWorkflows, setFailedWorkflows] = useState<Array<{ id: string; workflow_name: string | null; workflow_id: string | null }>>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("nexusops-read-notif") ?? "[]")); } catch { return new Set(); }
  });
  const [, setLocation] = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // One-time fetch for notifications — no realtime channel to avoid collision
  // with the page-level useWorkflows subscription (same channel name would crash)
  useEffect(() => {
    supabase
      .from("workflows")
      .select("id, workflow_name, workflow_id, status")
      .ilike("status", "failed")
      .order("date_requested", { ascending: false })
      .limit(8)
      .then(({ data }) => setFailedWorkflows(data ?? []));
  }, []);

  const unread = failedWorkflows.filter((wf) => !readIds.has(wf.id));
  const notifCount = unread.length;

  function markAllRead() {
    const ids = new Set([...readIds, ...failedWorkflows.map((wf) => wf.id)]);
    setReadIds(ids);
    try { localStorage.setItem("nexusops-read-notif", JSON.stringify([...ids])); } catch {}
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) setRegionOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? "User";

  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];
  const currentRegion = REGIONS.find((r) => r.code === region) ?? REGIONS[0];

  async function handleSignOut(): Promise<void> {
    setDropdownOpen(false);
    await signOut();
    setLocation("/");
  }

  const isDark = theme === "dark";

  const dropdownPanelStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    background: "var(--color-bg-elevated)",
    border: "1px solid var(--color-border-default)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-lg)",
    minWidth: 160,
    zIndex: 50,
    overflow: "hidden",
  };

  const iconBtnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "1px solid var(--color-border-subtle)",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    color: "var(--color-text-secondary)",
    padding: "0.3rem 0.5rem",
    gap: "0.3rem",
    fontSize: "0.75rem",
    fontFamily: "var(--font-display)",
    whiteSpace: "nowrap",
    transition: "all var(--transition-fast)",
  };

  const dropdownItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.55rem var(--space-4)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--color-text-secondary)",
    fontFamily: "var(--font-display)",
    fontSize: "0.8125rem",
    textAlign: "left",
  };

  return (
    <header
      style={{
        height: 60,
        background: "var(--color-bg-surface)",
        borderBottom: "1px solid var(--color-border-subtle)",
        display: "flex",
        alignItems: "center",
        padding: "0 var(--space-6)",
        gap: "var(--space-3)",
        flexShrink: 0,
      }}
    >
      {/* Mobile hamburger — only visible on small screens */}
      {onMobileMenuOpen && (
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden"
          style={{ ...iconBtnStyle, marginRight: "var(--space-2)" }}
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>
      )}

      {/* Page title */}
      <p
        style={{
          flex: 1,
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: "1rem",
          color: "var(--color-text-primary)",
        }}
      >
        {title}
      </p>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        style={iconBtnStyle}
      >
        {isDark ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Language picker */}
      <div ref={langRef} style={{ position: "relative" }}>
        <button
          onClick={() => { setLangOpen(!langOpen); setRegionOpen(false); setDropdownOpen(false); }}
          style={iconBtnStyle}
          title="Language"
        >
          <span style={{ fontSize: "0.9rem" }}>{currentLang.flag}</span>
          <span>{currentLang.code.toUpperCase()}</span>
          <ChevronDown size={11} style={{ color: "var(--color-text-tertiary)" }} />
        </button>
        {langOpen && (
          <div style={dropdownPanelStyle}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLanguage(l.code as LanguageCode); setLangOpen(false); }}
                style={{
                  ...dropdownItemStyle,
                  fontWeight: l.code === language ? 600 : 400,
                  color: l.code === language ? "var(--color-brand)" : "var(--color-text-secondary)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <span>{l.flag}</span> {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Region picker */}
      <div ref={regionRef} style={{ position: "relative" }}>
        <button
          onClick={() => { setRegionOpen(!regionOpen); setLangOpen(false); setDropdownOpen(false); }}
          style={iconBtnStyle}
          title={T("region.label")}
        >
          <span style={{ fontSize: "0.9rem" }}>{currentRegion.flag}</span>
          <span>{currentRegion.code}</span>
          <ChevronDown size={11} style={{ color: "var(--color-text-tertiary)" }} />
        </button>
        {regionOpen && (
          <div style={{ ...dropdownPanelStyle, minWidth: 190, maxHeight: 280, overflowY: "auto" }}>
            {REGIONS.map((r) => (
              <button
                key={r.code}
                onClick={() => { setRegion(r.code as RegionCode); setRegionOpen(false); }}
                style={{
                  ...dropdownItemStyle,
                  fontWeight: r.code === region ? 600 : 400,
                  color: r.code === region ? "var(--color-brand)" : "var(--color-text-secondary)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <span style={{ fontSize: "0.9rem" }}>{r.flag}</span> {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notification bell */}
      <div ref={bellRef} style={{ position: "relative" }}>
        <button
          onClick={() => { setBellOpen(!bellOpen); setLangOpen(false); setRegionOpen(false); setDropdownOpen(false); }}
          style={{
            position: "relative",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: bellOpen ? "var(--color-brand)" : "var(--color-text-secondary)",
            padding: "0.3rem",
            borderRadius: "var(--radius-sm)",
            transition: "color var(--transition-fast)",
          }}
          title={T("notif.title")}
        >
          <Bell size={18} />
          {notifCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "var(--color-status-failed)",
                fontSize: "0.6rem",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}
            >
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </button>
        {bellOpen && (
          <div style={{ ...dropdownPanelStyle, minWidth: 300, maxHeight: 380, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem var(--space-4)", borderBottom: "1px solid var(--color-border-subtle)" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.8125rem", color: "var(--color-text-primary)" }}>{T("notif.title")}</span>
              {failedWorkflows.length > 0 && (
                <button onClick={markAllRead} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", color: "var(--color-brand)", fontFamily: "var(--font-display)" }}>{T("notif.markRead")}</button>
              )}
            </div>
            {failedWorkflows.length === 0 ? (
              <p style={{ padding: "var(--space-5) var(--space-4)", fontSize: "0.8125rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", textAlign: "center" }}>{T("notif.noNew")}</p>
            ) : (
              <>
                {failedWorkflows.map((wf) => (
                  <button
                    key={wf.id}
                    onClick={() => { setBellOpen(false); setLocation("/audit"); }}
                    style={{ ...dropdownItemStyle, flexDirection: "column", alignItems: "flex-start", gap: 2, padding: "0.6rem var(--space-4)", opacity: readIds.has(wf.id) ? 0.55 : 1 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: readIds.has(wf.id) ? "var(--color-text-tertiary)" : "var(--color-status-failed)", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.8125rem", color: "var(--color-text-primary)", fontWeight: readIds.has(wf.id) ? 400 : 500 }}>{wf.workflow_name ?? wf.workflow_id ?? wf.id}</span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-status-failed)", paddingLeft: 14 }}>{T("notif.failedWf")}</span>
                  </button>
                ))}
                <div style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                  <button
                    onClick={() => { setBellOpen(false); setLocation("/audit"); }}
                    style={{ ...dropdownItemStyle, color: "var(--color-brand)", fontWeight: 500, width: "100%" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    {T("notif.viewAll")}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* User dropdown */}
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <button
          onClick={() => { setDropdownOpen(!dropdownOpen); setLangOpen(false); setRegionOpen(false); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            background: "none",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "0.35rem 0.6rem 0.35rem 0.4rem",
            cursor: "pointer",
            color: "var(--color-text-primary)",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "rgba(14,164,114,0.15)",
              border: "1px solid rgba(14,164,114,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "var(--color-brand)",
              fontFamily: "var(--font-display)",
            }}
          >
            {initials}
          </div>
          <span
            style={{
              fontSize: "0.8125rem",
              fontFamily: "var(--font-display)",
              maxWidth: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayName}
          </span>
          <ChevronDown
            size={14}
            style={{
              color: "var(--color-text-tertiary)",
              transition: "transform var(--transition-fast)",
              transform: dropdownOpen ? "rotate(180deg)" : "none",
            }}
          />
        </button>

        {dropdownOpen && (
          <div style={dropdownPanelStyle}>
            {[
              { icon: <User size={14} />, label: T("topbar.profile"), action: () => setLocation("/settings") },
              { icon: <Settings size={14} />, label: T("topbar.settings"), action: () => setLocation("/settings") },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => { setDropdownOpen(false); item.action(); }}
                style={dropdownItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                {item.icon} {item.label}
              </button>
            ))}
            <div style={{ borderTop: "1px solid var(--color-border-subtle)" }} />
            <button
              onClick={handleSignOut}
              style={{ ...dropdownItemStyle, color: "var(--color-status-failed)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <LogOut size={14} /> {T("topbar.signOut")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
