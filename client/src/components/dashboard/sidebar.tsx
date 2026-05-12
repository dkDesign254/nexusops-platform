/**
 * NexusOps — Sidebar
 *
 * Collapsible navigation sidebar for the authenticated dashboard.
 * Organised into sections: Monitor, Audit, Output, Governance, Account.
 * Active route highlighted with brand accent + left border.
 * Labels update when the user switches language via LocaleContext.
 *
 * Collapse state persists in localStorage ('nexusops_sidebar_collapsed').
 * Logo click always navigates to /home — never triggers logout.
 * Sign-out is only in the TopBar user avatar dropdown.
 */
import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { Logo } from "@/components/ui/logo";
import { LayoutDashboard, Workflow, ScrollText, Bot, FileText, BarChart3, Settings, ChevronLeft, ChevronRight, Sparkles, CreditCard, Link2, Shield, SlidersHorizontal, Wand2, ShieldCheck, HelpCircle, Home } from "lucide-react";
import { useState } from "react";
import { useT } from "@/contexts/LocaleContext";

const SIDEBAR_KEY = "nexusops_sidebar_collapsed";

function readSidebarCollapsed(): boolean {
  try { return localStorage.getItem(SIDEBAR_KEY) === "true"; } catch { return false; }
}
function saveSidebarCollapsed(v: boolean): void {
  try { localStorage.setItem(SIDEBAR_KEY, String(v)); } catch {}
}

export interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (v: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed, onCollapse, mobileOpen = false, onMobileClose }: SidebarProps): JSX.Element {
  const [location, setLocation] = useLocation();
  const [internalCollapsed, setInternalCollapsed] = useState(() =>
    collapsed !== undefined ? collapsed : readSidebarCollapsed()
  );
  const isCollapsed = onCollapse ? (collapsed ?? internalCollapsed) : internalCollapsed;

  const toggle = () => {
    const next = !isCollapsed;
    saveSidebarCollapsed(next);
    if (onCollapse) onCollapse(next);
    else setInternalCollapsed(next);
  };

  // Logo click → /home always (never logout)
  const goHome = () => setLocation("/home");

  const T = useT();

  const NAV = [
    {
      title: "",
      items: [
        { label: "Home", href: "/home", icon: <Home size={16} /> },
      ],
    },
    {
      title: T("nav.monitor"),
      items: [
        { label: T("nav.dashboard"), href: "/dashboard", icon: <LayoutDashboard size={16} /> },
        { label: T("nav.workflows"), href: "/workflows", icon: <Workflow size={16} /> },
        { label: "Agents", href: "/agents", icon: <SlidersHorizontal size={16} /> },
        { label: "Builder", href: "/builder", icon: <Wand2 size={16} /> },
      ],
    },
    {
      title: T("nav.audit"),
      items: [
        { label: T("nav.execLogs"), href: "/audit", icon: <ScrollText size={16} /> },
        { label: T("nav.aiInteractions"), href: "/ai-interactions", icon: <Bot size={16} /> },
      ],
    },
    {
      title: T("nav.output"),
      items: [
        { label: T("nav.finalReports"), href: "/reports", icon: <FileText size={16} /> },
        { label: T("nav.campaignData"), href: "/performance", icon: <BarChart3 size={16} /> },
      ],
    },
    {
      title: "Governance",
      items: [
        { label: "Governance", href: "/governance", icon: <ShieldCheck size={16} /> },
        { label: T("nav.integrations"), href: "/integrations", icon: <Link2 size={16} /> },
      ],
    },
    {
      title: T("nav.account"),
      items: [
        { label: T("nav.billing"), href: "/billing", icon: <CreditCard size={16} /> },
        { label: T("nav.settings"), href: "/settings", icon: <Settings size={16} /> },
        { label: "Admin", href: "/admin", icon: <Shield size={16} /> },
        { label: "Help & Docs", href: "/gaia", icon: <HelpCircle size={16} /> },
      ],
    },
  ];

  return (
    <aside
      style={{
        width: isCollapsed ? 60 : 220,
        minHeight: "100vh",
        background: "var(--color-bg-surface)",
        borderRight: "1px solid var(--color-border-subtle)",
        display: "flex",
        flexDirection: "column",
        transition: "width var(--transition-base)",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Logo area — clicking always goes to /home */}
      <div
        style={{
          padding: "var(--space-5) var(--space-4)",
          borderBottom: "1px solid var(--color-border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
        }}
      >
        {!isCollapsed && (
          <button onClick={goHome} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }} title="Home">
            <Logo size="sm" />
          </button>
        )}
        {isCollapsed && (
          <button onClick={goHome} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }} title="Home">
            <span style={{ color: "var(--color-brand)", fontSize: "1rem" }}>⬡</span>
          </button>
        )}
        <button
          onClick={toggle}
          style={{
            background: "none",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: "var(--radius-sm)",
            padding: "0.2rem",
            color: "var(--color-text-tertiary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav sections */}
      <nav style={{ flex: 1, padding: "var(--space-4) var(--space-3)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1 }}>
          {NAV.map((section) => (
            <div key={section.title} style={{ marginBottom: "var(--space-5)" }}>
              {!isCollapsed && (
                <p
                  style={{
                    fontSize: "0.625rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-text-tertiary)",
                    padding: "0 var(--space-2)",
                    marginBottom: "var(--space-2)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const isActive = location === item.href;
                return (
                  <button
                    key={item.label + item.href}
                    onClick={() => setLocation(item.href)}
                    title={isCollapsed ? item.label : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-3)",
                      width: "100%",
                      padding: isCollapsed ? "0.55rem" : "0.5rem var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      cursor: "pointer",
                      justifyContent: isCollapsed ? "center" : "flex-start",
                      background: isActive ? "rgba(14,164,114,0.1)" : "transparent",
                      borderLeft: isActive ? "2px solid var(--color-brand)" : "2px solid transparent",
                      color: isActive ? "var(--color-brand)" : "var(--color-text-secondary)",
                      fontFamily: "var(--font-display)",
                      fontSize: "0.875rem",
                      fontWeight: isActive ? 600 : 400,
                      transition: "all var(--transition-fast)",
                      marginBottom: 2,
                    }}
                  >
                    {item.icon}
                    {!isCollapsed && item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* GAIA AI footer button */}
        <div style={{ padding: "var(--space-3) 0", borderTop: "1px solid var(--color-border-subtle)" }}>
          {isCollapsed ? (
            <button
              onClick={() => setLocation("/gaia")}
              title={T("nav.gaiaAi")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", padding: "0.55rem", border: "none", borderRadius: "var(--radius-md)",
                cursor: "pointer",
                background: location === "/gaia" ? "rgba(14,164,114,0.1)" : "transparent",
                color: location === "/gaia" ? "var(--color-brand)" : "var(--color-text-secondary)",
                transition: "all var(--transition-fast)",
              }}>
              <Sparkles size={16} />
            </button>
          ) : (
            <button
              onClick={() => setLocation("/gaia")}
              style={{
                display: "flex", alignItems: "center", gap: "var(--space-3)",
                width: "100%", padding: "0.6rem var(--space-4)",
                borderRadius: "var(--radius-md)", border: "1px solid",
                borderColor: location === "/gaia" ? "rgba(14,164,114,0.3)" : "var(--color-border-subtle)",
                cursor: "pointer", textAlign: "left",
                background: location === "/gaia" ? "rgba(14,164,114,0.08)" : "transparent",
                color: location === "/gaia" ? "var(--color-brand)" : "var(--color-text-secondary)",
                fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 500,
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => { if (location !== "/gaia") { e.currentTarget.style.borderColor = "rgba(14,164,114,0.2)"; e.currentTarget.style.background = "rgba(14,164,114,0.04)"; } }}
              onMouseLeave={(e) => { if (location !== "/gaia") { e.currentTarget.style.borderColor = "var(--color-border-subtle)"; e.currentTarget.style.background = "transparent"; } }}
            >
              <Sparkles size={15} style={{ color: "var(--color-brand)", flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600 }}>{T("nav.gaiaAi")}</p>
                <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--color-text-tertiary)" }}>Ask GAIA · Get help</p>
              </div>
            </button>
          )}
        </div>
      </nav>
    </aside>
  );
}

/**
 * MobileSidebar — Full-height overlay sidebar for screens smaller than md.
 * Rendered as a portal-style fixed overlay with a backdrop.
 */
export function MobileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }): JSX.Element | null {
  if (!isOpen) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 199, background: "rgba(0,0,0,0.55)" }}
        aria-hidden="true"
      />
      {/* Slide-in panel */}
      <div style={{ position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 200 }}>
        <Sidebar mobileOpen={isOpen} onMobileClose={onClose} />
      </div>
    </>
  );
}
