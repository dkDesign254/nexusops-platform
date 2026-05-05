/**
 * NexusOps — Integration Hub
 * Route: /integrations (protected)
 *
 * Phase 6: Beginner-friendly connect buttons for each integration.
 * Shows status, guidance, test connection, and disconnect.
 * All credentials are stored server-side only.
 */
import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  ExternalLink, Loader2, RefreshCw, Settings, XCircle, Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "connected" | "unconfigured" | "degraded" | "checking";

interface Integration {
  id: string;
  name: string;
  tagline: string;
  description: string;
  setupSteps: string[];
  docsUrl: string;
  category: string;
  required: boolean;
  envKey?: string;
}

// ─── Integration Definitions ──────────────────────────────────────────────────

const INTEGRATIONS: Integration[] = [
  {
    id: "supabase",
    name: "Supabase",
    tagline: "Primary database and user auth",
    description: "NexusOps stores all workflows, execution logs, AI logs, reports, and users in Supabase. This is the core database — the platform cannot function without it.",
    setupSteps: [
      "Create a project at supabase.com",
      "Copy your Project URL and Service Role Key from Settings → API",
      "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your Render environment",
      "Run the SQL migrations in supabase/migrations/ via the Supabase SQL editor",
    ],
    docsUrl: "https://supabase.com/docs",
    category: "Core",
    required: true,
    envKey: "supabase",
  },
  {
    id: "airtable",
    name: "Airtable",
    tagline: "External governance audit source",
    description: "Airtable acts as a runtime-independent audit layer. Workflow records, logs, and reports can be synced to Airtable so governance data exists outside NexusOps itself — proving auditability.",
    setupSteps: [
      "Log in to airtable.com and open your base",
      "Create tables: Workflows, Execution Logs, AI Interaction Logs, Final Reports, Performance Data",
      "Generate a Personal Access Token at airtable.com/create/tokens",
      "Set AIRTABLE_TOKEN and AIRTABLE_BASE_ID in your environment",
      "Click Sync Now in the Admin page to pull data into Supabase",
    ],
    docsUrl: "https://airtable.com/developers/web/api",
    category: "Governance",
    required: false,
    envKey: "airtable",
  },
  {
    id: "make",
    name: "Make",
    tagline: "No-code workflow automation runtime",
    description: "Make (formerly Integromat) runs your automation scenarios in the cloud. NexusOps dispatches workflow triggers to Make via webhook. You do not need to understand Make's module wiring — NexusOps generates the payload for you.",
    setupSteps: [
      "Create an account at make.com",
      "Create a new scenario with a Webhook trigger module",
      "Copy the webhook URL from Make and paste it in the Trigger Run dialog",
      "Optionally set your Make API key as MAKE_API_KEY in your environment",
      "Set MAKE_WEBHOOK_SECRET to validate inbound webhooks",
    ],
    docsUrl: "https://www.make.com/en/help/tools/webhooks",
    category: "Runtime",
    required: false,
    envKey: "make",
  },
  {
    id: "n8n",
    name: "n8n",
    tagline: "Open-source workflow automation runtime",
    description: "n8n is a self-hostable workflow automation tool. NexusOps sends workflow triggers to n8n via webhook. Great for teams that want full control over their automation infrastructure.",
    setupSteps: [
      "Set up n8n at n8n.io (cloud or self-hosted)",
      "Create a workflow with a Webhook trigger node",
      "Copy the webhook URL from n8n and use it in the Trigger Run dialog",
      "Set N8N_WEBHOOK_SECRET for secure webhook validation",
    ],
    docsUrl: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/",
    category: "Runtime",
    required: false,
    envKey: "n8n",
  },
  {
    id: "openai",
    name: "OpenAI / LLM",
    tagline: "AI intelligence layer for GAIA and reports",
    description: "NexusOps uses an LLM to generate marketing performance reports, power GAIA chat, and analyse workflows. Supports OpenAI GPT-4o-mini and Claude (Anthropic).",
    setupSteps: [
      "Get an API key from platform.openai.com or console.anthropic.com",
      "Set ANTHROPIC_API_KEY in your environment",
      "NexusOps will use the LLM automatically when a workflow triggers AI report generation",
    ],
    docsUrl: "https://platform.openai.com/docs",
    category: "AI",
    required: false,
    envKey: "llm",
  },
  {
    id: "stripe",
    name: "Stripe",
    tagline: "Payments and subscription billing",
    description: "Stripe handles NexusOps subscription payments. Required only if you enable paid plans. In demo or academic mode, billing can remain unconfigured — all features are accessible regardless.",
    setupSteps: [
      "Create an account at stripe.com",
      "Copy your Secret Key from the Stripe dashboard",
      "Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in your environment",
      "Set up a webhook in Stripe pointing to your-app-url/api/webhooks/stripe",
    ],
    docsUrl: "https://stripe.com/docs",
    category: "Billing",
    required: false,
    envKey: "stripe",
  },
  {
    id: "gmail",
    name: "Gmail",
    tagline: "Email delivery for reports and alerts",
    description: "Send weekly reports and governance alerts directly to your inbox. In the meantime, use Make or n8n to send emails as part of a workflow.",
    setupSteps: [
      "Coming soon — not yet implemented",
      "In the meantime, use Make or n8n to send emails as part of a workflow",
    ],
    docsUrl: "https://developers.google.com/gmail/api",
    category: "Output",
    required: false,
  },
  {
    id: "slack",
    name: "Slack",
    tagline: "Post alerts and report summaries to Slack",
    description: "Receive workflow completion notifications, anomaly alerts, and governance score updates directly in your Slack workspace.",
    setupSteps: [
      "Coming soon — not yet implemented",
      "In the meantime, use Make or n8n to post Slack messages as part of a workflow",
    ],
    docsUrl: "https://api.slack.com/messaging/webhooks",
    category: "Output",
    required: false,
  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusColor(s: Status) {
  return s === "connected" ? "#3dffa0" : s === "degraded" ? "#facc15" : s === "checking" ? "#60a5fa" : "var(--color-text-tertiary)";
}

function StatusBadge({ status }: { status: Status }) {
  const Icon = status === "connected" ? CheckCircle2 : status === "degraded" ? AlertTriangle : status === "checking" ? Loader2 : XCircle;
  const label = status === "checking" ? "Checking…" : status;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.6875rem", fontWeight: 600, fontFamily: "var(--font-display)", textTransform: "capitalize", color: statusColor(status), background: `${statusColor(status)}18`, padding: "0.2rem 0.6rem", borderRadius: "var(--radius-full)" }}>
      <Icon size={11} style={status === "checking" ? { animation: "spin 1s linear infinite" } : undefined} />
      {label}
    </span>
  );
}

// ─── Integration Card ─────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  status,
  onTest,
}: {
  integration: Integration;
  status: Status;
  onTest: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const categoryColor: Record<string, string> = {
    Core: "#3dffa0", Governance: "#c084fc", Runtime: "#60a5fa",
    AI: "#facc15", Billing: "#fb923c", Output: "#34d399",
  };
  const catColor = categoryColor[integration.category] ?? "var(--color-text-tertiary)";

  return (
    <div style={{
      background: "var(--color-bg-surface)",
      border: `1px solid ${status === "connected" ? "rgba(61,255,160,0.2)" : "var(--color-border-subtle)"}`,
      borderRadius: "var(--radius-xl)",
      overflow: "hidden",
      transition: "border-color 0.15s",
    }}>
      <div style={{ padding: "var(--space-5)", display: "flex", alignItems: "flex-start", gap: "var(--space-4)" }}>
        <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", flexShrink: 0, background: `${catColor}12`, border: `1px solid ${catColor}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={20} style={{ color: catColor }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "0.25rem" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)", margin: 0 }}>{integration.name}</p>
            <span style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: catColor, background: `${catColor}15`, padding: "0.15rem 0.5rem", borderRadius: "var(--radius-full)" }}>{integration.category}</span>
            {integration.required && <span style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", color: "#f87171", background: "rgba(248,113,113,0.1)", padding: "0.15rem 0.5rem", borderRadius: "var(--radius-full)" }}>Required</span>}
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0 }}>{integration.tagline}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div style={{ padding: "0 var(--space-5) var(--space-4)" }}>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>{integration.description}</p>
      </div>

      <div style={{ padding: "0 var(--space-5) var(--space-4)", display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
        {integration.envKey && (
          <button
            onClick={() => onTest(integration.id)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "0.4rem 0.875rem", background: "rgba(61,255,160,0.08)", border: "1px solid rgba(61,255,160,0.25)", borderRadius: "var(--radius-md)", color: "var(--color-brand)", fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
          >
            <RefreshCw size={12} /> Test connection
          </button>
        )}
        <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, padding: "0.4rem 0.875rem", background: "transparent", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
          <ExternalLink size={12} /> Docs
        </a>
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "0.4rem 0.875rem", background: "transparent", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
        >
          <Settings size={12} /> Setup guide {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {expanded && (
        <div style={{ margin: "0 var(--space-5) var(--space-5)", padding: "var(--space-4)", background: "var(--color-bg-base)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-subtle)" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, fontFamily: "var(--font-display)", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-3)" }}>Setup steps</p>
          <ol style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {integration.setupSteps.map((step, i) => (
              <li key={i} style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage(): JSX.Element {
  const [localStatuses, setLocalStatuses] = useState<Record<string, Status>>({});
  const [activeCategory, setActiveCategory] = useState("All");

  const healthQuery = trpc.system.serviceStatus.useQuery(undefined, { refetchInterval: 30_000 });
  const healthSvcs = healthQuery.data?.services as Record<string, string> | undefined;

  const mergedStatuses: Record<string, Status> = {
    supabase: (healthSvcs?.supabase === "ok" ? "connected" : healthSvcs?.supabase === "degraded" ? "degraded" : "unconfigured") as Status,
    airtable: (healthSvcs?.airtable === "ok" ? "connected" : "unconfigured") as Status,
    make: (healthSvcs?.make === "ok" ? "connected" : "unconfigured") as Status,
    n8n: (healthSvcs?.n8n === "ok" ? "connected" : "unconfigured") as Status,
    openai: (healthSvcs?.llm === "ok" ? "connected" : "unconfigured") as Status,
    stripe: (healthSvcs?.stripe === "ok" ? "connected" : "unconfigured") as Status,
    ...localStatuses,
  };

  const testConnection = async (id: string) => {
    setLocalStatuses((s) => ({ ...s, [id]: "checking" }));
    await healthQuery.refetch();
    const fresh = healthQuery.data?.services as Record<string, string> | undefined;
    const envMap: Record<string, string> = { supabase: "supabase", airtable: "airtable", make: "make", n8n: "n8n", openai: "llm", stripe: "stripe" };
    const key = envMap[id];
    const resolved: Status = fresh?.[key] === "ok" ? "connected" : fresh?.[key] === "degraded" ? "degraded" : "unconfigured";
    setLocalStatuses((s) => ({ ...s, [id]: resolved }));
    toast.success(`${INTEGRATIONS.find(i => i.id === id)?.name ?? id} — ${resolved}`);
  };

  const categories = ["All", ...Array.from(new Set(INTEGRATIONS.map((i) => i.category)))];
  const filtered = activeCategory === "All" ? INTEGRATIONS : INTEGRATIONS.filter((i) => i.category === activeCategory);
  const connected = Object.values(mergedStatuses).filter((s) => s === "connected").length;
  const total = INTEGRATIONS.filter((i) => i.envKey).length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <div className="hidden md:flex"><Sidebar /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="Integrations" />
        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

            {/* Header */}
            <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-xl)", padding: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.125rem", color: "var(--color-text-primary)", margin: "0 0 0.25rem" }}>Integration Hub</h2>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0 }}>
                  Connect your tools using simple buttons — no JSON or API knowledge required.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-display)", color: connected > 0 ? "var(--color-brand)" : "var(--color-text-tertiary)", margin: 0 }}>{connected} / {total}</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Connected</p>
                </div>
                <button onClick={() => healthQuery.refetch()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", background: "transparent", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
                  <RefreshCw size={14} style={healthQuery.isFetching ? { animation: "spin 1s linear infinite" } : undefined} />
                  Refresh all
                </button>
              </div>
            </div>

            {/* Category filter */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: "0.35rem 0.875rem", borderRadius: "var(--radius-full)", border: `1px solid ${activeCategory === cat ? "var(--color-brand)" : "var(--color-border-subtle)"}`, background: activeCategory === cat ? "rgba(61,255,160,0.08)" : "transparent", color: activeCategory === cat ? "var(--color-brand)" : "var(--color-text-secondary)", fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: "var(--space-4)" }}>
              {filtered.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  status={localStatuses[integration.id] ?? mergedStatuses[integration.id] ?? "unconfigured"}
                  onTest={testConnection}
                />
              ))}
            </div>

            {/* Env var hint */}
            <div style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: "var(--radius-lg)", padding: "var(--space-5)" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.875rem", color: "#60a5fa", margin: "0 0 0.5rem" }}>How connections work</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>
                All credentials are stored as <strong>server-side environment variables</strong> — never in the browser or database. To connect an integration, set the relevant env var in your Render dashboard (Settings → Environment), then redeploy. NexusOps detects the connection automatically on the next health check.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
