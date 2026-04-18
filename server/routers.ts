import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { workflowsRouter } from "./routers/workflows";
import { logsRouter } from "./routers/logs";
import { airtableRouter } from "./routers/airtable";
import { intelligenceRouter } from "./routers/intelligence";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { ENV } from "./_core/env";
import { upsertUser } from "./db";
import { createSessionToken } from "./_core/sdk";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    register: publicProcedure
      .input(z.object({ email: z.string(), password: z.string(), name: z.string() }))
      .mutation(async ({ input }) => {
        const { error } = await supabaseAdmin.auth.admin.createUser({
          email: input.email,
          password: input.password,
          email_confirm: true,
          user_metadata: { name: input.name },
        });

        if (error) throw error;
        return { success: true };
      }),

    exchangeSupabaseSession: publicProcedure
      .input(z.object({ accessToken: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { data, error } = await supabaseAdmin.auth.getUser(input.accessToken);
        if (error || !data.user) throw new Error("Invalid session");

        const user = await upsertUser({
          openId: data.user.id,
          email: data.user.email ?? "",
          name: data.user.user_metadata?.name ?? "User",
        });

        const token = createSessionToken({ openId: user.openId });

        ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));

        return { success: true };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  workflows: workflowsRouter,
  logs: logsRouter,
  airtable: airtableRouter,
  intelligence: intelligenceRouter,
});

export type AppRouter = typeof appRouter;
