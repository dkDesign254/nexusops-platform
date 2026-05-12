/**
 * NexusOps — TemplatesPage
 * Route: /templates (protected — authenticated users)
 *
 * Gallery of workflow templates fetched from the Airtable WorkflowTemplates table.
 * Layout:
 *   Left  — filter sidebar: Category multi-select, Difficulty chips, Runtime chips
 *   Right — template card grid with deploy modal
 *
 * Deploy modal shows:
 *   - Template name, description, compatible runtimes
 *   - Make.com blueprint link (if available)
 *   - n8n import link (if available)
 *   - "Ask GAIA" button that opens /gaia with the Gaia prompt hint pre-filled
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Search, X, Clock, Zap, ChevronRight,
  ExternalLink, Sparkles, Filter,
} from "lucide-react";
import { Sidebar, MobileSidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { fetchWorkflowTemplates, type WorkflowTemplate, type TemplateDifficulty } from "@/lib/airtable";

// ─── Constants ─────────────────────────────────────────────────────────────────

const DIFFICULTY_OPTIONS: TemplateDifficulty[] = ["Beginner", "Intermediate", "Advanced"];

const DIFFICULTY_COLOR: Record<TemplateDifficulty, string> = {
  Beginner:     "#4ade80",
  Intermediate: "#facc15",
  Advanced:     "#f87171",
};

// ─── Deploy Modal ──────────────────────────────────────────────────────────────

function DeployModal({ tpl, onClose }: { tpl: WorkflowTemplate; onClose: () => void }): JSX.Element {
  const [, setLocation] = useLocation();

  const handleGaia = () => {
    const hint = tpl.gaiaPromptHint || `Help me set up the "${tpl.name}" workflow template.`;
    setLocation(`/gaia?q=${encodeURIComponent(hint)}`);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 998,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(2px)",
        }}
        aria-hidden="true"
      />
      {/* Panel */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", zIndex: 999,
        transform: "translate(-50%, -50%)",
        width: "min(560px, calc(100vw - 2rem))",
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
        padding: "var(--space-6)",
        display: "flex", flexDirection: "column", gap: "var(--space-5)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem", alignItems: "center" }}>
              <span style={{
                padding: "0.15rem 0.5rem", borderRadius: 99,
                fontSize: "0.6875rem", fontFamily: "var(--font-display)", fontWeight: 600,
                background: "rgba(255,255,255,0.06)", color: "var(--color-text-secondary)",
              }}>
                {tpl.category}
              </span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "0.25rem",
                fontSize: "0.6875rem", color: DIFFICULTY_COLOR[tpl.difficulty],
                fontFamily: "var(--font-display)", fontWeight: 600,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: DIFFICULTY_COLOR[tpl.difficulty] }} />
                {tpl.difficulty}
              </span>
            </div>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.125rem", color: "var(--color-text-primary)" }}>
              {tpl.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-sm)", padding: "0.35rem", cursor: "pointer",
              color: "var(--color-text-tertiary)", display: "flex",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Description */}
        <p style={{
          margin: 0, fontSize: "0.875rem", color: "var(--color-text-secondary)",
          fontFamily: "var(--font-body)", lineHeight: 1.65,
        }}>
          {tpl.description}
        </p>

        {/* Use case */}
        {tpl.useCase && (
          <div style={{
            background: "var(--color-bg-elevated)", borderRadius: "var(--radius-md)",
            padding: "var(--space-3) var(--space-4)",
            border: "1px solid var(--color-border-subtle)",
          }}>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>
              Use Case
            </p>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-primary)", fontFamily: "var(--font-body)" }}>
              {tpl.useCase}
            </p>
          </div>
        )}

        {/* Meta row */}
        <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Clock size={13} style={{ color: "var(--color-text-tertiary)" }} />
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>
              ~{tpl.setupTimeMinutes}m setup time
            </span>
          </div>
          {tpl.compatibleRuntimes.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)" }}>Runtimes:</span>
              {tpl.compatibleRuntimes.map((rt) => (
                <span key={rt} style={{
                  fontSize: "0.6875rem", padding: "0.15rem 0.45rem", borderRadius: 99,
                  background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-display)", border: "1px solid var(--color-border-subtle)",
                }}>
                  {rt}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingTop: "var(--space-2)", borderTop: "1px solid var(--color-border-subtle)" }}>
          {/* GAIA */}
          <button
            onClick={handleGaia}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.65rem var(--space-4)", borderRadius: "var(--radius-md)",
              border: "none", background: "var(--color-brand)", color: "#000",
              fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700,
              cursor: "pointer", width: "100%", justifyContent: "center",
              transition: "all var(--transition-fast)",
            }}
          >
            <Sparkles size={15} />
            Ask GAIA to set this up
          </button>

          {/* External deploy links */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {tpl.makeBlueprintUrl && (
              <a
                href={tpl.makeBlueprintUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "0.4rem", padding: "0.55rem var(--space-3)",
                  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)",
                  background: "transparent", color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 500,
                  textDecoration: "none", cursor: "pointer",
                }}
              >
                <ExternalLink size={12} /> Make.com blueprint
              </a>
            )}
            {tpl.n8nImportUrl && (
              <a
                href={tpl.n8nImportUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "0.4rem", padding: "0.55rem var(--space-3)",
                  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)",
                  background: "transparent", color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 500,
                  textDecoration: "none", cursor: "pointer",
                }}
              >
                <ExternalLink size={12} /> Import to n8n
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Filter sidebar ────────────────────────────────────────────────────────────

