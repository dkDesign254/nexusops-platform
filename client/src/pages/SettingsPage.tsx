import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  Bot,
  Check,
  ChevronRight,
  Crown,
  Database,
  GitBranch,
  Globe,
  Lock,
  Shield,
  Sparkles,
  Users,
  Zap,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "free forever",
    description: "For individuals exploring AI workflow governance.",
    icon: <Zap className="w-4 h-4" />,
    color: "text-muted-foreground",
    borderColor: "border-border/70",
    bgColor: "bg-muted/10",
    features: [
      "Up to 5 workflows / month",
      "1 runtime (Make or n8n)",
      "Basic execution logging",
      "7-day log retention",
      "Community support",
    ],
    cta: "Current plan",
    ctaVariant: "outline" as const,
    current: true,
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For automation engineers and marketing teams.",
    icon: <Sparkles className="w-4 h-4" />,
    color: "text-primary",
    borderColor: "border-primary/30",
    bgColor: "bg-primary/5",
    badge: "Most popular",
    features: [
      "Unlimited workflows",
      "Both runtimes (Make + n8n)",
      "Full AI interaction logging",
      "90-day log retention",
      "Report approval workflow",
      "PDF/JSON export",
      "Email support",
    ],
    cta: "Upgrade to Pro",
    ctaVariant: "default" as const,
    current: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "annual contract",
    description: "For organisations with compliance and scale requirements.",
    icon: <Crown className="w-4 h-4" />,
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/5",
    features: [
      "Everything in Pro",
      "SSO / SAML authentication",
      "Role-based access control",
      "Unlimited log retention",
      "SLA guarantees",
      "Dedicated onboarding",
      "Custom integrations",
      "Audit compliance reports",
    ],
    cta: "Contact sales",
    ctaVariant: "outline" as const,
    current: false,
  },
];

const ROLES = [
  {
    role: "Admin",
    icon: <Shield className="w-4 h-4 text-primary" />,
    description:
      "Full platform access — manage workflows, approve reports, configure runtimes, and view all logs.",
    permissions: [
      "Create & delete workflows",
      "Approve / reject reports",
      "Configure webhook endpoints",
      "View all AI logs",
      "Manage team members",
    ],
  },
  {
    role: "Analyst",
    icon: <Activity className="w-4 h-4 text-blue-400" />,
    description:
      "Read-only governance access — monitor workflows, view logs, and download reports.",
    permissions: [
      "View all workflows",
      "View execution logs",
      "View AI interaction logs",
      "Download reports (JSON)",
      "View performance data",
    ],
  },
  {
    role: "Viewer",
    icon: <Globe className="w-4 h-4 text-muted-foreground" />,
    description:
      "Dashboard-only access — see high-level metrics and workflow status without drill-down.",
    permissions: [
      "View dashboard stats",
      "View workflow list",
      "View report summaries",
    ],
  },
];

function UpgradeCTA({ plan }: { plan: (typeof PLANS)[number] }) {
  const [loading, setLoading] = useState(false);

  if (plan.current) {
    return (
      <Button variant="outline" size="sm" className="w-full text-xs rounded-xl" disabled>
        <Check className="w-3 h-3 mr-1.5" />
        {plan.cta}
      </Button>
    );
  }

  const handleUpgrade = () => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      if (plan.name === "Enterprise") {
        toast.info("Sales enquiry sent", {
          description: "Our enterprise team will contact you within 1 business day.",
        });
      } else {
        toast.success(`Upgrade to ${plan.name} initiated`, {
          description:
            "Billing integration is coming soon. You'll be notified when it's ready.",
          action: { label: "Dismiss", onClick: () => {} },
        });
      }
    }, 800);
  };

  return (
    <Button
      variant={plan.ctaVariant}
      size="sm"
      className={`w-full text-xs rounded-xl ${
        plan.ctaVariant === "default"
          ? "bg-[var(--primary)] text-white hover:opacity-90"
          : ""
      }`}
      onClick={handleUpgrade}
      disabled={loading}
    >
      {loading ? (
        <>
          <span className="w-3 h-3 mr-1.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          Processing…
        </>
      ) : (
        <>
          {plan.cta}
          <ChevronRight className="w-3 h-3 ml-1" />
        </>
      )}
    </Button>
  );
}

