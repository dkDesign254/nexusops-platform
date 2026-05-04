import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  createAILog,
  createExecutionLog,
  createReport,
  createWorkflow,
  getReportByWorkflow,
  getWorkflowById,
  listWorkflows,
  updateWorkflowStatus,
} from "../db";
import { invokeLLM } from "../_core/llm";
import { ENV } from "../_core/env";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

// ─── Outbound Dispatch ────────────────────────────────────────────────────────

async function dispatchToRuntime(
  workflowId: string,
  runtime: "make" | "n8n",
  webhookUrl: string | null | undefined,
  makeApiKey?: string | null
): Promise<void> {
  if (!webhookUrl) {
    await createExecutionLog({
      workflowId,
      step: "Runtime Dispatch",
      eventType: "routing",
      status: "info",
      message: `No webhook URL configured for ${runtime}. Workflow proceeds in simulation mode.`,
    });
    return;
  }

  try {
    const payload = {
      workflowId,
      runtime,
      workflowName: "Weekly Marketing Performance Reporting",
      dispatchedAt: new Date().toISOString(),
    };

    // Build headers — add x-make-apikey for Make runtime if a key is available
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (runtime === "make") {
      const key = makeApiKey || ENV.makeApiKey;
      if (key) headers["x-make-apikey"] = key;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    await createExecutionLog({
      workflowId,
      step: "Runtime Dispatch",
      eventType: "routing",
      status: "success",
      message: `Workflow dispatched to ${runtime.toUpperCase()} runtime successfully. HTTP ${response.status}.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await createExecutionLog({
      workflowId,
      step: "Runtime Dispatch",
      eventType: "error",
      status: "failure",
      message: `Failed to dispatch to ${runtime.toUpperCase()}: ${msg}`,
    });
  }
}

// ─── AI Report Generation ─────────────────────────────────────────────────────

async function generateAIReport(workflowId: string, requestedBy: string): Promise<void> {
  const prompt = `You are a senior marketing analyst AI. Generate a structured Weekly Marketing Performance Report for the workflow requested by "${requestedBy}".

The report must be a valid JSON object with exactly these four keys:
- "summary": A 2-3 sentence executive summary of the week's marketing performance.
- "insights": 3-4 key data-driven insights from the week's campaigns (as a string with line breaks).
- "risks": 2-3 identified risks or underperforming areas requiring attention (as a string with line breaks).
- "recommendation": 3-4 concrete, actionable recommendations for the next week (as a string with line breaks).

Base the content on realistic marketing KPIs: CTR, ROAS, conversion rates, spend efficiency, audience engagement, and channel performance.
Return ONLY the JSON object, no markdown fences, no extra text.`;

  await createExecutionLog({
    workflowId,
    step: "AI Report Generation",
    eventType: "ai_call",
    status: "info",
    message: "Invoking LLM for structured marketing performance report generation.",
  });

  let rawResponse = "";
  let modelUsed = "gpt-4o-mini";

  try {
    const llmResult = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a senior marketing analyst AI that produces structured JSON reports. Always return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "marketing_report",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string", description: "Executive summary" },
              insights: { type: "string", description: "Key insights" },
              risks: { type: "string", description: "Identified risks" },
              recommendation: { type: "string", description: "Actionable recommendations" },
            },
            required: ["summary", "insights", "risks", "recommendation"],
            additionalProperties: false,
          },
        },
      },
    });

    rawResponse = (llmResult.choices?.[0]?.message?.content as string) ?? "";
    modelUsed = (llmResult.model as string) ?? modelUsed;

    await createAILog({
      workflowId,
      prompt,
      response: rawResponse,
      model: modelUsed,
    });

    const parsed = JSON.parse(rawResponse) as {
      summary: string;
      insights: string;
      risks: string;
      recommendation: string;
    };

    await createReport({
      workflowId,
      summary: parsed.summary,
      insights: parsed.insights,
      risks: parsed.risks,
      recommendation: parsed.recommendation,
    });

    await createExecutionLog({
      workflowId,
      step: "AI Report Generation",
      eventType: "report",
      status: "success",
      message: `Report generated successfully using model: ${modelUsed}.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    if (rawResponse) {
      await createAILog({
        workflowId,
        prompt,
        response: `ERROR: ${msg} | Raw: ${rawResponse}`,
        model: modelUsed,
      });
    }

    await createExecutionLog({
      workflowId,
      step: "AI Report Generation",
      eventType: "error",
      status: "failure",
      message: `LLM report generation failed: ${msg}`,
    });

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Report generation failed: ${msg}`,
    });
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const workflowsRouter = router({
  list: publicProcedure.query(async () => {
    return listWorkflows();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const wf = await getWorkflowById(input.id);
      if (!wf) throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
      return wf;
    }),

  create: protectedProcedure
    .input(
      z.object({
        runtime: z.enum(["make", "n8n"]),
        requestedBy: z.string().min(1).max(255),
        webhookUrl: z.string().optional(),
        makeApiKey: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const id = nanoid(12);
      const name = "Weekly Marketing Performance Reporting";
      const requester = input.requestedBy || ctx.user.name || ctx.user.email || "Unknown";

      // Step 1: Create workflow record
      await createWorkflow({
        id,
        name,
        runtime: input.runtime,
        status: "pending",
        requestedBy: requester,
        webhookUrl: input.webhookUrl || null,
      });

      // Step 2: Log intake
      await createExecutionLog({
        workflowId: id,
        step: "Workflow Intake",
        eventType: "intake",
        status: "success",
        message: `Workflow "${name}" created with ID ${id}. Runtime: ${input.runtime.toUpperCase()}. Requested by: ${requester}.`,
      });

      // Step 3: Update status to running
      await updateWorkflowStatus(id, "running");

      // Step 4: Log routing decision
      await createExecutionLog({
        workflowId: id,
        step: "Runtime Routing",
        eventType: "routing",
        status: "success",
        message: `Routing decision: workflow assigned to ${input.runtime.toUpperCase()} runtime for execution.`,
      });

      // Step 5: Dispatch to runtime
      await dispatchToRuntime(id, input.runtime, input.webhookUrl, input.makeApiKey);

      // Step 6: Generate AI report
      try {
        await generateAIReport(id, requester);
      } catch {
        await updateWorkflowStatus(id, "failed");
        return { id, status: "failed" as const };
      }

      // Step 7: Mark completed
      await updateWorkflowStatus(id, "completed", new Date());
      await createExecutionLog({
        workflowId: id,
        step: "Workflow Completion",
        eventType: "completion",
        status: "success",
        message: `Workflow "${name}" completed successfully. AI report generated and stored.`,
      });

      return { id, status: "completed" as const };
    }),

  /**
   * cancel — marks a running or pending workflow as "cancelled".
   * Writes a governance cancellation log entry.
   * Requires authentication.
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const wf = await getWorkflowById(input.id);
      if (!wf) throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });

      const allowedStatuses = ["running", "pending"];
      const currentStatus = (wf as Record<string, unknown>).status as string | undefined;
      if (!allowedStatuses.includes(currentStatus ?? "")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot cancel a workflow with status "${currentStatus}". Only running or pending workflows can be cancelled.` });
      }

      await updateWorkflowStatus(input.id, "cancelled");
      await createExecutionLog({
        workflowId: input.id,
        step: "Workflow Cancellation",
        eventType: "cancellation",
        status: "info",
        message: `Workflow cancelled by ${ctx.user.name ?? ctx.user.email ?? "user"}. Reason: ${input.reason ?? "Not specified"}.`,
      });

      return { id: input.id, status: "cancelled" as const };
    }),

  /**
   * retry — re-runs a failed or cancelled workflow from scratch.
   * Creates a new workflow record linked to the original, re-runs all steps.
   * Requires authentication.
   */
  retry: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const original = await getWorkflowById(input.id);
      if (!original) throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });

      const currentStatus = (original as Record<string, unknown>).status as string | undefined;
      const retryableStatuses = ["failed", "cancelled"];
      if (!retryableStatuses.includes(currentStatus ?? "")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot retry a workflow with status "${currentStatus}". Only failed or cancelled workflows can be retried.` });
      }

      const newId = nanoid(12);
      const requester = (original as Record<string, unknown>).requested_by as string || ctx.user.name || "Unknown";
      const runtime = ((original as Record<string, unknown>).runtime_used as string || "make").toLowerCase() as "make" | "n8n";
      const webhookUrl = (original as Record<string, unknown>).webhook_url as string | null | undefined;

      // Create retry workflow
      await createWorkflow({
        id: newId,
        name: "Weekly Marketing Performance Reporting",
        runtime,
        status: "pending",
        requestedBy: requester,
        webhookUrl: webhookUrl ?? null,
      });

      await createExecutionLog({
        workflowId: newId,
        step: "Workflow Intake",
        eventType: "intake",
        status: "success",
        message: `Retry of workflow ${input.id} initiated by ${ctx.user.name ?? ctx.user.email ?? "user"}. New ID: ${newId}.`,
      });

      await updateWorkflowStatus(newId, "running");

      await createExecutionLog({
        workflowId: newId,
        step: "Runtime Routing",
        eventType: "routing",
        status: "success",
        message: `Routing decision: retry assigned to ${runtime.toUpperCase()} runtime.`,
      });

      await dispatchToRuntime(newId, runtime, webhookUrl, undefined);

      try {
        await generateAIReport(newId, requester);
      } catch {
        await updateWorkflowStatus(newId, "failed");
        return { id: newId, originalId: input.id, status: "failed" as const };
      }

      await updateWorkflowStatus(newId, "completed", new Date());
      await createExecutionLog({
        workflowId: newId,
        step: "Workflow Completion",
        eventType: "completion",
        status: "success",
        message: `Retry workflow completed successfully.`,
      });

      return { id: newId, originalId: input.id, status: "completed" as const };
    }),

  getReport: publicProcedure
    .input(z.object({ workflowId: z.string() }))
    .query(async ({ input }) => {
      return getReportByWorkflow(input.workflowId);
    }),
});
