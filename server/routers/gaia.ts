/**
 * NexusOps — GAIA tRPC Router
 *
 * Accepts an OpenAI-style messages array from the client and forwards it
 * directly to the LLM gateway. Falls back gracefully if no LLM is configured.
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const gaiaRouter = router({
  chat: publicProcedure
    .input(
      z.object({
        messages: z
          .array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string(),
            })
          )
          .min(1)
          .max(40),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await invokeLLM({
          messages: input.messages,
          maxTokens: 1024,
          responseFormat: { type: "text" },
        });

        const choice = result.choices?.[0];
        const raw = choice?.message?.content;
        const text =
          typeof raw === "string"
            ? raw
            : Array.isArray(raw)
            ? raw
                .filter((c: { type: string }) => c.type === "text")
                .map((c: { text: string }) => c.text)
                .join("")
            : "I couldn't generate a response. Please try again.";

        return { text: text.trim(), source: "llm" as const };
      } catch (err: unknown) {
        console.warn(
          "[GAIA] LLM call failed:",
          err instanceof Error ? err.message : String(err)
        );
        return {
          text: "",
          source: "error" as const,
          error: err instanceof Error ? err.message : "LLM unavailable",
        };
      }
    }),
});
