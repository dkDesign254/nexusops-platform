import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  ArrowRight,
  Bot,
  Brain,
  Chrome,
  Eye,
  EyeOff,
  KeyRound,
  Shield,
  Sparkles,
  Workflow,
  Zap,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function AuthPanel() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [, setLocation] = useLocation();

  const utils = trpc.useUtils();
  const syncSession = trpc.auth.exchangeSupabaseSession.useMutation();
  const register = trpc.auth.register.useMutation();

  useEffect(() => {
    const trySync = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        await syncSession.mutateAsync({ accessToken: token });
        await utils.auth.me.invalidate();
      }
    };

    void trySync();
  }, [syncSession, utils.auth.me]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === "signup") {
        await register.mutateAsync({ email, password, name });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const token = data.session?.access_token;
      if (!token) throw new Error("No access token returned");

      await syncSession.mutateAsync({ accessToken: token });
      await utils.auth.me.invalidate();

      toast.success(
        mode === "signin" ? "Signed in successfully." : "Account created successfully."
      );
    } catch (err: any) {
      toast.error(err?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      toast.error(
        err?.message ||
          "Google sign-in is not available yet. Enable Google in Supabase Auth Providers."
      );
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Enter your email first so the reset link knows where to go.");
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;

      toast.success("Password recovery email sent. Check your inbox.");
    } catch (err: any) {
      toast.error(err?.message || "Unable to send password recovery email.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="relative min-h-screen">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_30%),radial-gradient(circle_at_left,rgba(16,185,129,0.08),transparent_24%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.06),transparent_22%)]" />

        <div className="relative max-w-[1400px] mx-auto min-h-screen grid grid-cols-1 xl:grid-cols-[1.12fr_0.88fr] gap-10 px-6 py-10 lg:px-10">
          {/* LEFT: LANDING EXPERIENCE */}
          <div className="flex flex-col justify-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary mb-5">
                <Sparkles className="w-3 h-3" />
                AI Agent Operations Platform
              </div>

              <h1 className="text-heading text-4xl md:text-5xl xl:text-6xl max-w-4xl">
                Build, govern, and understand the workflows your company runs on.
              </h1>

              <p className="text-base text-muted-foreground mt-5 max-w-2xl leading-relaxed">
                AgentOps brings together workflows, logs, reports, AI decisions,
                runtime monitoring, and governance into one operational workspace.
                It is designed to feel powerful without feeling intimidating.
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-muted/20 border border-border/60 px-3 py-2 text-xs text-foreground">
                  <Workflow className="w-3.5 h-3.5 text-primary" />
                  Make + n8n orchestration
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-muted/20 border border-border/60 px-3 py-2 text-xs text-foreground">
                  <Bot className="w-3.5 h-3.5 text-blue-400" />
                  AI visibility and traceability
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-muted/20 border border-border/60 px-3 py-2 text-xs text-foreground">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Governance-ready controls
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
                <div className="surface-elevated rounded-2xl p-5 card-hover">
                  <div className="p-2 rounded-2xl bg-primary/10 border border-primary/20 w-fit mb-3">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    AI-guided setup
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Reduce complexity with guided navigation, workflow help, and built-in explanation.
                  </p>
                </div>

                <div className="surface-elevated rounded-2xl p-5 card-hover">
                  <div className="p-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 w-fit mb-3">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Operational visibility
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    See what ran, what failed, what AI produced, and what needs attention.
                  </p>
                </div>

                <div className="surface-elevated rounded-2xl p-5 card-hover">
                  <div className="p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 w-fit mb-3">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Business outcomes
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Connect workflow execution to reports, performance, and decisions.
                  </p>
                </div>
              </div>

              <div className="surface-elevated rounded-2xl p-5 mt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-4">
                  Why teams use this
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Monitor AI agents without digging through multiple tools",
                    "Give non-technical users a clearer path through complex workflows",
                    "Centralise execution logs, AI logs, reports, and governance",
                    "Reduce fear of automation by making the system explain itself",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: AUTH PANEL */}
          <div className="flex items-center justify-center">
            <div className="surface-elevated rounded-3xl p-7 md:p-8 w-full max-w-md shadow-xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-3xl bg-primary/15 flex items-center justify-center mx-auto border border-primary/20">
                  <Shield className="w-8 h-8 text-primary" />
                </div>

                <h2 className="text-2xl font-semibold mt-5 text-foreground">
                  {mode === "signin" ? "Welcome back" : "Create your workspace access"}
                </h2>

                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {mode === "signin"
                    ? "Sign in to monitor workflows, track agents, and act without complexity."
                    : "Create an account to explore the platform. New users are assigned safe read-first access by default."}
                </p>
              </div>

              <div className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-[0.16em]">
                      Full name
                    </label>
                    <Input
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-[0.16em]">
                    Email
                  </label>
                  <Input
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-[0.16em]">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="rounded-xl h-10 bg-[var(--primary)] text-white hover:opacity-90 w-full"
                >
                  {loading
                    ? "Processing..."
                    : mode === "signin"
                    ? "Sign in"
                    : "Create account"}
                </Button>

                <Button
                  onClick={handleGoogle}
                  variant="outline"
                  disabled={googleLoading}
                  className="rounded-xl h-10 bg-transparent w-full"
                >
                  <Chrome className="w-4 h-4 mr-2" />
                  {googleLoading
                    ? "Redirecting..."
                    : mode === "signin"
                    ? "Continue with Google"
                    : "Sign up with Google"}
                </Button>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <button
                    onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                    className="text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    {mode === "signin"
                      ? "Create account"
                      : "Already have an account? Sign in"}
                  </button>

                  <button
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="inline-flex items-center gap-1 text-primary hover:opacity-80 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    {resetLoading ? "Sending link..." : "Forgot password?"}
                  </button>
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 mt-2">
                  <p className="text-xs font-semibold text-foreground mb-1">
                    New here?
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Once you enter the app, you will see a guided dashboard, a help
                    workspace, and simple paths to workflows, logs, reports, and settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
