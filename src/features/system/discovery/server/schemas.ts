import { z } from "zod";

import {
  discoveryChannelValues,
  discoveryCommitmentStatusValues,
  discoveryCommitmentTypeValues,
  discoveryContactKindValues,
  discoveryContactRoleValues,
  discoveryDirectionValues,
  discoveryEvidenceKindValues,
  discoveryHypothesisMeasureValues,
  discoveryPersonaValues,
  discoverySourceValues,
  discoveryStanceValues,
  discoveryStepValues,
  discoveryStudyStatusValues,
  discoveryTouchpointFormatValues,
  discoveryVerdictValues,
} from "@/drizzle/schema";
import {
  REMOVE_REASON_MAX,
  REMOVE_REASON_MIN,
} from "@/features/system/discovery/lib/remove-reason";

/** Profile and post links only ever point out to http(s). */
const httpUrl = z.url({ protocol: /^https?$/ }).max(2048);
const isoDateTime = z.iso.datetime({ offset: true });
const optionalText = (max: number) => z.string().trim().max(max).optional();

export const idSchema = z.object({ id: z.uuid() });

export const hypothesisInputSchema = z.object({
  code: z.string().trim().min(1).max(16),
  statement: z.string().trim().min(1).max(2000),
  passRule: z.string().trim().min(1).max(2000),
  passThreshold: z.number().int().min(1).max(1000).default(5),
  measure: z
    .enum(discoveryHypothesisMeasureValues)
    .default("supporting_contacts"),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});

export const createStudySchema = z.object({
  title: z.string().trim().min(1).max(255),
  niche: z.string().trim().min(1).max(255),
  problemStatement: z.string().trim().min(1).max(4000),
  priceQuoted: optionalText(255),
  targetConversations: z.number().int().min(1).max(500).optional(),
  goMinCommitments: z.number().int().min(1).max(500).optional(),
  killMinStories: z.number().int().min(1).max(500).optional(),
  hypotheses: z.array(hypothesisInputSchema).max(20).default([]),
});

export const updateStudySchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(255).optional(),
  niche: z.string().trim().min(1).max(255).optional(),
  problemStatement: z.string().trim().min(1).max(4000).optional(),
  step: z.enum(discoveryStepValues).optional(),
  status: z.enum(discoveryStudyStatusValues).optional(),
  priceQuoted: z.string().trim().max(255).nullable().optional(),
  decisionNote: z.string().trim().max(4000).nullable().optional(),
  targetConversations: z.number().int().min(1).max(500).optional(),
  goMinCommitments: z.number().int().min(1).max(500).optional(),
  killMinStories: z.number().int().min(1).max(500).optional(),
});

export const addHypothesisSchema = hypothesisInputSchema.extend({
  studyId: z.uuid(),
});

export const setVerdictSchema = z.object({
  id: z.uuid(),
  verdict: z.enum(discoveryVerdictValues),
});

export const newContactSchema = z.object({
  displayName: z.string().trim().min(1).max(255),
  kind: z.enum(discoveryContactKindValues).optional(),
  businessName: optionalText(255),
  phone: optionalText(32),
  city: optionalText(128),
  role: z.enum(discoveryContactRoleValues).optional(),
  notes: optionalText(4000),
  /** A first handle, usually the profile the message went to. */
  handle: z
    .object({
      channel: z.enum(discoveryChannelValues),
      url: httpUrl.optional(),
      handle: optionalText(255),
    })
    .optional(),
});

export const updateContactSchema = z.object({
  id: z.uuid(),
  displayName: z.string().trim().min(1).max(255).optional(),
  kind: z.enum(discoveryContactKindValues).optional(),
  businessName: z.string().trim().max(255).nullable().optional(),
  phone: z.string().trim().max(32).nullable().optional(),
  city: z.string().trim().max(128).nullable().optional(),
  role: z.enum(discoveryContactRoleValues).optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  leadId: z.uuid().nullable().optional(),
});

export const addHandleSchema = z.object({
  contactId: z.uuid(),
  channel: z.enum(discoveryChannelValues),
  url: httpUrl.optional(),
  handle: optionalText(255),
});

export const searchContactsSchema = z.object({
  query: z.string().trim().max(2048).default(""),
  limit: z.number().int().min(1).max(50).default(8),
});

