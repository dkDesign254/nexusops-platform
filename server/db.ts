import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  AI_Logs,
  AgentConfig,
  ExecutionLogs,
  InsertAILog,
  InsertAgentConfig,
  InsertAlert,
  InsertAuditEvent,
  InsertExecutionLog,
  InsertReport,
  InsertUser,
  InsertWorkflow,
  Report,
  User,
  agentConfigs,
  alerts,
  auditEvents,
  reports,
  users,
  workflows,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({ connectionString: process.env.DATABASE_URL });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function countUsers(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(users);
  return result.length;
}

export async function upsertUser(user: InsertUser): Promise<User | undefined> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return undefined;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.openId, user.openId))
    .limit(1);

  if (existing[0]) {
    const updateSet: Partial<InsertUser> = {};
    if (user.name !== undefined) updateSet.name = user.name ?? null;
    if (user.email !== undefined) updateSet.email = user.email ?? null;
    if (user.loginMethod !== undefined) updateSet.loginMethod = user.loginMethod ?? null;
    if (user.role !== undefined) updateSet.role = user.role;
    updateSet.lastSignedIn = user.lastSignedIn ?? new Date();

    await db.update(users).set(updateSet).where(eq(users.openId, user.openId));
  } else {
    await db.insert(users).values({
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role: user.role ?? "viewer",
      lastSignedIn: user.lastSignedIn ?? new Date(),
    });
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, user.openId))
    .limit(1);
  return result[0];
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Workflows ────────────────────────────────────────────────────────────────

export async function createWorkflow(data: InsertWorkflow) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(workflows).values(data);
  return data;
}

export async function listWorkflows() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workflows).orderBy(desc(workflows.createdAt));
}

export async function getWorkflowById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workflows).where(eq(workflows.id, id)).limit(1);
  return result[0];
}

export async function updateWorkflowStatus(
  id: string,
  status: "pending" | "running" | "completed" | "failed" | "cancelled",
  completedAt?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { status };
  if (completedAt) updateData.completedAt = completedAt;
  await db.update(workflows).set(updateData).where(eq(workflows.id, id));
}

// ─── Execution Logs ───────────────────────────────────────────────────────────

export async function createExecutionLog(data: InsertExecutionLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(ExecutionLogs).values(data);
}

export async function listExecutionLogsByWorkflow(workflowId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ExecutionLogs)
    .where(eq(ExecutionLogs.workflowId, workflowId))
    .orderBy(ExecutionLogs.timestamp);
}

export async function countFailedLogs(workflowId: string) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select()
    .from(ExecutionLogs)
    .where(
      and(
        eq(ExecutionLogs.workflowId, workflowId),
        eq(ExecutionLogs.status, "failure")
      )
    );
  return result.length;
}

// ─── AI Logs ──────────────────────────────────────────────────────────────────

export async function createAILog(data: InsertAILog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(AI_Logs).values(data);
}

export async function listAILogsByWorkflow(workflowId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(AI_Logs)
    .where(eq(AI_Logs.workflowId, workflowId))
    .orderBy(AI_Logs.timestamp);
}

export async function flagAILog(id: number, flagged: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(AI_Logs).set({ flagged }).where(eq(AI_Logs.id, id));
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function createReport(data: InsertReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(reports).values(data);
}

export async function getReportByWorkflow(workflowId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reports).where(eq(reports.workflowId, workflowId)).limit(1);
  return result[0];
}

export async function listAllReports(): Promise<Report[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).orderBy(desc(reports.createdAt));
}

export async function updateReportApproval(
  id: number,
  approved: boolean,
  rejectionReason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(reports)
    .set({
      approved: approved ? true : null,
      rejected: !approved,
      rejectionReason: rejectionReason ?? null,
    })
    .where(eq(reports.id, id));
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 };

  const all = await db.select().from(workflows);
  return {
    total: all.length,
    pending: all.filter((w) => w.status === "pending").length,
    running: all.filter((w) => w.status === "running").length,
    completed: all.filter((w) => w.status === "completed").length,
    failed: all.filter((w) => w.status === "failed").length,
    cancelled: all.filter((w) => w.status === "cancelled").length,
  };
}

// ─── Agent Configs ────────────────────────────────────────────────────────────

export async function listAgentConfigs(): Promise<AgentConfig[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentConfigs).orderBy(desc(agentConfigs.createdAt));
}

export async function createAgentConfig(data: InsertAgentConfig): Promise<AgentConfig | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(agentConfigs).values(data).returning();
  return result[0];
}

export async function updateAgentConfig(id: number, data: Partial<InsertAgentConfig>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(agentConfigs).set({ ...data, updatedAt: new Date() }).where(eq(agentConfigs.id, id));
}

// ─── Audit Events ─────────────────────────────────────────────────────────────

export async function createAuditEvent(data: InsertAuditEvent) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditEvents).values(data);
  } catch {
    // Non-fatal — audit events should never crash the main flow
  }
}

export async function listAuditEvents(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditEvents).orderBy(desc(auditEvents.timestamp)).limit(limit);
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export async function listAlerts(includeResolved = false) {
  const db = await getDb();
  if (!db) return [];
  const all = await db.select().from(alerts).orderBy(desc(alerts.createdAt));
  return includeResolved ? all : all.filter((a) => !a.resolved);
}

export async function createAlert(data: InsertAlert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(alerts).values(data);
}

export async function resolveAlert(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(alerts).set({ resolved: true, resolvedAt: new Date() }).where(eq(alerts.id, id));
}
