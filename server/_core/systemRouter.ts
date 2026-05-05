import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      }).optional()
    )
    .query(() => ({
      ok: true,
    })),

  /** Returns per-service integration health status — used by Admin and Integrations pages. */
  serviceStatus: publicProcedure
    .query(async () => {
      const ts = new Date().toISOString();

      const supabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
      let supabase: "ok" | "degraded" | "unconfigured" = "unconfigured";
      if (supabaseConfigured) {
        try {
          const probe = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
            headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY! },
            signal: AbortSignal.timeout(3000),
          });
          supabase = probe.ok ? "ok" : "degraded";
        } catch {
          supabase = "degraded";
        }
      }

      const airtable: "ok" | "unconfigured" = process.env.AIRTABLE_TOKEN ? "ok" : "unconfigured";
      const stripe: "ok" | "unconfigured" = process.env.STRIPE_SECRET_KEY ? "ok" : "unconfigured";
      const llm: "ok" | "unconfigured" =
        process.env.BUILT_IN_FORGE_API_URL || process.env.ANTHROPIC_API_KEY ? "ok" : "unconfigured";
      const make: "ok" | "unconfigured" = process.env.MAKE_WEBHOOK_SECRET ? "ok" : "unconfigured";
      const n8n: "ok" | "unconfigured" = process.env.N8N_WEBHOOK_SECRET ? "ok" : "unconfigured";

      const allOk = supabase === "ok";
      return {
        status: allOk ? "ok" : "degraded",
        ts,
        services: { supabase, airtable, stripe, llm, make, n8n },
      };
    }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
