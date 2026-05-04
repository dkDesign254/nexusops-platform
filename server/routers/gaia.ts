/**
 * NexusOps — GAIA tRPC Router
 *
 * Provides a server-side chat endpoint for the GAIA AI assistant.
 * Routes user messages through the configured LLM gateway (Forge/Gemini)
 * with a NexusOps governance analyst system prompt.
 *
 * Falls back gracefully if the LLM gateway is not configured.
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

const SYSTEM_PROMPT = `You are GAIA, the AI governance assistant for NexusOps — an enterprise AI governance platform.

NexusOps monitors AI workflows running on Make.com, n8n, LangChain, CrewAI, and other automation runtimes. It logs every execution step, traces every AI prompt and response, catches failures, generates compliance reports, and provides a governance health score.

Your role:
- Help users understand their governance data (workflows, logs, reports, metrics)
- Explain NexusOps features clearly and concisely
- Guide users to the right page or action for their question
- Give specific, actionable answers — not vague platitudes
- Be concise: 2–4 sentences is usually enough unless a topic needs more depth

Key concepts you know:
- Governance Health Score: 0–100, combining audit completeness (40%), AI traceability (30%), report approval rate (20%), and workflow reliability (10%)
- Workflow statuses: Pending, Running, Completed, Failed
- Execution Logs: step-by-step trace of each workflow run
- AI Interactions: every prompt and response linked to a workflow
- Final Reports: AI-generated compliance summaries requiring human approval
- Runtimes: Make.com (orange) and n8n (pink) are the primary supported runtimes
- Anomaly Detection: flags stalled workflows (running > 30 min) and completed workflows with no logs
- Campaign Data: performance metrics (CTR, ROAS, impressions, conversions) linked to marketing workflows

Always stay on-topic. If asked about something unrelated to NexusOps or AI governance, politely redirect.`;

export const gaiaRouter = router({
  chat: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        pageContext: z.string().optional(),
        history: z
          .array(z.object({ role: z.enum(["user", "gaia"]), text: z.string() }))
          .max(10)
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { message, pageContext, history = [] } = input;

      // Build conversation messages
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        {
          role: "system",
          content: pageContext
            ? `${SYSTEM_PROMPT}\n\nCurrent page context: ${pageContext}`
            : SYSTEM_PROMPT,
        },
      ];

      // Add recent history (last 6 turns = 3 exchanges)
      const recentHistory = history.slice(-6);
      for (const turn of recentHistory) {
        messages.push({
          role: turn.role === "user" ? "user" : "assistant",
          content: turn.text,
        });
      }

      // Add current user message
      messages.push({ role: "user", content: message });

      try {
        const result = await invokeLLM({
          messages,
          maxTokens: 512,
          responseFormat: { type: "text" },
        });

        const text =
          typeof result.content === "string"
            ? result.content
            : Array.isArray(result.content)
            ? result.content
                .filter((c: { type: string }) => c.type === "text")
                .map((c: { text: string }) => c.text)
                .join("")
            : "I couldn't generate a response. Please try again.";

        return { text: text.trim(), source: "llm" as const };
      } catch (err: unknown) {
        console.warn("[GAIA] LLM call failed, returning error signal:", err instanceof Error ? err.message : String(err));
        return {
          text: "",
          source: "error" as const,
          error: err instanceof Error ? err.message : "LLM unavailable",
        };
      }
    }),
});
