import { z } from "zod";

import { translationKey } from "@/features/core/i18n/global";
import { blocksArraySchema } from "@/features/system/shared/content-blocks";

export const mediaItemSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["image", "video"]),
  url: z.string().min(1).max(1024),
  title: z.string().max(255).optional().nullable(),
  isFeatured: z.boolean().default(false),
  isSecondary: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

export type MediaItemInput = z.infer<typeof mediaItemSchema>;

const required = translationKey("forms.validation.required");
const max255 = translationKey("forms.validation.max255");

export const caseStudyResultMetricSchema = z.object({
  label: z.string().min(1, required).max(128, max255),
  value: z.string().min(1, required).max(64, max255),
});

export const caseStudyResultMetricArSchema = z.object({
  label: z.string().max(128).default(""),
  value: z.string().max(64).default(""),
});

export const caseStudyMutationSchema = z.object({
  title: z.string().trim().min(1, required).max(255, max255),
  titleAr: z.string().trim().max(255).optional().nullable(),
  slug: z
    .string()
    .trim()
    .min(1, required)
    .max(255, max255)
    .regex(/^[a-z0-9-]+$/, translationKey("forms.validation.slugFormat")),
  client: z.string().trim().min(1, required).max(255, max255),
  clientAr: z.string().trim().max(255).optional().nullable(),
  industry: z.string().trim().min(1, required).max(128, max255),
  industryAr: z.string().trim().max(128).optional().nullable(),
  problemStatement: z.string().trim().min(1, required).max(4000),
  problemStatementAr: z.string().trim().max(4000).optional().nullable(),
  solution: z.string().trim().min(1, required).max(4000),
  solutionAr: z.string().trim().max(4000).optional().nullable(),
  results: z.object({
    metrics: z.array(caseStudyResultMetricSchema).min(1),
    summary: z.string().trim().min(1, required).max(512),
  }),
  resultsAr: z
    .object({
      metrics: z.array(caseStudyResultMetricArSchema),
      summary: z.string().trim().max(512),
    })
    .optional()
    .nullable(),
  coverImageUrl: z.string().max(1024).optional().nullable(),
  liveUrl: z.string().url().max(1024).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  media: z.array(mediaItemSchema).default([]),
  blocks: blocksArraySchema,
});

export const caseStudyUpdateSchema = caseStudyMutationSchema.extend({
  id: z.string().uuid(),
});

export const caseStudyPublishSchema = z.object({
  id: z.string().uuid(),
});

export const caseStudyArchiveSchema = z.object({
  id: z.string().uuid(),
});

export const caseStudyDeleteSchema = z.object({
  id: z.string().uuid(),
});

export const listCaseStudiesInput = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  globalFilter: z.string().optional(),
  status: z
    .enum(["draft", "published", "archived", "all"])
    .optional()
    .default("all"),
  industry: z.string().optional(),
});

export type CaseStudyMutationInput = z.infer<typeof caseStudyMutationSchema>;
export type CaseStudyUpdateInput = z.infer<typeof caseStudyUpdateSchema>;
export type ListCaseStudiesInput = z.infer<typeof listCaseStudiesInput>;
