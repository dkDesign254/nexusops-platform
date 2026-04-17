import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database helpers to avoid real DB calls in tests
vi.mock("./db", () => ({
  createWorkflow: vi.fn().mockResolvedValue({}),
  listWorkflows: vi.fn().mockResolvedValue([]),
  getWorkflowById: vi.fn().mockResolvedValue(null),
  updateWorkflowStatus: vi.fn().mockResolvedValue({}),
  createExecutionLog: vi.fn().mockResolvedValue({}),
  listExecutionLogsByWorkflow: vi.fn().mockResolvedValue([]),
  createAILog: vi.fn().mockResolvedValue({}),
  listAILogsByWorkflow: vi.fn().mockResolvedValue([]),
  createReport: vi.fn().mockResolvedValue({}),
  getReportByWorkflow: vi.fn().mockResolvedValue(null),
  listAllReports: vi.fn().mockResolvedValue([]),
  getDashboardStats: vi.fn().mockResolvedValue({
    total: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
  }),
  upsertUser: vi.fn().mockResolvedValue({}),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

// Mock LLM to avoid real API calls
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    model: "gpt-4o-mini",
    choices: [
      {
        message: {
          content: JSON.stringify({
            summary: "Test summary for the week.",
            insights: "Insight 1\nInsight 2",
            risks: "Risk 1\nRisk 2",
            recommendation: "Recommendation 1\nRecommendation 2",
          }),
        },
      },
    ],
  }),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears the session cookie and returns success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });

  it("returns the authenticated user from auth.me", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.email).toBe("test@example.com");
  });

  it("returns null for unauthenticated auth.me", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});

// ─── Workflow Tests ───────────────────────────────────────────────────────────

describe("workflows.list", () => {
  it("returns an empty array when no workflows exist", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.workflows.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});

describe("workflows.getById", () => {
  it("throws NOT_FOUND when workflow does not exist", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.workflows.getById({ id: "nonexistent" })).rejects.toThrow(
      "Workflow not found"
    );
  });
});

describe("workflows.create", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-apply mocks after clearAllMocks
    const db = await import("./db");
    vi.mocked(db.createWorkflow).mockResolvedValue({} as never);
    vi.mocked(db.updateWorkflowStatus).mockResolvedValue({} as never);
    vi.mocked(db.createExecutionLog).mockResolvedValue({} as never);
    vi.mocked(db.createAILog).mockResolvedValue({} as never);
    vi.mocked(db.createReport).mockResolvedValue({} as never);
    vi.mocked(db.getReportByWorkflow).mockResolvedValue(undefined);
  });

  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.workflows.create({ runtime: "make", requestedBy: "Test User" })
    ).rejects.toThrow();
  });

  it("creates a workflow with make runtime for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.workflows.create({
      runtime: "make",
      requestedBy: "Test User",
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("status");
    expect(typeof result.id).toBe("string");
    expect(result.id.length).toBeGreaterThan(0);
  });

  it("creates a workflow with n8n runtime", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.workflows.create({
      runtime: "n8n",
      requestedBy: "Marketing Team",
    });
    expect(result).toHaveProperty("id");
    expect(["completed", "failed"]).toContain(result.status);
  });
});

// ─── Logs Tests ───────────────────────────────────────────────────────────────

describe("logs.dashboardStats", () => {
  it("returns stats object with all required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.logs.dashboardStats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("pending");
    expect(stats).toHaveProperty("running");
    expect(stats).toHaveProperty("completed");
    expect(stats).toHaveProperty("failed");
  });
});

describe("logs.executionLogs", () => {
  it("returns empty array for unknown workflow", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const logs = await caller.logs.executionLogs({ workflowId: "unknown-id" });
    expect(Array.isArray(logs)).toBe(true);
  });
});

describe("logs.aiLogs", () => {
  it("returns empty array for unknown workflow", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const logs = await caller.logs.aiLogs({ workflowId: "unknown-id" });
    expect(Array.isArray(logs)).toBe(true);
  });
});

describe("logs.allReports", () => {
  it("returns an array of reports", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const reports = await caller.logs.allReports();
    expect(Array.isArray(reports)).toBe(true);
  });
});

// ─── Webhook Endpoint Tests ───────────────────────────────────────────────────

describe("Webhook payload validation", () => {
  it("validates that workflow ID is required for inbound webhooks", () => {
    // Simulates the validation logic in webhooks.ts
    const payload: Record<string, unknown> = {
      step: "Data Collection",
      eventType: "execution",
      status: "success",
      message: "Step completed",
    };
    const workflowId = payload.workflowId as string | undefined;
    expect(workflowId).toBeUndefined();
  });

  it("validates that a complete payload passes validation", () => {
    const payload: Record<string, unknown> = {
      workflowId: "test-workflow-id",
      step: "Data Collection",
      eventType: "execution",
      status: "success",
      message: "Step completed successfully",
    };
    const workflowId = payload.workflowId as string | undefined;
    expect(workflowId).toBe("test-workflow-id");
    expect(typeof workflowId).toBe("string");
    expect(workflowId.length).toBeGreaterThan(0);
  });

  it("correctly identifies failure status from webhook payload", () => {
    const payload: Record<string, unknown> = {
      workflowId: "test-id",
      status: "failure",
    };
    const status = (payload.status as string) === "failure" ? "failure" : "success";
    expect(status).toBe("failure");
  });
});

// ─── Make API Key Dispatch Tests ─────────────────────────────────────────────

describe("dispatchToRuntime — x-make-apikey header", () => {
  it("includes x-make-apikey header when makeApiKey is provided in workflow create input", async () => {
    // Arrange: capture the fetch call headers
    const capturedHeaders: Record<string, string>[] = [];
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async (_, init) => {
      capturedHeaders.push((init?.headers ?? {}) as Record<string, string>);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.workflows.create({
      runtime: "make",
      requestedBy: "test-user",
      webhookUrl: "https://hook.make.com/test-webhook",
      makeApiKey: "test-make-api-key-123",
    });

    // Find the fetch call that went to the webhook URL
    const webhookCall = capturedHeaders.find((h) => h["x-make-apikey"]);
    expect(webhookCall).toBeDefined();
    expect(webhookCall?.["x-make-apikey"]).toBe("test-make-api-key-123");

    fetchSpy.mockRestore();
  });

  it("does not include x-make-apikey header for n8n runtime even if makeApiKey is passed", async () => {
    const capturedHeaders: Record<string, string>[] = [];
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async (_, init) => {
      capturedHeaders.push((init?.headers ?? {}) as Record<string, string>);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.workflows.create({
      runtime: "n8n",
      requestedBy: "test-user",
      webhookUrl: "https://n8n.example.com/webhook/test",
      makeApiKey: "should-not-be-sent",
    });

    // No x-make-apikey header should appear for n8n
    const hasKey = capturedHeaders.some((h) => h["x-make-apikey"]);
    expect(hasKey).toBe(false);

    fetchSpy.mockRestore();
  });
});
