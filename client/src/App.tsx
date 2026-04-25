import HomePage from "./pages/HomePage";
import AuthPanel from "./components/AuthPanel";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "@/contexts/ThemeContext";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./_core/hooks/useAuth";
import WorkflowNew from "./pages/WorkflowNew";
import WorkflowDetail from "./pages/WorkflowDetail";
import ReportsPage from "./pages/ReportsPage";
import WebhookSimulator from "./pages/WebhookSimulator";
import PerformanceData from "./pages/PerformanceData";
import SettingsPage from "./pages/SettingsPage";
import SystemLogsPage from "./pages/SystemLogsPage";
import ExecutionLogsPage from "./pages/ExecutionLogsPage";
import AILogsPage from "./pages/AILogsPage";
import WorkflowConfig from "./pages/WorkflowConfig";
import HelpPage from "./pages/HelpPage";

function SmartHome() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Dashboard /> : <HomePage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/home" component={HomePage} />
      <Route path="/signin" component={AuthPanel} />
      <Route path="/" component={SmartHome} />
      <Route path="/workflows/new" component={WorkflowNew} />
      <Route path="/workflows/:id" component={WorkflowDetail} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/webhooks" component={WebhookSimulator} />
      <Route path="/performance" component={PerformanceData} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/system-logs" component={SystemLogsPage} />
      <Route path="/logs" component={ExecutionLogsPage} />
      <Route path="/ai-logs" component={AILogsPage} />
      <Route path="/workflows/:id/config" component={WorkflowConfig} />
      <Route path="/help" component={HelpPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppShell() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <TooltipProvider>
      <Toaster theme={isDark ? "dark" : "light"} />
      <Router />
    </TooltipProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <AppShell />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
