import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the global fetch used by the Airtable client
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Helper to build a mock Airtable list response
function makeListResponse<T>(records: Array<{ id: string; fields: T }>) {
  return {
    ok: true,
    json: async () => ({
      records: records.map((r) => ({
        id: r.id,
        createdTime: "2026-04-11T09:00:00.000Z",
        fields: r.fields,
      })),
    }),
    text: async () => "",
  };
}

// Helper to build a mock single-record response
function makeSingleResponse<T>(id: string, fields: T) {
  return {
    ok: true,
    json: async () => ({ id, createdTime: "2026-04-11T09:00:00.000Z", fields }),
    text: async () => "",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset env so the module picks up the test key
  process.env.AIRTABLE_API_KEY = "test-key";
  process.env.AIRTABLE_BASE_ID = "app4DDa3zvaGspOhz";
});

describe("getWorkflows", () => {
  it("maps Airtable fields to AirtableWorkflow shape", async () => {
    mockFetch.mockResolvedValueOnce(
      makeListResponse([
        {
          id: "rec001",
          fields: {
            "Workflow ID": "WF-2026-001",
            "Workflow Name": "Weekly Marketing Performance Reporting",
            "Requested By": "Dustine Kibagendi",
            "Runtime Used": "n8n",
            "Status": "Pending",
            "Date Requested": "2026-04-11T07:55:00.000Z",
            "Date Completed": null,
            "Report Period": "2026-01-26 to 2026-02-01",
            "Notes": null,
          },
        },
      ])
    );

    const { getWorkflows } = await import("./airtable");
    const result = await getWorkflows();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      recordId: "rec001",
      workflowId: "WF-2026-001",
      name: "Weekly Marketing Performance Reporting",
      requestedBy: "Dustine Kibagendi",
      runtime: "n8n",
      status: "Pending",
      reportPeriod: "2026-01-26 to 2026-02-01",
    });
  });

  it("falls back to defaults for missing fields", async () => {
    mockFetch.mockResolvedValueOnce(
      makeListResponse([{ id: "rec002", fields: {} }])
    );

    const { getWorkflows } = await import("./airtable");
    const result = await getWorkflows();

    expect(result[0].workflowId).toBe("rec002");
    expect(result[0].name).toBe("Weekly Marketing Performance Reporting");
    expect(result[0].runtime).toBe("—");
    expect(result[0].status).toBe("Pending");
  });
});

describe("getWorkflowByRecordId", () => {
  it("returns a single workflow by record ID", async () => {
    mockFetch.mockResolvedValueOnce(
      makeSingleResponse("rec003", {
        "Workflow ID": "WF-2026-003",
        "Workflow Name": "Weekly Marketing Performance Reporting",
        "Requested By": "Test User",
        "Runtime Used": "Make",
        "Status": "Completed",
      })
    );

    const { getWorkflowByRecordId } = await import("./airtable");
    const result = await getWorkflowByRecordId("rec003");

    expect(result).not.toBeNull();
    expect(result?.workflowId).toBe("WF-2026-003");
    expect(result?.runtime).toBe("Make");
    expect(result?.status).toBe("Completed");
  });

  it("returns null when fetch fails (record not found)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "NOT_FOUND",
      json: async () => ({}),
    });

    const { getWorkflowByRecordId } = await import("./airtable");
    const result = await getWorkflowByRecordId("rec-nonexistent");
    expect(result).toBeNull();
  });
});

describe("getExecutionLogs", () => {
  it("maps execution log fields correctly", async () => {
    mockFetch.mockResolvedValueOnce(
      makeListResponse([
        {
          id: "execRec001",
          fields: {
            "Log ID": "EXE-2026-001",
            "Workflow": ["rec001"],
            "Runtime": "n8n",
            "Step Name": "Data Extraction",
            "Event Type": "Workflow Created",
            "Status": "success",
            "Timestamp": "2026-04-11T09:55:00.000Z",
            "Message": "WF-2026-012 · Workflow Created",
          },
        },
      ])
    );

    const { getExecutionLogs } = await import("./airtable");
    const result = await getExecutionLogs();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      recordId: "execRec001",
      logId: "EXE-2026-001",
      workflowRecordIds: ["rec001"],
      runtime: "n8n",
      stepName: "Data Extraction",
      eventType: "Workflow Created",
      status: "success",
    });
  });
});