export const searchLeadsSchema = z.object({
  query: z.string().trim().min(1).max(255),
});

export const logTouchpointSchema = z
  .object({
    studyId: z.uuid(),
    contactId: z.uuid().optional(),
    newContact: newContactSchema.optional(),
    channel: z.enum(discoveryChannelValues),
    format: z.enum(discoveryTouchpointFormatValues).default("dm"),
    direction: z.enum(discoveryDirectionValues).default("outbound"),
    persona: z.enum(discoveryPersonaValues).default("personal"),
    templateId: z.uuid().optional(),
    url: httpUrl.optional(),
    message: optionalText(8000),
    replyText: optionalText(8000),
    replied: z.boolean().default(false),
    /** ISO 8601 with offset. Strings, not Dates: MCP tool schemas are JSON Schema. */
    occurredAt: isoDateTime.optional(),
    repliedAt: isoDateTime.optional(),
    source: z.enum(discoverySourceValues).default("manual"),
    attachments: z.array(httpUrl).max(10).default([]),
  })
  .refine((v) => Boolean(v.contactId) !== Boolean(v.newContact), {
    message: "contact_required",
    path: ["contactId"],
  });

export const markRepliedSchema = z.object({
  id: z.uuid(),
  repliedAt: isoDateTime.optional(),
  replyText: optionalText(8000),
});

/** A removal always says why, so the audit trail explains the recount. */
export const removeTouchpointSchema = z.object({
  id: z.uuid(),
  reason: z
    .string()
    .trim()
    .min(REMOVE_REASON_MIN, "discovery.removeReasonRequired")
    .max(REMOVE_REASON_MAX, "discovery.removeReasonTooLong"),
});

export const studyScopedSchema = z.object({ studyId: z.uuid() });

export const addEvidenceSchema = z.object({
  studyId: z.uuid(),
  contactId: z.uuid(),
  touchpointId: z.uuid().optional(),
  kind: z.enum(discoveryEvidenceKindValues),
  quote: z.string().trim().min(1).max(4000),
  note: optionalText(4000),
  amountEgp: z.number().int().min(0).max(100_000_000).optional(),
  hypotheses: z
    .array(
      z.object({
        hypothesisId: z.uuid(),
        stance: z.enum(discoveryStanceValues).default("supports"),
      }),
    )
    .max(20)
    .default([]),
});

export const logCommitmentSchema = z.object({
  studyId: z.uuid(),
  contactId: z.uuid(),
  type: z.enum(discoveryCommitmentTypeValues),
  status: z.enum(discoveryCommitmentStatusValues).default("promised"),
  amountEgp: z.number().int().min(0).max(100_000_000).optional(),
  priceQuoted: optionalText(255),
  note: optionalText(4000),
});

export const setCommitmentStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(discoveryCommitmentStatusValues),
});

export const templateInputSchema = z.object({
  studyId: z.uuid().nullable().optional(),
  step: z.enum(discoveryStepValues).default("problem"),
  title: z.string().trim().min(1).max(255),
  body: z.string().trim().min(1).max(8000),
  active: z.boolean().default(true),
});

/**
 * Written out, not `templateInputSchema.partial()`: Zod 4 still applies a
 * `.default()` inside `.partial()`, so an update sending only `body` would
 * silently reset `step` to "problem" and `active` to true.
 */
export const updateTemplateSchema = z.object({
  id: z.uuid(),
  studyId: z.uuid().nullable().optional(),
  step: z.enum(discoveryStepValues).optional(),
  title: z.string().trim().min(1).max(255).optional(),
  body: z.string().trim().min(1).max(8000).optional(),
  active: z.boolean().optional(),
});

export const listTemplatesSchema = z.object({
  studyId: z.uuid().optional(),
  includeInactive: z.boolean().default(false),
});

export type CreateStudyInput = z.infer<typeof createStudySchema>;
export type UpdateStudyInput = z.infer<typeof updateStudySchema>;
export type NewContactInput = z.infer<typeof newContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type LogTouchpointInput = z.infer<typeof logTouchpointSchema>;
export type RemoveTouchpointInput = z.infer<typeof removeTouchpointSchema>;
export type AddEvidenceInput = z.infer<typeof addEvidenceSchema>;
export type LogCommitmentInput = z.infer<typeof logCommitmentSchema>;
export type TemplateInput = z.infer<typeof templateInputSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
