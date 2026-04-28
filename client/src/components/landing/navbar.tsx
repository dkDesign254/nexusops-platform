/**
 * NexusOps — Landing NavBar
 *
 * Sticky navigation bar for the public landing page. Becomes
 * backdrop-blurred on scroll. Collapses to a hamburger menu on mobile.
 */
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Logo } from "@/components/ui/logo";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { LANGUAGES, REGIONS, useLocale, type LanguageCode, type RegionCode } from "@/contexts/LocaleContext";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Ecosystem", href: "#ecosystem" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#docs" },
];

export function NavBar(): JSX.Element {
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, region, setLanguage, setRegion } = useLocale();
  const [langOpen, setLangOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];
  const currentRegion = REGIONS.find((r) => r.code === region) ?? REGIONS[0];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) setRegionOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  function handleAnchor(href: string): void {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: scrolled ? "1px solid var(--color-border-subtle)" : "1px solid transparent",
        background: scrolled ? "rgba(7,8,11,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        transition: "background var(--transition-base), border-color var(--transition-base)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 var(--space-6)", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <Logo size="sm" />
        </button>

        <nav className="hidden md:flex" style={{ display: "flex", alignItems: "center", gap: "var(--space-6)" }}>
          {NAV_LINKS.map((link) => (
            <button key={link.label} onClick={() => handleAnchor(link.href)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", transition: "color var(--transition-fast)" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--color-text-primary)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--color-text-secondary)")}>
              {link.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          {/* Theme toggle */}
          <button onClick={toggleTheme}
            style={{ background: "none", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-sm)", padding: "0.4rem", color: "var(--color-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Language picker */}
          <div ref={langRef} style={{ position: "relative" }}>
            <button onClick={() => { setLangOpen(!langOpen); setRegionOpen(false); }}
              style={{ background: "none", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-sm)", padding: "0.3rem 0.6rem", display: "flex", alignItems: "center", gap: "0.3rem", cursor: "pointer", fontSize: "0.75rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)" }}>
              <span style={{ fontSize: "0.9rem" }}>{currentLang.flag}</span>
              <span>{currentLang.code.toUpperCase()}</span>
            </button>
            {langOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", minWidth: 140, zIndex: 60, overflow: "hidden" }}>
                {LANGUAGES.map((l) => (
                  <button key={l.code} onClick={() => { setLanguage(l.code as LanguageCode); setLangOpen(false); }}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", padding: "0.55rem 0.75rem", background: "none", border: "none", cursor: "pointer", color: l.code === language ? "var(--color-brand)" : "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: l.code === language ? 600 : 400, textAlign: "left" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
                    <span>{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Region picker */}
          <div ref={regionRef} style={{ position: "relative" }}>
            <button onClick={() => { setRegionOpen(!regionOpen); setLangOpen(false); }}
              style={{ background: "none", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-sm)", padding: "0.3rem 0.6rem", display: "flex", alignItems: "center", gap: "0.3rem", cursor: "pointer", fontSize: "0.75rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)" }}>
              <span style={{ fontSize: "0.9rem" }}>{currentRegion.flag}</span>
              <span>{currentRegion.code}</span>
            </button>
            {regionOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", minWidth: 180, maxHeight: 280, overflowY: "auto", zIndex: 60 }}>
                {REGIONS.map((r) => (
                  <button key={r.code} onClick={() => { setRegion(r.code as RegionCode); setRegionOpen(false); }}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", padding: "0.55rem 0.75rem", background: "none", border: "none", cursor: "pointer", color: r.code === region ? "var(--color-brand)" : "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: r.code === region ? 600 : 400, textAlign: "left" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
                    <span>{r.flag}</span> {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setLocation("/auth")}
            style={{ background: "none", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", padding: "0.5rem 1rem", fontSize: "0.875rem", color: "var(--color-text-primary)", cursor: "pointer", fontFamily: "var(--font-display)" }}>
            Sign in
          </button>
          <button onClick={() => setLocation("/auth?mode=signup")}
            style={{ background: "var(--color-brand)", border: "none", borderRadius: "var(--radius-md)", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-inverse)", cursor: "pointer", fontFamily: "var(--font-display)", boxShadow: "var(--shadow-brand)" }}>
            Start free
          </button>
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: "none", border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-sm)", padding: "0.4rem", color: "var(--color-text-primary)", cursor: "pointer" }}>
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen && (
        <div style={{ background: "var(--color-bg-surface)", borderTop: "1px solid var(--color-border-subtle)", padding: "var(--space-4) var(--space-6) var(--space-6)" }}>
          <nav style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {NAV_LINKS.map((link) => (
              <button key={link.label} onClick={() => handleAnchor(link.href)}
                style={{ background: "none", border: "none", textAlign: "left", padding: "0.5rem 0", fontSize: "0.9375rem", color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "var(--font-display)" }}>
                {link.label}
              </button>
            ))}
          </nav>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-5)" }}>
            <button onClick={() => { setMobileOpen(false); setLocation("/auth"); }}
              style={{ border: "1px solid var(--color-border-default)", borderRadius: "var(--radius-md)", padding: "0.65rem", fontSize: "0.9375rem", color: "var(--color-text-primary)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-display)" }}>
              Sign in
            </button>
            <button onClick={() => { setMobileOpen(false); setLocation("/auth?mode=signup"); }}
              style={{ background: "var(--color-brand)", border: "none", borderRadius: "var(--radius-md)", padding: "0.65rem", fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-inverse)", cursor: "pointer", fontFamily: "var(--font-display)" }}>
              Start free
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