describe("getAILogs", () => {
  it("maps AI interaction log fields correctly", async () => {
    mockFetch.mockResolvedValueOnce(
      makeListResponse([
        {
          id: "aiRec001",
          fields: {
            "AI Interaction Log ID": "AI-001",
            "Workflow ID": ["rec001"],
            "Prompt Text": "You are a marketing analyst...",
            "Response Text": "##EXECUTIVE_SUMMARY##...",
            "Model Used": "gpt-4o-2024-08-06",
            "Timestamp": "2026-04-11T09:00:00.000Z",
            "Cost Notes": "~2000 tokens est.",
          },
        },
      ])
    );

    const { getAILogs } = await import("./airtable");
    const result = await getAILogs();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      recordId: "aiRec001",
      logId: "AI-001",
      promptText: "You are a marketing analyst...",
      responseText: "##EXECUTIVE_SUMMARY##...",
      modelUsed: "gpt-4o-2024-08-06",
      costNotes: "~2000 tokens est.",
    });
  });
});

describe("getPerformanceData", () => {
  it("maps performance data fields and coerces numbers", async () => {
    mockFetch.mockResolvedValueOnce(
      makeListResponse([
        {
          id: "perfRec001",
          fields: {
            "Performance Data ID": "Brand Awareness – Q1",
            "Workflow ID": [],
            "Impressions": 84200,
            "Clicks": 1011,
            "Conversions": 42,
            "Spend": 620.0,
            "Reporting Period": "2026-03-01 to 2026-03-07",
          },
        },
      ])
    );

    const { getPerformanceData } = await import("./airtable");
    const result = await getPerformanceData();

    expect(result[0]).toMatchObject({
      performanceDataId: "Brand Awareness – Q1",
      impressions: 84200,
      clicks: 1011,
      conversions: 42,
      spend: 620.0,
      reportingPeriod: "2026-03-01 to 2026-03-07",
    });
  });
});

describe("getFinalReports", () => {
  it("maps final report fields correctly", async () => {
    mockFetch.mockResolvedValueOnce(
      makeListResponse([
        {
          id: "rptRec001",
          fields: {
            "Final Report ID": "RPT-001",
            "Workflow ID": ["rec001"],
            "Executive Summary": "Week of 2026-03-01 delivered strong results.",
            "Key Insights": "Search – Branded is the most efficient channel.",
            "Risks or Anomalies": "Brand Awareness – Q1 CTR dropped 12%.",
            "Recommendation": "Increase Search – Branded budget by 20%.",
            "Approved": false,
            "Report Timestamp": "2026-04-11T09:00:00.000Z",
          },
        },
      ])
    );

    const { getFinalReports } = await import("./airtable");
    const result = await getFinalReports();

    expect(result[0]).toMatchObject({
      reportId: "RPT-001",
      executiveSummary: "Week of 2026-03-01 delivered strong results.",
      keyInsights: "Search – Branded is the most efficient channel.",
      risksOrAnomalies: "Brand Awareness – Q1 CTR dropped 12%.",
      recommendation: "Increase Search – Branded budget by 20%.",
      approved: false,
    });
  });
});

describe("getDashboardStats", () => {
  it("computes correct totals and runtime splits", async () => {
    mockFetch.mockResolvedValueOnce(
      makeListResponse([
        { id: "r1", fields: { "Status": "Pending", "Runtime Used": "Make" } },
        { id: "r2", fields: { "Status": "Pending", "Runtime Used": "n8n" } },
        { id: "r3", fields: { "Status": "Completed", "Runtime Used": "Make" } },
        { id: "r4", fields: { "Status": "Failed", "Runtime Used": "n8n" } },
      ])
    );

    const { getDashboardStats } = await import("./airtable");
    const stats = await getDashboardStats();

    expect(stats.total).toBe(4);
    expect(stats.pending).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.failed).toBe(1);
    expect(stats.make).toBe(2);
    expect(stats.n8n).toBe(2);
  });
});
