/**
 * NexusOps — Application root
 *
 * Sets up the theme provider, tooltip provider, toast notifications,
 * and the wouter client-side router. All authenticated routes are
 * wrapped in AuthGuard which redirects to /auth if no Supabase session.
 *
 * Public routes:  /  and  /auth
 * Protected routes: /dashboard and everything else
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "@/contexts/ThemeContext";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocaleProvider } from "./contexts/LocaleContext";
import { AuthGuard } from "./components/auth/auth-guard";
import { lazy, Suspense } from "react";

// Public pages
import LandingPage from "./pages/landing-page";
import AuthPage from "./pages/auth-page";
import NotFoundPage from "./pages/not-found-page";

// Protected pages — lazy-loaded to keep the landing bundle small
const DashboardPage = lazy(() => import("./pages/dashboard-page"));
const WorkflowsPage = lazy(() => import("./pages/workflows-page"));
const AuditPage = lazy(() => import("./pages/audit-page"));
const AIInteractionsPage = lazy(() => import("./pages/ai-interactions-page"));
const ReportsPage = lazy(() => import("./pages/reports-page"));
const PerformancePage = lazy(() => import("./pages/performance-page"));
const SettingsPage = lazy(() => import("./pages/settings-page"));
const GAIAPage = lazy(() => import("./pages/gaia-page"));

/** Suspense fallback used while lazy protected pages are loading */
function PageLoader(): JSX.Element {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--color-bg-base)" }}
    >
      <div
        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--color-brand)", borderTopColor: "transparent" }}
      />
    </div>
  );
}

/**
 * NexusOps Router
 *
 * Public routes:
 *   /          → LandingPage (no auth required)
 *   /auth      → AuthPage (redirects to /dashboard if already signed in)
 *
 * Protected routes (wrapped in AuthGuard):
 *   /dashboard         → Dashboard (governance command centre)
 *   /workflows         → WorkflowsPage
 *   /audit             → AuditPage (execution logs)
 *   /ai-interactions   → AIInteractionsPage
 *   /reports           → ReportsPage
 *   /performance       → PerformancePage
 *   /settings          → SettingsPage
 *
 * Legacy routes preserved for backward compatibility:
 *   /logs        → AuditPage
 *   /ai-logs     → AIInteractionsPage
 *
 * Catch-all → 404 page
 */
function Router(): JSX.Element {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />

      {/* Protected */}
      <Route path="/dashboard">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/workflows">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <WorkflowsPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/audit">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <AuditPage />
          </Suspense>
        </AuthGuard>
      </Route>
      {/* Legacy alias */}
      <Route path="/logs">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <AuditPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/ai-interactions">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <AIInteractionsPage />
          </Suspense>
        </AuthGuard>
      </Route>
      {/* Legacy alias */}
      <Route path="/ai-logs">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <AIInteractionsPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/reports">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <ReportsPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/performance">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <PerformancePage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/settings">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <SettingsPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/gaia">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <GAIAPage />
          </Suspense>
        </AuthGuard>
      </Route>
      {/* Legacy alias */}
      <Route path="/help">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <GAIAPage />
          </Suspense>
        </AuthGuard>
      </Route>

      {/* Catch-all */}
      <Route component={NotFoundPage} />
    </Switch>
  );
}

function AppShell(): JSX.Element {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <TooltipProvider>
      <Toaster theme={isDark ? "dark" : "light"} />
      <Router />
    </TooltipProvider>
  );
}

export default function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <LocaleProvider>
          <AppShell />
        </LocaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
