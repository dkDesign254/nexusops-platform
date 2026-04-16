import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/workflows/new" component={WorkflowNew} />
      <Route path="/workflows/:id" component={WorkflowDetail} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/webhooks" component={WebhookSimulator} />
      <Route path="/performance" component={PerformanceData} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.13 0.018 250)",
                border: "1px solid oklch(0.22 0.015 250)",
                color: "oklch(0.93 0.01 250)",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
