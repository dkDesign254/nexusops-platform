import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  Zap,
  Activity,
} from "lucide-react";

// ─── Status Badge ─────────────────────────────────────────────────────────────

type WorkflowStatus = "pending" | "running" | "completed" | "failed";

const statusConfig: Record<
  WorkflowStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    icon: <Clock className="w-3 h-3" />,
  },
  running: {
    label: "Running",
    className:
      "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  completed: {
    label: "Completed",
    className:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  failed: {
    label: "Failed",
    className:
      "bg-red-500/10 text-red-400 border border-red-500/20",
    icon: <XCircle className="w-3 h-3" />,
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const config = statusConfig[status as WorkflowStatus] ?? statusConfig.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── Runtime Badge ────────────────────────────────────────────────────────────

type Runtime = "make" | "n8n";

const runtimeConfig: Record<
  Runtime,
  { label: string; className: string }
> = {
  make: {
    label: "Make",
    className:
      "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  },
  n8n: {
    label: "n8n",
    className:
      "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  },
};

export function RuntimeBadge({
  runtime,
  className,
}: {
  runtime: string;
  className?: string;
}) {
  const config = runtimeConfig[runtime?.toLowerCase() as Runtime] ?? runtimeConfig.make;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      <Zap className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// ─── Event Type Badge ─────────────────────────────────────────────────────────

type EventType =
  | "intake"
  | "routing"
  | "execution"
  | "ai_call"
  | "report"
  | "error"
  | "completion"
  | "webhook_received";

const eventTypeConfig: Record<
  EventType,
  { label: string; className: string; dotColor: string }
> = {
  intake: {
    label: "Intake",
    className: "text-sky-400",
    dotColor: "bg-sky-400",
  },
  routing: {
    label: "Routing",
    className: "text-violet-400",
    dotColor: "bg-violet-400",
  },
  execution: {
    label: "Execution",
    className: "text-blue-400",
    dotColor: "bg-blue-400",
  },
  ai_call: {
    label: "AI Call",
    className: "text-fuchsia-400",
    dotColor: "bg-fuchsia-400",
  },
  report: {
    label: "Report",
    className: "text-emerald-400",
    dotColor: "bg-emerald-400",
  },
  error: {
    label: "Error",
    className: "text-red-400",
    dotColor: "bg-red-400",
  },
  completion: {
    label: "Completion",
    className: "text-emerald-400",
    dotColor: "bg-emerald-400",
  },
  webhook_received: {
    label: "Webhook",
    className: "text-amber-400",
    dotColor: "bg-amber-400",
  },
};

export function EventTypeBadge({ eventType }: { eventType: string }) {
  const config =
    eventTypeConfig[eventType as EventType] ?? eventTypeConfig.execution;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", config.className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dotColor)} />
      {config.label}
    </span>
  );
}

// ─── Log Status Icon ──────────────────────────────────────────────────────────

export function LogStatusIcon({ status }: { status: string }) {
  if (status === "success") {
    return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
  }
  if (status === "failure") {
    return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
  }
  return <Activity className="w-4 h-4 text-blue-400 shrink-0" />;
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

export function StatsCard({
  label,
  value,
  icon,
  trend,
  className,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 flex flex-col gap-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <span className="p-2 rounded-lg bg-accent text-primary">{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-semibold text-foreground tabular-nums">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium",
              trend.positive ? "text-emerald-400" : "text-red-400"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="p-4 rounded-2xl bg-accent text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      {action}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
