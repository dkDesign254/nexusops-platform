import { z } from "zod";
import {
  listAILogsByWorkflow,
  listExecutionLogsByWorkflow,
  listAllReports,
  getDashboardStats,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const logsRouter = router({
  executionLogs: protectedProcedure
    .input(z.object({ workflowId: z.string() }))
    .query(async ({ input }) => {
      return listExecutionLogsByWorkflow(input.workflowId);
    }),

  aiLogs: protectedProcedure
    .input(z.object({ workflowId: z.string() }))
    .query(async ({ input }) => {
      return listAILogsByWorkflow(input.workflowId);
    }),

  allReports: protectedProcedure.query(async () => {
    return listAllReports();
  }),

  dashboardStats: protectedProcedure.query(async () => {
    return getDashboardStats();
  }),
});
