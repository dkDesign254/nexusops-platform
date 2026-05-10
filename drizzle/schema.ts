import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["user", "admin", "analyst", "viewer"]);
export const workflowRuntimeEnum = pgEnum("workflow_runtime", ["make", "n8n"]);
export const workflowStatusEnum = pgEnum("workflow_status", [
  "pending", "running", "completed", "failed", "cancelled",
]);
export const executionEventTypeEnum = pgEnum("execution_event_type", [
  "intake", "routing", "execution", "ai_call", "report",
  "error", "completion", "webhook_received", "cancellation",
]);
export const executionLogStatusEnum = pgEnum("execution_log_status", ["success", "failure", "info"]);
export const auditActionEnum = pgEnum("audit_action", [
  "workflow_created", "workflow_cancelled", "workflow_retried",
  "report_approved", "report_rejected", "agent_created", "agent_updated",
  "user_role_changed", "airtable_synced", "integration_connected",
  "integration_disconnected", "seed_run",
]);
export const alertSeverityEnum = pgEnum("alert_severity", ["info", "warning", "critical"]);
export const triggerModeEnum = pgEnum("trigger_mode", ["manual", "scheduled", "webhook"]);
export const loggingLevelEnum = pgEnum("logging_level", ["basic", "standard", "full"]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("viewer").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Workflows ────────────────────────────────────────────────────────────────

export const workflows = pgTable("workflows", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  runtime: workflowRuntimeEnum("runtime").notNull(),
  status: workflowStatusEnum("status").default("pending").notNull(),
  requestedBy: varchar("requestedBy", { length: 255 }).notNull(),
  webhookUrl: text("webhookUrl"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completedAt", { withTimezone: true }),
});

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

// ─── Execution Logs ───────────────────────────────────────────────────────────

export const ExecutionLogs = pgTable("ExecutionLogs", {
  id: serial("id").primaryKey(),
  workflowId: varchar("workflowId", { length: 36 }).notNull(),
  step: varchar("step", { length: 255 }).notNull(),
  eventType: executionEventTypeEnum("eventType").notNull(),
  status: executionLogStatusEnum("status").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
});

export type ExecutionLog = typeof ExecutionLogs.$inferSelect;
export type InsertExecutionLog = typeof ExecutionLogs.$inferInsert;

// ─── AI Logs ──────────────────────────────────────────────────────────────────

export const AI_Logs = pgTable("AI_Logs", {
  id: serial("id").primaryKey(),
  workflowId: varchar("workflowId", { length: 36 }).notNull(),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  model: varchar("model", { length: 128 }).notNull(),
  tokensUsed: integer("tokens_used"),
  confidence: integer("confidence"),   // 0–100
  flagged: boolean("flagged").default(false),
  payloadHash: varchar("payload_hash", { length: 64 }), // SHA-256(prompt || response) — tamper detection
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
});

export type AILog = typeof AI_Logs.$inferSelect;
export type InsertAILog = typeof AI_Logs.$inferInsert;

// ─── Reports ──────────────────────────────────────────────────────────────────

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  workflowId: varchar("workflowId", { length: 36 }).notNull().unique(),
  summary: text("summary").notNull(),
  insights: text("insights").notNull(),
  risks: text("risks").notNull(),
  recommendation: text("recommendation").notNull(),
  actionItems: text("action_items"),
  approved: boolean("approved"),
  rejected: boolean("rejected").default(false),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

// ─── Agent Configs ────────────────────────────────────────────────────────────

export const agentConfigs = pgTable("agent_configs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  runtimePreference: workflowRuntimeEnum("runtime_preference"),
  triggerMode: triggerModeEnum("trigger_mode").default("manual").notNull(),
  aiAnalysisEnabled: boolean("ai_analysis_enabled").default(true),
  approvalRequired: boolean("approval_required").default(false),
  loggingLevel: loggingLevelEnum("logging_level").default("standard").notNull(),
  governanceChecklist: jsonb("governance_checklist"),
  requiredIntegrations: jsonb("required_integrations"),
  riskLevel: varchar("risk_level", { length: 32 }).default("medium"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AgentConfig = typeof agentConfigs.$inferSelect;
export type InsertAgentConfig = typeof agentConfigs.$inferInsert;

// ─── Gaia Sessions ────────────────────────────────────────────────────────────

export const gaiaSessions = pgTable("gaia_sessions", {
  id: serial("id").primaryKey(),
  userOpenId: varchar("user_open_id", { length: 64 }),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type GaiaSession = typeof gaiaSessions.$inferSelect;
export type InsertGaiaSession = typeof gaiaSessions.$inferInsert;

export const gaiaMessages = pgTable("gaia_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  role: varchar("role", { length: 16 }).notNull(),   // "user" | "assistant"
  content: text("content").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
});

export type GaiaMessage = typeof gaiaMessages.$inferSelect;
export type InsertGaiaMessage = typeof gaiaMessages.$inferInsert;

// ─── Audit Events ─────────────────────────────────────────────────────────────

export const auditEvents = pgTable("audit_events", {
  id: serial("id").primaryKey(),
  action: auditActionEnum("action").notNull(),
  actorOpenId: varchar("actor_open_id", { length: 64 }),
  actorName: varchar("actor_name", { length: 255 }),
  targetId: varchar("target_id", { length: 255 }),
  targetType: varchar("target_type", { length: 64 }),
  details: jsonb("details"),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
});

export type AuditEvent = typeof auditEvents.$inferSelect;
export type InsertAuditEvent = typeof auditEvents.$inferInsert;

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  workflowId: varchar("workflow_id", { length: 36 }),
  severity: alertSeverityEnum("severity").default("info").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

// ─── Performance Data ─────────────────────────────────────────────────────────

export const performanceData = pgTable("performance_data", {
  id: serial("id").primaryKey(),
  workflowId: varchar("workflow_id", { length: 36 }),
  reportPeriod: varchar("report_period", { length: 64 }),
  ctr: integer("ctr"),          // basis points e.g. 250 = 2.50%
  roas: integer("roas"),        // basis points e.g. 380 = 3.80x
  conversions: integer("conversions"),
  spend: integer("spend"),      // cents
  impressions: integer("impressions"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PerformanceData = typeof performanceData.$inferSelect;
export type InsertPerformanceData = typeof performanceData.$inferInsert;
