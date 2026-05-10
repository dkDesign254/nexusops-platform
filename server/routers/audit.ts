import { z } from "zod";
import { listAuditEvents } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const auditRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
    .query(async ({ input }) => {
      return listAuditEvents(input?.limit ?? 100);
    }),
});
