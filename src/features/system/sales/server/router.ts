import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/integrations/trpc/init";

import {
  createLeadSchema,
  leadIdSchema,
  listPipelineSchema,
  logActivitySchema,
  todayWorkSchema,
  updateLeadSchema,
} from "./schemas";
import * as service from "./service";

/**
 * Thin transport layer: authorise, then delegate. All logic lives in
 * `service.ts` so a future MCP wrapper calls the same functions.
 */

/**
 * The sales pipeline is admin-only. `src/proxy.ts` already blocks the `/sales`
 * routes by screen permission, but a tRPC procedure is reachable directly —
 * the route guard is not the authorisation.
 */
function assertAdmin(role: string | undefined) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
}

export const salesRouter = createTRPCRouter({
  today: protectedProcedure
    .input(todayWorkSchema)
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role);
      return service.getTodayWork(ctx.db, { newQueueCap: input.newQueueCap });
    }),

  counters: protectedProcedure.query(async ({ ctx }) => {
    assertAdmin(ctx.session?.user.role);
    return service.getPipelineCounters(ctx.db);
  }),

  list: protectedProcedure
    .input(listPipelineSchema)
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role);
      return service.listPipeline(ctx.db, input);
    }),

  byId: protectedProcedure.input(leadIdSchema).query(async ({ ctx, input }) => {
    assertAdmin(ctx.session?.user.role);
    const result = await service.getLead(ctx.db, input.id);
    if (!result) throw new TRPCError({ code: "NOT_FOUND" });
    return result;
  }),

  create: protectedProcedure
    .input(createLeadSchema)
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role);
      return service.createLead(ctx.db, input, ctx.session.user.id);
    }),

  update: protectedProcedure
    .input(updateLeadSchema)
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role);
      await service.updateLead(ctx.db, input, ctx.session.user.id);
      return { updated: true };
    }),

  logActivity: protectedProcedure
    .input(logActivitySchema)
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role);
      return service.logActivity(ctx.db, input, ctx.session.user.id);
    }),

  park: protectedProcedure
    .input(
      z.object({
        leadId: z.string().uuid(),
        reason: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role);
      await service.parkLead(
        ctx.db,
        input.leadId,
        ctx.session.user.id,
        input.reason,
      );
      return { parked: true };
    }),
});
