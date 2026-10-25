import { z } from "zod";

import {
  leadActivityChannelValues,
  leadActivityTypeValues,
  leadPipelineStatusValues,
  leadTierValues,
  socialPlatformValues,
  whatsappStatusValues,
} from "@/drizzle/schema";
import { BULK_ACTION_LIMIT } from "@/features/core/data-table/lib/limits";
import { isPlatformUrl } from "@/features/system/sales/lib/social-profiles";
import type { TodayBuckets } from "@/features/system/sales/lib/today-rules";

/**
 * Typed inputs for every sales operation, defined once and shared by the tRPC
 * router and any future caller (an MCP tool wrapper calls the same service
 * functions with the same schemas). Keeping them out of the router is what
 * makes that possible without a rewrite.
 */

export const pipelineStatusSchema = z.enum(leadPipelineStatusValues);
export const leadTierSchema = z.enum(leadTierValues);
export const whatsappStatusSchema = z.enum(whatsappStatusValues);
export const activityTypeSchema = z.enum(leadActivityTypeValues);
export const activityChannelSchema = z.enum(leadActivityChannelValues);

/** Phones are stored as entered — trimmed only, never reformatted. */
const phoneSchema = z.string().trim().max(32);
const optionalText = z.string().trim().max(4000).optional().nullable();

export const leadIdSchema = z.object({ id: z.string().uuid() });

/**
 * Lead fields without defaults. Defaults belong to creation only: inside
 * `.partial()` zod still applies them, so an update built from the create
 * schema would reset omitted fields (status back to `new`, do-not-contact
 * cleared).
 */
const leadFieldsSchema = z.object({
  name: z.string().trim().min(1).max(255),
  nameAr: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().max(128).optional().nullable(),
  area: z.string().trim().max(255).optional().nullable(),
  address: optionalText,
  phone: phoneSchema.optional().nullable(),
  phoneSecondary: phoneSchema.optional().nullable(),
  whatsappStatus: whatsappStatusSchema,
  whatsappProfileName: z.string().trim().max(255).optional().nullable(),
  tier: leadTierSchema.optional().nullable(),
  socialPlatform: z.string().trim().max(64).optional().nullable(),
  socialHandle: z.string().trim().max(255).optional().nullable(),
  socialFollowers: z.number().int().min(0).optional().nullable(),
  branchCount: z.number().int().min(0).optional().nullable(),
  businessType: z.string().trim().max(255).optional().nullable(),
  sourceUrl: optionalText,
  pipelineStatus: pipelineStatusSchema,
  doNotContact: z.boolean(),
  notes: optionalText,
  ownerId: z.string().uuid().optional().nullable(),
});

export const createLeadSchema = leadFieldsSchema.extend({
  whatsappStatus: whatsappStatusSchema.default("unknown"),
  pipelineStatus: pipelineStatusSchema.default("new"),
  doNotContact: z.boolean().default(false),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = leadFieldsSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

/**
 * Logging an activity. `occurredAt` is optional and defaults to now, but stays
 * editable because calls get logged after the fact.
 *
 * `pipelineStatus` is optional: the quick-log control usually moves the lead on
 * in the same action, and doing both in one transaction is what keeps logging
 * to a single click plus a short form.
 */
export const logActivitySchema = z.object({
  leadId: z.string().uuid(),
  type: activityTypeSchema,
  channel: activityChannelSchema.optional().nullable(),
  occurredAt: z.date().optional(),
  outcome: z.string().trim().max(500).optional().nullable(),
  notes: optionalText,
  nextActionAt: z.date().optional().nullable(),
  pipelineStatus: pipelineStatusSchema.optional(),
});
export type LogActivityInput = z.infer<typeof logActivitySchema>;

/**
 * A scheduled demo is a time on the calendar, and that time is what the
 * Meetings room is provisioned for — without it there is nothing to book.
 */
export const logActivityInputSchema = logActivitySchema.refine(
  (val) => val.type !== "demo_scheduled" || val.nextActionAt != null,
  { message: "demo_time_required", path: ["nextActionAt"] },
);

/**
 * The shared data-table grid shape (same as the users table): column ids in
 * `sorting` and `columnFilters` are interpreted by `server/filters.ts`, which
 * ignores ids it does not know.
 */
export const pipelineFilterSchema = z.object({
  sorting: z
    .array(z.object({ id: z.string().max(64), desc: z.boolean() }))
    .max(8)
    .default([]),
  globalFilter: z.string().max(200).optional(),
  columnFilters: z
    .array(z.object({ id: z.string().max(64), value: z.unknown() }))
    .max(20)
    .default([]),
});
export type PipelineFilterInput = z.infer<typeof pipelineFilterSchema>;

export const listPipelineSchema = pipelineFilterSchema.extend({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
});
export type ListPipelineInput = z.infer<typeof listPipelineSchema>;

/** Statuses a bulk action may set: closing moves only, never a stage jump. */
export const bulkStatusValues = ["parked", "lost"] as const;

export const bulkSetStatusSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(BULK_ACTION_LIMIT),
  status: z.enum(bulkStatusValues),
});
export type BulkSetStatusInput = z.infer<typeof bulkSetStatusSchema>;

export const todayWorkSchema = z.object({
  /** Overrides the daily new-queue cap for this request only. */
  newQueueCap: z.number().int().min(0).max(100).optional(),
});
export type TodayWorkInput = z.infer<typeof todayWorkSchema>;

/**
 * Recording what research found for a lead on one platform. `found` needs the
 * profile link on that platform's own domain; `notFound` records a search that
 * came up empty; `clear` removes a wrong entry. The server stamps `checkedAt`.
 */
/** Largest Postgres `integer`; `socialFollowers` is one. */
const PG_INT_MAX = 2_147_483_647;

const socialProfileTarget = {
  id: z.string().uuid(),
  platform: z.enum(socialPlatformValues),
};
export const setSocialProfileSchema = z
  .discriminatedUnion("status", [
    z.object({
      ...socialProfileTarget,
      status: z.literal("found"),
      url: z.url({ protocol: /^https?$/ }).max(512),
      handle: z.string().trim().min(1).max(255).optional().nullable(),
      followers: z.number().int().min(0).max(PG_INT_MAX).optional().nullable(),
      posts: z.number().int().min(0).max(PG_INT_MAX).optional().nullable(),
      bio: z.string().trim().max(1000).optional().nullable(),
    }),
    z.object({ ...socialProfileTarget, status: z.literal("notFound") }),
    z.object({ ...socialProfileTarget, status: z.literal("clear") }),
  ])
  .refine((input) => input.status !== "found" || isPlatformUrl(input.platform, input.url), {
    message: "url must be a profile link on the chosen platform",
    path: ["url"],
  });
export type SetSocialProfileInput = z.infer<typeof setSocialProfileSchema>;

/**
 * `sales.today`: the buckets plus what the page needs to show progress for the
 * business-local day. Counts are distinct prospect leads.
 */
export type TodayWorkSummary = TodayBuckets & {
  /** Any activity today — parks and status changes included. */
  doneToday: number;
  /** An answered call, a reply, or a demo agreed/booked today. */
  conversationsToday: number;
  demosBookedToday: number;
  /** First contact ever was today: progress toward the daily new-lead cap. */
  newTouchedToday: number;
  /** Open promises falling on the next local day. */
  dueTomorrow: number;
  hasProspects: boolean;
  timeZone: string;
  /** Effective cap: request override, else settings, else the default. */
  newQueueCap: number;
  now: Date;
};