function FilterSidebar({
  categories,
  selectedCategories,
  onCategoryToggle,
  selectedDifficulties,
  onDifficultyToggle,
  selectedRuntimes,
  onRuntimeToggle,
  runtimes,
  onClear,
  hasFilters,
}: {
  categories: string[];
  selectedCategories: string[];
  onCategoryToggle: (c: string) => void;
  selectedDifficulties: TemplateDifficulty[];
  onDifficultyToggle: (d: TemplateDifficulty) => void;
  selectedRuntimes: string[];
  onRuntimeToggle: (r: string) => void;
  runtimes: string[];
  onClear: () => void;
  hasFilters: boolean;
}): JSX.Element {
  return (
    <aside style={{
      width: 220, flexShrink: 0,
      display: "flex", flexDirection: "column", gap: "var(--space-5)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Filter size={14} /> Filters
        </span>
        {hasFilters && (
          <button
            onClick={onClear}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "0.75rem", color: "var(--color-brand)", fontFamily: "var(--font-display)",
              fontWeight: 500, padding: 0,
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <div>
          <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.6875rem", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-tertiary)" }}>
            Category
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {categories.map((cat) => {
              const active = selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryToggle(cat)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.35rem var(--space-2)", borderRadius: "var(--radius-sm)",
                    border: "none", cursor: "pointer", textAlign: "left", width: "100%",
                    background: active ? "rgba(14,164,114,0.1)" : "transparent",
                    color: active ? "var(--color-brand)" : "var(--color-text-secondary)",
                    fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: active ? 600 : 400,
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <span style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                    border: active ? "none" : "1px solid var(--color-border-default)",
                    background: active ? "var(--color-brand)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {active && <span style={{ fontSize: "0.5rem", color: "#000", fontWeight: 900 }}>✓</span>}
                  </span>
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Difficulty */}
      <div>
        <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.6875rem", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-tertiary)" }}>
          Difficulty
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {DIFFICULTY_OPTIONS.map((d) => {
            const active = selectedDifficulties.includes(d);
            return (
              <button
                key={d}
                onClick={() => onDifficultyToggle(d)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.35rem var(--space-2)", borderRadius: "var(--radius-sm)",
                  border: "none", cursor: "pointer", textAlign: "left", width: "100%",
                  background: active ? `${DIFFICULTY_COLOR[d]}1a` : "transparent",
                  color: active ? DIFFICULTY_COLOR[d] : "var(--color-text-secondary)",
                  fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: active ? 600 : 400,
                  transition: "all var(--transition-fast)",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: DIFFICULTY_COLOR[d], flexShrink: 0 }} />
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Runtime */}
      {runtimes.length > 0 && (
        <div>
          <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.6875rem", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-tertiary)" }}>
            Runtime
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {runtimes.map((rt) => {
              const active = selectedRuntimes.includes(rt);
              return (
                <button
                  key={rt}
                  onClick={() => onRuntimeToggle(rt)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.35rem var(--space-2)", borderRadius: "var(--radius-sm)",
                    border: "none", cursor: "pointer", textAlign: "left", width: "100%",
                    background: active ? "rgba(14,164,114,0.1)" : "transparent",
                    color: active ? "var(--color-brand)" : "var(--color-text-secondary)",
                    fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: active ? 600 : 400,
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <span style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                    border: active ? "none" : "1px solid var(--color-border-default)",
                    background: active ? "var(--color-brand)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {active && <span style={{ fontSize: "0.5rem", color: "#000", fontWeight: 900 }}>✓</span>}
                  </span>
                  {rt}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── Template grid card ────────────────────────────────────────────────────────

function TemplateCard({
  tpl, onDeploy,
}: {
  tpl: WorkflowTemplate;
  onDeploy: (t: WorkflowTemplate) => void;
}): JSX.Element {
  return (
    <div style={{
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border-subtle)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-5)",
      display: "flex", flexDirection: "column", gap: "var(--space-3)",
      height: "100%",
      transition: "all var(--transition-fast)",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = "rgba(14,164,114,0.3)";
      e.currentTarget.style.boxShadow = "0 4px 16px rgba(14,164,114,0.06)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "var(--color-border-subtle)";
      e.currentTarget.style.boxShadow = "none";
    }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{
          padding: "0.2rem 0.5rem", borderRadius: 99,
          fontSize: "0.6875rem", fontFamily: "var(--font-display)", fontWeight: 600,
          background: "rgba(255,255,255,0.06)", color: "var(--color-text-secondary)",
        }}>
          {tpl.category}
        </span>
        {tpl.isFeatured && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "0.2rem",
            padding: "0.15rem 0.45rem", borderRadius: 99,
            fontSize: "0.6125rem", fontFamily: "var(--font-display)", fontWeight: 700,
            background: "rgba(14,164,114,0.12)", color: "var(--color-brand)",
          }}>
            ★ Featured
          </span>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <p style={{
          margin: 0, fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: "0.9375rem", color: "var(--color-text-primary)",
        }}>
          {tpl.name}
        </p>
        <p style={{
          margin: "0.4rem 0 0", fontSize: "0.8125rem", color: "var(--color-text-secondary)",
          fontFamily: "var(--font-body)", lineHeight: 1.55,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
        }}>
          {tpl.description}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "0.25rem",
            fontSize: "0.6875rem", color: DIFFICULTY_COLOR[tpl.difficulty],
            fontFamily: "var(--font-display)", fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: DIFFICULTY_COLOR[tpl.difficulty] }} />
            {tpl.difficulty}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
            <Clock size={11} /> ~{tpl.setupTimeMinutes}m
          </span>
        </div>
        <button
          onClick={() => onDeploy(tpl)}
          style={{
            display: "flex", alignItems: "center", gap: "0.3rem",
            padding: "0.35rem 0.7rem", borderRadius: "var(--radius-sm)",
            border: "none", background: "var(--color-brand)", color: "#000",
            fontFamily: "var(--font-display)", fontSize: "0.75rem", fontWeight: 700,
            cursor: "pointer", transition: "all var(--transition-fast)",
            flexShrink: 0,
          }}
        >
          <Zap size={11} /> Deploy
        </button>
      </div>

      {tpl.compatibleRuntimes.length > 0 && (
        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
          {tpl.compatibleRuntimes.slice(0, 4).map((rt) => (
            <span key={rt} style={{
              fontSize: "0.625rem", padding: "0.1rem 0.4rem", borderRadius: 99,
              background: "var(--color-bg-elevated)", color: "var(--color-text-tertiary)",
              fontFamily: "var(--font-display)", border: "1px solid var(--color-border-subtle)",
            }}>
              {rt}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TemplatesPage(): JSX.Element {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<TemplateDifficulty[]>([]);
  const [selectedRuntimes, setSelectedRuntimes] = useState<string[]>([]);
  const [deployTarget, setDeployTarget] = useState<WorkflowTemplate | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchWorkflowTemplates(false)
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  // Derived filter options
  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category));
    return Array.from(cats).sort();
  }, [templates]);

  const runtimes = useMemo(() => {
    const rts = new Set(templates.flatMap((t) => t.compatibleRuntimes));
    return Array.from(rts).sort();
  }, [templates]);

  const hasFilters = selectedCategories.length > 0 || selectedDifficulties.length > 0 || selectedRuntimes.length > 0;

  // Filtered templates
  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategories.length === 0 || selectedCategories.includes(t.category);
      const matchDiff = selectedDifficulties.length === 0 || selectedDifficulties.includes(t.difficulty);
      const matchRt = selectedRuntimes.length === 0 || t.compatibleRuntimes.some((r) => selectedRuntimes.includes(r));
      return matchSearch && matchCat && matchDiff && matchRt;
    });
  }, [templates, search, selectedCategories, selectedDifficulties, selectedRuntimes]);

  const toggleCategory = (c: string) =>
    setSelectedCategories((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const toggleDifficulty = (d: TemplateDifficulty) =>
    setSelectedDifficulties((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const toggleRuntime = (r: string) =>
    setSelectedRuntimes((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedDifficulties([]);
    setSelectedRuntimes([]);
    setSearch("");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <MobileSidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar title="Templates" onMobileMenuOpen={() => setMobileNavOpen(true)} />

        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>

            {/* Page header */}
            <div style={{ marginBottom: "var(--space-6)" }}>
              <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.5rem", color: "var(--color-text-primary)" }}>
                Workflow Templates
              </h1>
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.9375rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}>
                Deploy pre-built AI governance workflows in minutes — or ask GAIA to customise one.
              </p>
            </div>

            {/* Search + mobile filter toggle */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "var(--space-5)", alignItems: "center" }}>
              <div style={{ flex: 1, position: "relative", maxWidth: 420 }}>
                <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)", pointerEvents: "none" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates…"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "0.55rem 0.75rem 0.55rem 2.25rem",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-bg-surface)",
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-body)", fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
                {search && (
                  <button onClick={() => setSearch("")} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex" }}>
                    <X size={13} />
                  </button>
                )}
              </div>
              {/* Mobile filter button */}
              <button
                onClick={() => setMobileFilterOpen((o) => !o)}
                className="md:hidden"
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.55rem var(--space-3)", borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border-default)",
                  background: hasFilters ? "rgba(14,164,114,0.1)" : "transparent",
                  color: hasFilters ? "var(--color-brand)" : "var(--color-text-secondary)",
                  fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <Filter size={13} /> Filters {hasFilters && `(${selectedCategories.length + selectedDifficulties.length + selectedRuntimes.length})`}
              </button>

              {/* Result count */}
              <span style={{ fontSize: "0.8125rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", marginLeft: "auto" }}>
                {loading ? "Loading…" : `${filtered.length} template${filtered.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            {/* Body: sidebar + grid */}
            <div style={{ display: "flex", gap: "var(--space-6)", alignItems: "flex-start" }}>

              {/* Filter sidebar — hidden on mobile unless toggled */}
              <div className={mobileFilterOpen ? undefined : "hidden md:block"}>
                <FilterSidebar
                  categories={categories}
                  selectedCategories={selectedCategories}
                  onCategoryToggle={toggleCategory}
                  selectedDifficulties={selectedDifficulties}
                  onDifficultyToggle={toggleDifficulty}
                  selectedRuntimes={selectedRuntimes}
                  onRuntimeToggle={toggleRuntime}
                  runtimes={runtimes}
                  onClear={clearFilters}
                  hasFilters={hasFilters}
                />
              </div>

              {/* Template grid */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {loading ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "var(--space-4)" }}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div key={i} style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: "var(--space-5)" }}>
                        <div className="skeleton" style={{ height: 12, width: "40%", borderRadius: 6, marginBottom: 8 }} />
                        <div className="skeleton" style={{ height: 16, width: "70%", borderRadius: 6, marginBottom: 8 }} />
                        <div className="skeleton" style={{ height: 11, width: "90%", borderRadius: 6, marginBottom: 4 }} />
                        <div className="skeleton" style={{ height: 11, width: "75%", borderRadius: 6 }} />
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{
                    background: "var(--color-bg-surface)", border: "1px dashed var(--color-border-default)",
                    borderRadius: "var(--radius-lg)", padding: "var(--space-8)", textAlign: "center",
                  }}>
                    <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontWeight: 600 }}>
                      No templates match
                    </p>
                    <p style={{ margin: "0.4rem 0 var(--space-4)", fontSize: "0.8125rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
                      Try adjusting your filters or search term.
                    </p>
                    <button
                      onClick={clearFilters}
                      style={{
                        padding: "0.45rem var(--space-4)", borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border-default)", background: "transparent",
                        color: "var(--color-text-secondary)", fontFamily: "var(--font-display)",
                        fontSize: "0.8125rem", cursor: "pointer",
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "var(--space-4)" }}>
                    {filtered.map((tpl) => (
                      <TemplateCard key={tpl.recordId} tpl={tpl} onDeploy={setDeployTarget} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Deploy modal */}
      {deployTarget && <DeployModal tpl={deployTarget} onClose={() => setDeployTarget(null)} />}
    </div>
  );
}
