import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  FileText,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Workflow,
  Zap,
} from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

function FeatureCard({
  icon,
  title,
  description,
  onClick,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  cta: string;
}) {
  return (
    <button
      onClick={onClick}
      className="surface-elevated rounded-2xl p-5 text-left card-hover hover:bg-accent/10 transition"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="p-2 rounded-2xl bg-primary/10 border border-primary/20">
          {icon}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground mt-1" />
      </div>

      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
        {description}
      </p>
      <p className="text-[11px] text-primary mt-3 font-medium">{cta}</p>
    </button>
  );
}

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_30%),radial-gradient(circle_at_left,rgba(16,185,129,0.08),transparent_24%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.06),transparent_22%)]" />

      <div className="relative max-w-[1400px] mx-auto px-6 py-10 lg:px-10 space-y-8">
        <header className="flex items-center justify-between gap-4">
          <button
            onClick={() => setLocation("/home")}
            className="flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">AgentOps</p>
              <p className="text-[11px] text-muted-foreground">
                AI agent operations and governance
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Button
              variant="outline"
              className="rounded-xl bg-transparent"
              onClick={() => setLocation("/help")}
            >
              Ask GAIA
            </Button>
            <Button
              className="rounded-xl bg-primary text-primary-foreground hover:opacity-90"
              onClick={() => setLocation("/signin")}
            >
              Sign in
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary">
              <Sparkles className="w-3 h-3" />
              AI Agent Operations Platform
            </div>

            <div>
              <h1 className="text-heading text-4xl md:text-5xl xl:text-6xl">
                Build, govern, and understand the workflows your company runs on.
              </h1>
              <p className="text-base text-muted-foreground mt-5 max-w-3xl leading-relaxed">
                AgentOps brings together workflows, logs, reports, AI decisions,
                runtime monitoring, performance analysis, and governance into one
                operational workspace. It is designed to feel detailed, warm,
                and manageable rather than overwhelming.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="rounded-xl bg-primary text-primary-foreground hover:opacity-90"
                onClick={() => setLocation("/signin")}
              >
                Enter workspace
              </Button>
              <Button
                variant="outline"
                className="rounded-xl bg-transparent"
                onClick={() => setLocation("/help")}
              >
                Ask GAIA AI
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
              <div
                role="button"
                onClick={() => setLocation("/logs")}
                className="rounded-2xl border border-border/70 bg-muted/10 p-4 hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <Activity className="w-4 h-4 text-primary mb-2" />
                <p className="text-sm font-semibold text-foreground">Monitor</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Watch workflows, AI decisions, runtime events, and health signals in one place.
                </p>
              </div>

              <div
                role="button"
                onClick={() => setLocation("/workflows/new")}
                className="rounded-2xl border border-border/70 bg-muted/10 p-4 hover:border-blue-500/30 hover:bg-blue-500/5 transition-colors cursor-pointer"
              >
                <Zap className="w-4 h-4 text-blue-400 mb-2" />
                <p className="text-sm font-semibold text-foreground">Build</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Create automations on Make or n8n with guided setup and AI configuration.
                </p>
              </div>

              <div
                role="button"
                onClick={() => setLocation("/signin")}
                className="rounded-2xl border border-border/70 bg-muted/10 p-4 hover:border-violet-500/30 hover:bg-violet-500/5 transition-colors cursor-pointer"
              >
                <Shield className="w-4 h-4 text-violet-400 mb-2" />
                <p className="text-sm font-semibold text-foreground">Govern</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Apply role-based controls, access reviews, and audit-ready governance policies.
                </p>
              </div>

              <div
                role="button"
                onClick={() => setLocation("/help")}
                className="rounded-2xl border border-border/70 bg-muted/10 p-4 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors cursor-pointer"
              >
                <Bot className="w-4 h-4 text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-foreground">Understand</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Use GAIA AI, logs, and workflow explanations to reduce complexity and confusion.
                </p>
              </div>

              <div
                role="button"
                onClick={() => setLocation("/signin")}
                className="rounded-2xl border border-border/70 bg-muted/10 p-4 hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors cursor-pointer col-span-2 sm:col-span-1"
              >
                <BarChart3 className="w-4 h-4 text-amber-400 mb-2" />
                <p className="text-sm font-semibold text-foreground">Improve</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Turn workflow activity into reports, performance insights, and operational action.
                </p>
              </div>
            </div>
          </div>

          <div className="surface-elevated rounded-3xl p-6 md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-4">
              What you can do here
            </p>

            <div className="space-y-3">
              {[
                "Track AI agents running on Make and n8n",
                "Inspect execution logs and AI logs",
                "Review reports and campaign performance",
                "Guide users with GAIA AI instead of forcing technical learning first",
                "Apply governance controls where decisions need oversight",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Explore the platform</p>
            <p className="text-xs text-muted-foreground mt-1">
              Every section below is clickable and routes you to the right workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Workflow className="w-4 h-4 text-primary" />}
              title="Workflow Setup"
              description="Create, configure, and govern automations for Make and n8n."
              onClick={() => setLocation("/workflows/new")}
              cta="Open workflow setup"
            />

            <FeatureCard
              icon={<Activity className="w-4 h-4 text-blue-400" />}
              title="Execution Logs"
              description="Inspect runtime activity, failures, step traces, and workflow behaviour."
              onClick={() => setLocation("/logs")}
              cta="Open execution logs"
            />

            <FeatureCard
              icon={<Bot className="w-4 h-4 text-purple-400" />}
              title="AI Logs"
              description="Review prompts, responses, model activity, and explainability signals."
              onClick={() => setLocation("/ai-logs")}
              cta="Open AI logs"
            />

            <FeatureCard
              icon={<FileText className="w-4 h-4 text-amber-400" />}
              title="Reports"
              description="Read executive summaries, insights, anomalies, and recommendations."
              onClick={() => setLocation("/reports")}
              cta="Open reports"
            />

            <FeatureCard
              icon={<BarChart3 className="w-4 h-4 text-emerald-400" />}
              title="Performance Data"
              description="Connect workflow execution to campaign results and business metrics."
              onClick={() => setLocation("/performance")}
              cta="Open performance data"
            />

            <FeatureCard
              icon={<Sparkles className="w-4 h-4 text-primary" />}
              title="GAIA AI"
              description="Use the guided assistant to understand the platform and explain workflows."
              onClick={() => setLocation("/help")}
              cta="Open GAIA AI"
            />
          </div>
        </section>

        <section className="surface-elevated rounded-3xl p-6 md:p-7">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <div className="p-2 rounded-2xl bg-primary/10 border border-primary/20 w-fit mb-3">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Clear entry</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                New users should not have to decode the product before they can benefit from it.
              </p>
            </div>

            <div>
              <div className="p-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 w-fit mb-3">
                <Bot className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-sm font-semibold text-foreground">AI-assisted understanding</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                The app explains itself, explains workflows, and guides users to the right page.
              </p>
            </div>

            <div>
              <div className="p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 w-fit mb-3">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-foreground">Governance with warmth</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Powerful controls should feel approachable, not cold or intimidating.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
