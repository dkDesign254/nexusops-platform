import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getWorkflows,
  getWorkflowByRecordId,
  getExecutionLogs,
  getAILogs,
  getPerformanceData,
  getFinalReports,
  getDashboardStats,
} from "../airtable";

export const airtableRouter = router({
  /** Governance dashboard stats: totals by status and runtime */
  dashboardStats: publicProcedure.query(async () => {
    return getDashboardStats();
  }),

  /** All workflows from Airtable */
  workflows: publicProcedure.query(async () => {
    return getWorkflows();
  }),

  /** Single workflow by Airtable record ID */
  workflowById: publicProcedure
    .input(z.object({ recordId: z.string() }))
    .query(async ({ input }) => {
      return getWorkflowByRecordId(input.recordId);
    }),

  /** Execution logs — optionally filtered by workflow record ID */
  executionLogs: publicProcedure
    .input(z.object({ workflowRecordId: z.string().optional() }))
    .query(async ({ input }) => {
      return getExecutionLogs(input.workflowRecordId);
    }),

  /** AI interaction logs — optionally filtered by workflow record ID */
  aiLogs: publicProcedure
    .input(z.object({ workflowRecordId: z.string().optional() }))
    .query(async ({ input }) => {
      return getAILogs(input.workflowRecordId);
    }),

  /** Performance data — optionally filtered by workflow record ID */
  performanceData: publicProcedure
    .input(z.object({ workflowRecordId: z.string().optional() }))
    .query(async ({ input }) => {
      return getPerformanceData(input.workflowRecordId);
    }),

  /** Final reports — optionally filtered by workflow record ID */
  finalReports: publicProcedure
    .input(z.object({ workflowRecordId: z.string().optional() }))
    .query(async ({ input }) => {
      return getFinalReports(input.workflowRecordId);
    }),
});
