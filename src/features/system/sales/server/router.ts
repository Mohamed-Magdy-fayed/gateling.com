import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "@/env/server";
import { resolveMeetingsClient } from "@/features/system/meetings/config";
import { getWebsiteMeetingHost } from "@/features/system/meetings/host";
import { inngest, leadDemoScheduledEvent } from "@/integrations/inngest/client";
import { createTRPCRouter, protectedProcedure } from "@/integrations/trpc/init";

import { getLeadDemoMeetingCode, leadDemoHostJoinLink } from "./meeting";
import {
  createLeadSchema,
  leadIdSchema,
  listPipelineSchema,
  logActivityInputSchema,
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
    .input(logActivityInputSchema)
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role);
      const result = await service.logActivity(
        ctx.db,
        input,
        ctx.session.user.id,
      );
      // A scheduled demo gets a Meetings room, provisioned in the background
      // (external HTTP never runs inline). Non-fatal: the log is the truth.
      if (input.type === "demo_scheduled" && input.nextActionAt) {
        try {
          await inngest.send(
            leadDemoScheduledEvent.create({
              leadId: input.leadId,
              activityId: result.activityId,
              scheduledAt: input.nextActionAt.toISOString(),
            }),
          );
        } catch (error) {
          // The activity is saved; only the room is missing. Logged so a
          // permanently "pending" demo card can be traced to its cause.
          console.warn("lead/demo-scheduled send failed", {
            leadId: input.leadId,
            activityId: result.activityId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      return result;
    }),

  /** Single-use host link for the lead's demo room — minted per click, never stored. */
  demoHostJoinLink: protectedProcedure
    .input(leadIdSchema)
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role);
      const meetingCode = await getLeadDemoMeetingCode(ctx.db, input.id);
      if (meetingCode === undefined) throw new TRPCError({ code: "NOT_FOUND" });
      if (!meetingCode)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "no_meeting",
        });
      const client = await resolveMeetingsClient(ctx.db);
      if (!client)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "meetings_not_configured",
        });
      const link = await leadDemoHostJoinLink(
        client,
        meetingCode,
        await getWebsiteMeetingHost(ctx.db),
        `${env.BASE_URL}/sales/leads/${input.id}`,
      );
      // Audit: the only record of which person hosted which prospect's demo.
      console.info("meetings.host_link_minted", {
        userId: ctx.session.user.id,
        leadId: input.id,
        meetingCode,
      });
      return { url: link.url, expiresAt: link.expiresAt };
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