function UsageCard({
  label,
  value,
  max,
  icon,
  unit,
}: {
  label: string;
  value: number;
  max: number;
  icon: React.ReactNode;
  unit: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const isHigh = pct >= 80;

  return (
    <div className="surface-elevated rounded-2xl p-4 space-y-3 card-hover">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-2xl bg-muted/30 border border-border/50">{icon}</div>
        <span
          className={`text-xs font-mono font-semibold ${
            isHigh ? "text-amber-400" : "text-foreground"
          }`}
        >
          {value}
        </span>
      </div>

      <div>
        <p className="text-[11px] font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{unit}</p>
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isHigh ? "bg-amber-400" : "bg-[var(--primary)]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RoleCard({
  role,
  icon,
  description,
  permissions,
}: {
  role: string;
  icon: React.ReactNode;
  description: string;
  permissions: string[];
}) {
  return (
    <div className="surface-elevated rounded-2xl p-5 space-y-4 card-hover">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-2xl bg-muted/30 border border-border/50">{icon}</div>
        <span className="text-sm font-semibold text-foreground">{role}</span>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>

      <ul className="space-y-2">
        {permissions.map((p) => (
          <li key={p} className="flex items-start gap-2 text-[11px] text-foreground/75">
            <Lock className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SettingsPage() {
  const { data: stats } = trpc.airtable.dashboardStats.useQuery();

  const usageItems = [
    {
      label: "Total Workflows",
      value: stats?.total ?? 0,
      max: 5,
      icon: <GitBranch className="w-3.5 h-3.5 text-primary" />,
      unit: "/ 5 on Starter",
    },
    {
      label: "AI Interactions Logged",
      value: 1,
      max: 10,
      icon: <Bot className="w-3.5 h-3.5 text-violet-400" />,
      unit: "/ 10 on Starter",
    },
    {
      label: "Execution Log Entries",
      value: 22,
      max: 100,
      icon: <Database className="w-3.5 h-3.5 text-blue-400" />,
      unit: "/ 100 on Starter",
    },
    {
      label: "Reports Generated",
      value: 1,
      max: 3,
      icon: <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />,
      unit: "/ 3 on Starter",
    },
  ];

  return (
    <DashboardLayout
      breadcrumbs={[{ label: "Dashboard", path: "/" }, { label: "Settings & Billing" }]}
    >
      <div className="max-w-[1080px] mx-auto space-y-10">
        <div className="surface-elevated rounded-3xl p-6 md:p-7 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_28%),radial-gradient(circle_at_left,rgba(16,185,129,0.06),transparent_22%)]" />
          <div className="relative space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary">
              <Sparkles className="w-3 h-3" />
              Platform Administration
            </div>

            <div>
              <h1 className="text-heading text-2xl md:text-3xl">Settings & Billing</h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                Manage your plan, understand current platform usage, review access control
                boundaries, and prepare the workspace for team-wide enterprise deployment.
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Current Usage</h2>
            <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] text-muted-foreground font-medium">
              Starter plan
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {usageItems.map((item) => (
              <UsageCard key={item.label} {...item} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Plan & Pricing</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative surface-elevated rounded-2xl p-5 flex flex-col gap-5 border ${plan.borderColor} ${plan.bgColor} ${
                  plan.current ? "ring-1 ring-primary/20" : ""
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-[var(--primary)] text-white text-[10px] font-semibold">
                    {plan.badge}
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-2xl bg-muted/30 border border-border/50 ${plan.color}`}>
                    {plan.icon}
                  </div>
                  <span className={`text-sm font-bold ${plan.color}`}>{plan.name}</span>
                </div>

                <div>
                  <span className="text-3xl font-bold tracking-tight text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1.5">{plan.period}</span>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[11px] text-foreground/80">
                      <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <UpgradeCTA plan={plan} />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Role-Based Access Control</h2>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[11px] font-medium border border-amber-500/20">
              Enterprise
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {ROLES.map((r) => (
              <RoleCard
                key={r.role}
                role={r.role}
                icon={r.icon}
                description={r.description}
                permissions={r.permissions}
              />
            ))}
          </div>

          <div className="surface-elevated rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5">
            <p className="text-[11px] text-muted-foreground flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Role assignment, SSO configuration, and advanced organisational access controls
              are available on the Enterprise plan. Contact your account team to enable them.
            </p>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
