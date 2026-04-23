import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "@/contexts/ThemeContext";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
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
      <Toaster
        theme={isDark ? "dark" : "light"}
        toastOptions={{
          style: {
            background: isDark ? "oklch(0.13 0.018 250)" : "oklch(0.99 0.002 250)",
            border: isDark ? "1px solid oklch(0.22 0.015 250)" : "1px solid oklch(0.9 0.01 250)",
            color: isDark ? "oklch(0.93 0.01 250)" : "oklch(0.2 0.02 250)",
          },
        }}
      />
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
