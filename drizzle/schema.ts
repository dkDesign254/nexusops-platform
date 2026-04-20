import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin", "analyst", "viewer"]);
export const workflowRuntimeEnum = pgEnum("workflow_runtime", ["make", "n8n"]);
export const workflowStatusEnum = pgEnum("workflow_status", ["pending", "running", "completed", "failed"]);
export const executionEventTypeEnum = pgEnum("execution_event_type", [
  "intake",
  "routing",
  "execution",
  "ai_call",
  "report",
  "error",
  "completion",
  "webhook_received",
]);
export const executionLogStatusEnum = pgEnum("execution_log_status", ["success", "failure", "info"]);

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

export const AI_Logs = pgTable("AI_Logs", {
  id: serial("id").primaryKey(),
  workflowId: varchar("workflowId", { length: 36 }).notNull(),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  model: varchar("model", { length: 128 }).notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
});

export type AILog = typeof AI_Logs.$inferSelect;
export type InsertAILog = typeof AI_Logs.$inferInsert;

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  workflowId: varchar("workflowId", { length: 36 }).notNull().unique(),
  summary: text("summary").notNull(),
  insights: text("insights").notNull(),
  risks: text("risks").notNull(),
  recommendation: text("recommendation").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
