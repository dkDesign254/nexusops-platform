/**
 * Airtable API client for the AgentOps Governance Base.
 * Base ID: app4DDa3zvaGspOhz
 *
 * Table IDs:
 *   Workflow          → tblRHBMjoXufOtJLd
 *   Execution Log     → tblNGIYqaUAzQv4gM
 *   AI Interaction Log→ tblHHFbZbOMaWJqm5
 *   Performance Data  → tbl7RrluNwF5dfXWd
 *   Final Report      → tbldAOS5h3LUBpCB7
 */

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app4DDa3zvaGspOhz";
const API_KEY = process.env.AIRTABLE_API_KEY ?? "";
const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;

// ─── Generic fetcher ──────────────────────────────────────────────────────────

interface AirtableRecord<T> {
  id: string;
  createdTime: string;
  fields: T;
}

interface AirtableListResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;
}

async function fetchTable<T>(
  tableId: string,
  params: Record<string, string> = {}
): Promise<AirtableRecord<T>[]> {
  const url = new URL(`${BASE_URL}/${tableId}`);
  url.searchParams.set("pageSize", "100");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const allRecords: AirtableRecord<T>[] = [];
  let offset: string | undefined;

  do {
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Airtable API error (${res.status}): ${err}`);
    }

    const data: AirtableListResponse<T> = await res.json();
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

async function fetchRecord<T>(tableId: string, recordId: string): Promise<AirtableRecord<T>> {
  const res = await fetch(`${BASE_URL}/${tableId}/${recordId}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable API error (${res.status}): ${err}`);
  }
  return res.json();
}

// ─── Table-specific types ─────────────────────────────────────────────────────

export interface WorkflowFields {
  "Workflow ID"?: string;
  "Workflow Name"?: string;
  "Requested By"?: string;
  "Runtime Used"?: string;
  "Status"?: string;
  "Date Requested"?: string;
  "Date Completed"?: string;
  "Report Period"?: string;
  "Notes"?: string;
  "Execution Log"?: string[];
  "AI Interaction Log"?: string[];
  "Performance Data"?: string[];
  "Final Report"?: string[];
}

export interface ExecutionLogFields {
  "Log ID"?: string;
  "Workflow"?: string[];
  "Runtime"?: string;
  "Step Name"?: string;
  "Event Type"?: string;
  "Status"?: string;
  "Timestamp"?: string;
  "Message"?: string;
}

export interface AIInteractionLogFields {
  "AI Interaction Log ID"?: string;
  "Workflow ID"?: string[];
  "Prompt Text"?: string;
  "Response Text"?: string;
  "Model Used"?: string;
  "Timestamp"?: string;
  "Cost Notes"?: string;
}

export interface PerformanceDataFields {
  "Performance Data ID"?: string;
  "Workflow ID"?: string[];
  "Impressions"?: number;
  "Clicks"?: number;
  "Conversions"?: number;
  "Spend"?: number;
  "Reporting Period"?: string;
}

export interface FinalReportFields {
  "Final Report ID"?: string;
  "Workflow ID"?: string[];
  "Executive Summary"?: string;
  "Key Insights"?: string;
  "Risks or Anomalies"?: string;
  "Recommendation"?: string;
  "Approved"?: boolean;
  "Report Timestamp"?: string;
}

// ─── Normalised output types ──────────────────────────────────────────────────

export interface AirtableWorkflow {
  recordId: string;
  workflowId: string;
  name: string;
  requestedBy: string;
  runtime: string;
  status: string;
  dateRequested: string | null;
  dateCompleted: string | null;
  reportPeriod: string | null;
  notes: string | null;
}

export interface AirtableExecutionLog {
  recordId: string;
  logId: string;
  workflowRecordIds: string[];
  runtime: string;
  stepName: string;
  eventType: string;
  status: string;
  timestamp: string | null;
  message: string | null;
}

export interface AirtableAILog {
  recordId: string;
  logId: string;
  workflowRecordIds: string[];
  promptText: string;
  responseText: string;
  modelUsed: string;
  timestamp: string | null;
  costNotes: string | null;
}

export interface AirtablePerformanceData {
  recordId: string;
  performanceDataId: string;
  workflowRecordIds: string[];
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  reportingPeriod: string | null;
}

export interface AirtableFinalReport {
  recordId: string;
  reportId: string;
  workflowRecordIds: string[];
  executiveSummary: string;
  keyInsights: string;
  risksOrAnomalies: string;
  recommendation: string;
  approved: boolean;
  reportTimestamp: string | null;
}

// ─── Public fetchers ──────────────────────────────────────────────────────────

export async function getWorkflows(): Promise<AirtableWorkflow[]> {
  const records = await fetchTable<WorkflowFields>("tblRHBMjoXufOtJLd");
  return records.map((r) => ({
    recordId: r.id,
    workflowId: r.fields["Workflow ID"] ?? r.id,
    name: r.fields["Workflow Name"] ?? "Weekly Marketing Performance Reporting",
    requestedBy: r.fields["Requested By"] ?? "—",
    runtime: r.fields["Runtime Used"] ?? "—",
    status: r.fields["Status"] ?? "Pending",
    dateRequested: r.fields["Date Requested"] ?? null,
    dateCompleted: r.fields["Date Completed"] ?? null,
    reportPeriod: r.fields["Report Period"] ?? null,
    notes: r.fields["Notes"] ?? null,
  }));
}

export async function getWorkflowByRecordId(recordId: string): Promise<AirtableWorkflow | null> {
  try {
    const r = await fetchRecord<WorkflowFields>("tblRHBMjoXufOtJLd", recordId);
    return {
      recordId: r.id,
      workflowId: r.fields["Workflow ID"] ?? r.id,
      name: r.fields["Workflow Name"] ?? "Weekly Marketing Performance Reporting",
      requestedBy: r.fields["Requested By"] ?? "—",
      runtime: r.fields["Runtime Used"] ?? "—",
      status: r.fields["Status"] ?? "Pending",
      dateRequested: r.fields["Date Requested"] ?? null,
      dateCompleted: r.fields["Date Completed"] ?? null,
      reportPeriod: r.fields["Report Period"] ?? null,
      notes: r.fields["Notes"] ?? null,
    };
  } catch {
    return null;
  }
}

export async function getExecutionLogs(workflowRecordId?: string): Promise<AirtableExecutionLog[]> {
  const params: Record<string, string> = {};
  if (workflowRecordId) {
    params["filterByFormula"] = `FIND("${workflowRecordId}", ARRAYJOIN({Workflow}))`;
  }
  const records = await fetchTable<ExecutionLogFields>("tblNGIYqaUAzQv4gM", params);
  return records.map((r) => ({
    recordId: r.id,
    logId: r.fields["Log ID"] ?? r.id,
    workflowRecordIds: r.fields["Workflow"] ?? [],
    runtime: r.fields["Runtime"] ?? "—",
    stepName: r.fields["Step Name"] ?? "—",
    eventType: r.fields["Event Type"] ?? "execution",
    status: r.fields["Status"] ?? "success",
    timestamp: r.fields["Timestamp"] ?? null,
    message: r.fields["Message"] ?? null,
  }));
}

export async function getAILogs(workflowRecordId?: string): Promise<AirtableAILog[]> {
  const params: Record<string, string> = {};
  if (workflowRecordId) {
    params["filterByFormula"] = `FIND("${workflowRecordId}", ARRAYJOIN({Workflow ID}))`;
  }
  const records = await fetchTable<AIInteractionLogFields>("tblHHFbZbOMaWJqm5", params);
  return records.map((r) => ({
    recordId: r.id,
    logId: r.fields["AI Interaction Log ID"] ?? r.id,
    workflowRecordIds: r.fields["Workflow ID"] ?? [],
    promptText: r.fields["Prompt Text"] ?? "",
    responseText: r.fields["Response Text"] ?? "",
    modelUsed: r.fields["Model Used"] ?? "—",
    timestamp: r.fields["Timestamp"] ?? null,
    costNotes: r.fields["Cost Notes"] ?? null,
  }));
}

export async function getPerformanceData(workflowRecordId?: string): Promise<AirtablePerformanceData[]> {
  const params: Record<string, string> = {};
  if (workflowRecordId) {
    params["filterByFormula"] = `FIND("${workflowRecordId}", ARRAYJOIN({Workflow ID}))`;
  }
  const records = await fetchTable<PerformanceDataFields>("tbl7RrluNwF5dfXWd", params);
  return records.map((r) => ({
    recordId: r.id,
    performanceDataId: r.fields["Performance Data ID"] ?? r.id,
    workflowRecordIds: r.fields["Workflow ID"] ?? [],
    impressions: r.fields["Impressions"] ?? 0,
    clicks: r.fields["Clicks"] ?? 0,
    conversions: r.fields["Conversions"] ?? 0,
    spend: r.fields["Spend"] ?? 0,
    reportingPeriod: r.fields["Reporting Period"] ?? null,
  }));
}

export async function getFinalReports(workflowRecordId?: string): Promise<AirtableFinalReport[]> {
  const params: Record<string, string> = {};
  if (workflowRecordId) {
    params["filterByFormula"] = `FIND("${workflowRecordId}", ARRAYJOIN({Workflow ID}))`;
  }
  const records = await fetchTable<FinalReportFields>("tbldAOS5h3LUBpCB7", params);
  return records.map((r) => ({
    recordId: r.id,
    reportId: r.fields["Final Report ID"] ?? r.id,
    workflowRecordIds: r.fields["Workflow ID"] ?? [],
    executiveSummary: r.fields["Executive Summary"] ?? "",
    keyInsights: r.fields["Key Insights"] ?? "",
    risksOrAnomalies: r.fields["Risks or Anomalies"] ?? "",
    recommendation: r.fields["Recommendation"] ?? "",
    approved: r.fields["Approved"] ?? false,
    reportTimestamp: r.fields["Report Timestamp"] ?? null,
  }));
}

export async function getDashboardStats() {
  const workflows = await getWorkflows();
  const total = workflows.length;
  const byStatus = workflows.reduce(
    (acc, w) => {
      const s = (w.status ?? "Pending").toLowerCase();
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  return {
    total,
    pending: byStatus["pending"] ?? 0,
    running: byStatus["running"] ?? 0,
    completed: byStatus["completed"] ?? 0,
    failed: byStatus["failed"] ?? 0,
    make: workflows.filter((w) => w.runtime?.toLowerCase() === "make").length,
    n8n: workflows.filter((w) => w.runtime?.toLowerCase() === "n8n").length,
  };
}
