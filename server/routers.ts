import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { workflowsRouter } from "./routers/workflows";
import { logsRouter } from "./routers/logs";
import { airtableRouter } from "./routers/airtable";
import { intelligenceRouter } from "./routers/intelligence";
import { syncRouter } from "./routers/sync";
import { gaiaRouter } from "./routers/gaia";
import { billingRouter } from "./routers/billing";
import { auditRouter } from "./routers/audit";
import { z } from "zod";
import { countUsers, getDb, getUserByOpenId, upsertUser } from "./db";
import { createSessionToken } from "./_core/sdk";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getSupabaseAdmin, isSupabaseAdminAvailable } from "./src/lib/supabase-admin";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    register: publicProcedure
      .input(z.object({ email: z.string(), password: z.string(), name: z.string() }))
      .mutation(async ({ input }) => {
        const admin = getSupabaseAdmin(); // throws with clear message if not configured
        const { error } = await admin.auth.admin.createUser({
          email: input.email,
          password: input.password,
          email_confirm: true,
          user_metadata: { name: input.name },
        });
        if (error) throw error;
        return { success: true };
      }),

    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const admin = getSupabaseAdmin();
        const { error } = await admin.auth.admin.generateLink({
          type: "recovery",
          email: input.email,
        });
        if (error) throw error;
        return { success: true, message: "Password reset link generated." };
      }),

    /**
     * Bridge: exchanges a Supabase access token for a tRPC JWT cookie session.
     * Call this immediately after supabase.auth.signIn* succeeds on the client.
     * Without this, protectedProcedure will always return UNAUTHORIZED.
     */
    exchangeSupabaseSession: publicProcedure
      .input(z.object({ accessToken: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!isSupabaseAdminAvailable()) {
          throw new Error("Supabase is not configured on the server. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
        }

        const admin = getSupabaseAdmin();
        const { data, error } = await admin.auth.getUser(input.accessToken);
        if (error || !data.user) throw new Error("Invalid Supabase session");

        const openId = data.user.id;
        const existingUser = await getUserByOpenId(openId);
        const totalUsers = await countUsers();

        // Non-NexusOps roles (e.g. Supabase default "authenticated") are treated as unset
        const NEXUSOPS_ROLES = ["admin", "analyst", "viewer"];
        const currentRole = existingUser?.role;
        const hasValidRole = currentRole && NEXUSOPS_ROLES.includes(currentRole);

        let role = hasValidRole ? currentRole : undefined;
        if (!existingUser || !hasValidRole) {
          // First user ever → admin, otherwise viewer
          role = totalUsers === 0 ? "admin" : "viewer";
        }

        const user = await upsertUser({
          openId,
          email: data.user.email ?? null,
          name: data.user.user_metadata?.name ?? data.user.email?.split("@")[0] ?? "User",
          loginMethod: "supabase",
          role,
        });

        if (!user) throw new Error("Failed to provision user");

        const token = await createSessionToken({
          openId: user.openId,
          name: user.name ?? "User",
        });

        ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));
        return { success: true, user };
      }),

    listUsers: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(users);
    }),

    updateUserRole: adminProcedure
      .input(
        z.object({
          openId: z.string(),
          role: z.enum(["admin", "analyst", "viewer"]),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(users).set({ role: input.role }).where(eq(users.openId, input.openId));
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
  sync: syncRouter,
  gaia: gaiaRouter,
  billing: billingRouter,
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;
