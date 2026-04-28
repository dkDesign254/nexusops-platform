/**
 * NexusOps — TopBar
 *
 * Dashboard top navigation bar. Shows page title, notification bell,
 * theme toggle, language picker, region picker, and user avatar dropdown.
 */
import { Bell, ChevronDown, Globe, LogOut, Moon, Settings, Sun, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/contexts/ThemeContext";
import { LANGUAGES, REGIONS, useLocale, type LanguageCode, type RegionCode } from "@/contexts/LocaleContext";

export interface TopBarProps {
  title?: string;
  failedCount?: number;
}

export function TopBar({ title = "Dashboard", failedCount = 0 }: TopBarProps): JSX.Element {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, region, setLanguage, setRegion } = useLocale();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [, setLocation] = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) setRegionOpen(false);
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
          title="Region"
        >
          <Globe size={13} />
          <span>{currentRegion.code}</span>
          <ChevronDown size={11} style={{ color: "var(--color-text-tertiary)" }} />
        </button>
        {regionOpen && (
          <div style={{ ...dropdownPanelStyle, minWidth: 180, maxHeight: 280, overflowY: "auto" }}>
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
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notification bell */}
      <button
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--color-text-secondary)",
          padding: "0.3rem",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <Bell size={18} />
        {failedCount > 0 && (
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
            {failedCount > 9 ? "9+" : failedCount}
          </span>
        )}
      </button>

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
              { icon: <User size={14} />, label: "Profile", action: () => setLocation("/settings") },
              { icon: <Settings size={14} />, label: "Settings", action: () => setLocation("/settings") },
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
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
