/**
 * NexusOps — HomePage (Workspace Hub)
 * Route: /home (protected — authenticated users)
 *
 * Acts as the central "command centre" landing page after login.
 * Sections:
 *   1. Greeting header — user's name + plan badge + quick actions
 *   2. Workspace cards — fetched from Airtable Workspaces table (own + member)
 *   3. Featured workflow templates — 4-column grid, "View all" → /templates
 *   4. Gaia quick-chat bar — opens the full Gaia panel
 *
 * All text is passed through useT() for static keys; dynamic CMS copy
 * can be added via useI18n("home") when Airtable translations exist.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Plus, ArrowRight, Workflow, Sparkles, Clock,
  Users, LayoutDashboard, Zap, ChevronRight, BookOpen,
} from "lucide-react";
import { Sidebar, MobileSidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { fetchWorkspaces, fetchWorkflowTemplates, type Workspace, type WorkflowTemplate } from "@/lib/airtable";
import { useT } from "@/contexts/LocaleContext";

// ─── Workspace card ────────────────────────────────────────────────────────────

function WorkspaceCard({ ws, onClick }: { ws: Workspace; onClick: () => void }): JSX.Element {
  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        transition: "all var(--transition-fast)",
        width: "100%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-brand)";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(14,164,114,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-subtle)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Icon + name row */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: "var(--radius-md)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.25rem",
            background: ws.colorAccent + "22",
            border: `1px solid ${ws.colorAccent}44`,
            flexShrink: 0,
          }}
        >
          {ws.iconEmoji || "⬡"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "0.9375rem", color: "var(--color-text-primary)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {ws.name}
          </p>
          <p style={{
            margin: "0.1rem 0 0", fontSize: "0.75rem", color: "var(--color-text-tertiary)",
            fontFamily: "var(--font-body)",
          }}>
            {ws.isPersonal ? "Personal workspace" : ws.description || "Team workspace"}
          </p>
        </div>
        <span style={{
          display: "inline-block", padding: "0.15rem 0.5rem", borderRadius: 99,
          fontSize: "0.6875rem", fontFamily: "var(--font-display)", fontWeight: 600,
          background: "rgba(14,164,114,0.1)", color: "var(--color-brand)",
          flexShrink: 0, textTransform: "capitalize",
        }}>
          {ws.plan}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <Workflow size={12} style={{ color: "var(--color-text-tertiary)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
            {ws.workflowCount} workflows
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <Users size={12} style={{ color: "var(--color-text-tertiary)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
            {ws.memberCount} members
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Template card ─────────────────────────────────────────────────────────────

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner:     "#4ade80",
  Intermediate: "#facc15",
  Advanced:     "#f87171",
};

function TemplateCard({ tpl, onDeploy }: { tpl: WorkflowTemplate; onDeploy: () => void }): JSX.Element {
  return (
    <div
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        height: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{
          display: "inline-block", padding: "0.2rem 0.5rem", borderRadius: 99,
          fontSize: "0.6875rem", fontFamily: "var(--font-display)", fontWeight: 600,
          background: "rgba(255,255,255,0.06)", color: "var(--color-text-secondary)",
        }}>
          {tpl.category}
        </span>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "0.25rem",
          fontSize: "0.6875rem", color: DIFFICULTY_COLOR[tpl.difficulty] ?? "var(--color-text-tertiary)",
          fontFamily: "var(--font-display)", fontWeight: 600,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: DIFFICULTY_COLOR[tpl.difficulty] ?? "currentColor" }} />
          {tpl.difficulty}
        </span>
      </div>

      <div style={{ flex: 1 }}>
        <p style={{
          margin: 0, fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: "0.9375rem", color: "var(--color-text-primary)",
        }}>
          {tpl.name}
        </p>
        <p style={{
          margin: "0.35rem 0 0", fontSize: "0.8125rem", color: "var(--color-text-secondary)",
          fontFamily: "var(--font-body)", lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
        }}>
          {tpl.description}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <Clock size={11} style={{ color: "var(--color-text-tertiary)" }} />
          <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
            ~{tpl.setupTimeMinutes}m setup
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.375rem" }}>
          {tpl.compatibleRuntimes.slice(0, 3).map((rt) => (
            <span key={rt} style={{
              fontSize: "0.625rem", padding: "0.1rem 0.4rem", borderRadius: 99,
              background: "var(--color-bg-elevated)", color: "var(--color-text-tertiary)",
              fontFamily: "var(--font-display)", border: "1px solid var(--color-border-subtle)",
            }}>
              {rt}
            </span>
          ))}
        </div>
        <button
          onClick={onDeploy}
          style={{
            display: "flex", alignItems: "center", gap: "0.25rem",
            padding: "0.3rem 0.65rem", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border-default)",
            background: "transparent", color: "var(--color-text-secondary)",
            fontFamily: "var(--font-display)", fontSize: "0.75rem", fontWeight: 500,
            cursor: "pointer", transition: "all var(--transition-fast)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-brand)";
            e.currentTarget.style.color = "var(--color-brand)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border-default)";
            e.currentTarget.style.color = "var(--color-text-secondary)";
          }}
        >
          <Zap size={11} /> Deploy
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton loaders ──────────────────────────────────────────────────────────

function WorkspaceSkeleton(): JSX.Element {
  return (
    <div style={{
      background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)",
      borderRadius: "var(--radius-lg)", padding: "var(--space-5)",
    }}>
      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 14, width: "60%", borderRadius: 6, marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 11, width: "40%", borderRadius: 6 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Quick-action button ───────────────────────────────────────────────────────

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }): JSX.Element {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        padding: "0.5rem var(--space-4)", borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border-default)",
        background: "transparent", color: "var(--color-text-secondary)",
        fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 500,
        cursor: "pointer", transition: "all var(--transition-fast)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-brand)";
        e.currentTarget.style.color = "var(--color-brand)";
        e.currentTarget.style.background = "rgba(14,164,114,0.04)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-default)";
        e.currentTarget.style.color = "var(--color-text-secondary)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage(): JSX.Element {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const T = useT();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [wsLoading, setWsLoading] = useState(true);
  const [tplLoading, setTplLoading] = useState(true);

  const [gaiaInput, setGaiaInput] = useState("");

  // Greeting
  const firstName = profile?.fullName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    setWsLoading(true);
    fetchWorkspaces(user?.id)
      .then(setWorkspaces)
      .catch(() => setWorkspaces([]))
      .finally(() => setWsLoading(false));
  }, [user?.id]);

  useEffect(() => {
    setTplLoading(true);
    fetchWorkflowTemplates(true)         // featured only
      .then((tpls) => setTemplates(tpls.slice(0, 4)))
      .catch(() => setTemplates([]))
      .finally(() => setTplLoading(false));
  }, []);

  const handleGaiaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gaiaInput.trim()) return;
    // Pass the query as a URL param and open Gaia page
    setLocation(`/gaia?q=${encodeURIComponent(gaiaInput.trim())}`);
    setGaiaInput("");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <MobileSidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar title="Home" onMobileMenuOpen={() => setMobileNavOpen(true)} />

        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-7)" }}>

            {/* ── Greeting ──────────────────────────────────────────────────── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-4)" }}>
              <div>
                <h1 style={{
                  margin: 0, fontFamily: "var(--font-display)", fontWeight: 800,
                  fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "var(--color-text-primary)",
                }}>
                  {greeting}, {firstName} 👋
                </h1>
                <p style={{
                  margin: "0.4rem 0 0", fontSize: "0.9375rem", color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-body)",
                }}>
                  Welcome back to NexusOps. Here's your workspace hub.
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <QuickAction icon={<Plus size={14} />} label="New Workflow" onClick={() => setLocation("/workflows")} />
                <QuickAction icon={<LayoutDashboard size={14} />} label="Dashboard" onClick={() => setLocation("/dashboard")} />
                <QuickAction icon={<BookOpen size={14} />} label="Templates" onClick={() => setLocation("/templates")} />
              </div>
            </div>

            {/* ── Gaia quick-chat bar ────────────────────────────────────────── */}
            <form
              onSubmit={handleGaiaSubmit}
              style={{
                display: "flex", gap: "0.75rem",
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: "var(--radius-xl)",
                padding: "var(--space-3) var(--space-4)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <Sparkles size={18} style={{ color: "var(--color-brand)", flexShrink: 0, marginTop: 2 }} />
              <input
                value={gaiaInput}
                onChange={(e) => setGaiaInput(e.target.value)}
                placeholder="Ask GAIA to build or explain a workflow, audit governance, or answer a question…"
                style={{
                  flex: 1, border: "none", outline: "none", background: "transparent",
                  fontFamily: "var(--font-body)", fontSize: "0.9375rem",
                  color: "var(--color-text-primary)",
                }}
              />
              <button
                type="submit"
                disabled={!gaiaInput.trim()}
                style={{
                  display: "flex", alignItems: "center", gap: "0.35rem",
                  padding: "0.4rem 0.875rem", borderRadius: "var(--radius-md)",
                  border: "none",
                  background: gaiaInput.trim() ? "var(--color-brand)" : "var(--color-border-subtle)",
                  color: gaiaInput.trim() ? "#000" : "var(--color-text-tertiary)",
                  fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 700,
                  cursor: gaiaInput.trim() ? "pointer" : "not-allowed",
                  transition: "all var(--transition-fast)",
                  flexShrink: 0,
                }}
              >
                Ask <ArrowRight size={13} />
              </button>
            </form>

            {/* ── Workspaces ─────────────────────────────────────────────────── */}
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
                <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.0625rem", color: "var(--color-text-primary)" }}>
                  Your Workspaces
                </h2>
                <button
                  onClick={() => setLocation("/settings")}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.25rem",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)",
                    fontSize: "0.8125rem", fontWeight: 500,
                    transition: "color var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-brand)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-tertiary)"; }}
                >
                  Manage <ChevronRight size={14} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
                {wsLoading ? (
                  [0, 1, 2].map((i) => <WorkspaceSkeleton key={i} />)
                ) : workspaces.length === 0 ? (
                  /* Empty state */
                  <div style={{
                    gridColumn: "1 / -1",
                    background: "var(--color-bg-surface)",
                    border: "1px dashed var(--color-border-default)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-8)",
                    textAlign: "center",
                  }}>
                    <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontWeight: 600 }}>
                      No workspaces yet
                    </p>
                    <p style={{ margin: "0.4rem 0 var(--space-4)", fontSize: "0.8125rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
                      Create your first workspace to organise your AI governance workflows.
                    </p>
                    <button
                      onClick={() => setLocation("/settings")}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "0.4rem",
                        padding: "0.5rem var(--space-4)", borderRadius: "var(--radius-md)",
                        border: "none", background: "var(--color-brand)", color: "#000",
                        fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={14} /> Create Workspace
                    </button>
                  </div>
                ) : (
                  workspaces.map((ws) => (
                    <WorkspaceCard
                      key={ws.recordId}
                      ws={ws}
                      onClick={() => setLocation(`/dashboard`)}
                    />
                  ))
                )}
              </div>
            </section>

            {/* ── Featured Templates ─────────────────────────────────────────── */}
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
                <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.0625rem", color: "var(--color-text-primary)" }}>
                  Featured Templates
                </h2>
                <button
                  onClick={() => setLocation("/templates")}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.25rem",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)",
                    fontSize: "0.8125rem", fontWeight: 500,
                    transition: "color var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-brand)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-tertiary)"; }}
                >
                  View all <ChevronRight size={14} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "var(--space-4)" }}>
                {tplLoading ? (
                  [0, 1, 2, 3].map((i) => (
                    <div key={i} style={{
                      background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)",
                      borderRadius: "var(--radius-lg)", padding: "var(--space-5)",
                    }}>
                      <div className="skeleton" style={{ height: 12, width: "40%", borderRadius: 6, marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 16, width: "70%", borderRadius: 6, marginBottom: 6 }} />
                      <div className="skeleton" style={{ height: 11, width: "90%", borderRadius: 6, marginBottom: 4 }} />
                      <div className="skeleton" style={{ height: 11, width: "80%", borderRadius: 6 }} />
                    </div>
                  ))
                ) : templates.length === 0 ? (
                  <div style={{
                    gridColumn: "1 / -1",
                    background: "var(--color-bg-surface)", border: "1px dashed var(--color-border-default)",
                    borderRadius: "var(--radius-lg)", padding: "var(--space-6)", textAlign: "center",
                  }}>
                    <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
                      Featured templates will appear here once published in Airtable.
                    </p>
                  </div>
                ) : (
                  templates.map((tpl) => (
                    <TemplateCard
                      key={tpl.recordId}
                      tpl={tpl}
                      onDeploy={() => setLocation("/templates")}
                    />
                  ))
                )}
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
