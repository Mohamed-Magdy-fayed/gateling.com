import { z } from "zod";

import {
  leadActivityChannelValues,
  leadActivityTypeValues,
  leadPipelineStatusValues,
  leadTierValues,
  whatsappStatusValues,
} from "@/drizzle/schema";

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

export const createLeadSchema = z.object({
  name: z.string().trim().min(1).max(255),
  nameAr: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().max(128).optional().nullable(),
  area: z.string().trim().max(255).optional().nullable(),
  address: optionalText,
  phone: phoneSchema.optional().nullable(),
  phoneSecondary: phoneSchema.optional().nullable(),
  whatsappStatus: whatsappStatusSchema.default("unknown"),
  whatsappProfileName: z.string().trim().max(255).optional().nullable(),
  tier: leadTierSchema.optional().nullable(),
  socialPlatform: z.string().trim().max(64).optional().nullable(),
  socialHandle: z.string().trim().max(255).optional().nullable(),
  socialFollowers: z.number().int().min(0).optional().nullable(),
  branchCount: z.number().int().min(0).optional().nullable(),
  businessType: z.string().trim().max(255).optional().nullable(),
  sourceUrl: optionalText,
  pipelineStatus: pipelineStatusSchema.default("new"),
  doNotContact: z.boolean().default(false),
  notes: optionalText,
  ownerId: z.string().uuid().optional().nullable(),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = createLeadSchema.partial().extend({
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

export const listPipelineSchema = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  globalFilter: z.string().optional(),
  pipelineStatus: z
    .union([pipelineStatusSchema, z.literal("all")])
    .default("all"),
  tier: z.union([leadTierSchema, z.literal("all")]).default("all"),
  city: z.string().trim().max(128).optional(),
  whatsappStatus: z
    .union([whatsappStatusSchema, z.literal("all")])
    .default("all"),
});
export type ListPipelineInput = z.infer<typeof listPipelineSchema>;

export const todayWorkSchema = z.object({
  /** Overrides the daily new-queue cap for this request only. */
  newQueueCap: z.number().int().min(0).max(100).optional(),
});
export type TodayWorkInput = z.infer<typeof todayWorkSchema>;
