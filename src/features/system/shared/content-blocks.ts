import { z } from "zod";

import { blockTypeValues } from "@/drizzle/schema";

/**
 * One zod schema for the ordered `blocks[]` array accepted by both the
 * blogPosts and case-studies mutation schemas. `data` is intentionally a
 * loose JSON bag (validated per-type in the editor UI, not the router) so
 * the 14 block types don't require 14 discriminated server schemas for a
 * v1 authoring surface only admins can reach.
 */
export const blockItemSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(blockTypeValues),
  sortOrder: z.number().int().min(0).default(0),
  contentEn: z.string().max(20000).optional().nullable(),
  contentAr: z.string().max(20000).optional().nullable(),
  data: z.record(z.string(), z.unknown()).optional().nullable(),
  mediaId: z.string().uuid().optional().nullable(),
});

export type BlockItemInput = z.infer<typeof blockItemSchema>;

export const blocksArraySchema = z.array(blockItemSchema).default([]);

/**
 * Client/editor-side typed shape of each block's `data` JSON. Not enforced
 * by zod on the server (see blockItemSchema) — the editor forms are the
 * source of truth for shape, the renderer narrows defensively at read time.
 */
export type BlockDataByType = {
  heading: { level: 1 | 2 | 3 | 4 | 5 | 6 };
  paragraph: Record<string, never>;
  list: {
    ordered: boolean;
    itemsEn: string[];
    itemsAr: string[];
  };
  quote: { citeEn?: string; citeAr?: string };
  image: {
    url: string;
    alt?: string;
    altAr?: string;
    caption?: string;
    captionAr?: string;
  };
  video: {
    url: string;
    poster?: string;
    caption?: string;
    captionAr?: string;
    orientation?: "landscape" | "portrait";
  };
  gallery: {
    items: Array<{
      url: string;
      type: "image" | "video";
      alt?: string;
      caption?: string;
      orientation?: "landscape" | "portrait";
    }>;
  };
  before_after: {
    beforeUrl: string;
    afterUrl: string;
    beforeLabelEn?: string;
    beforeLabelAr?: string;
    afterLabelEn?: string;
    afterLabelAr?: string;
  };
  device_player: {
    device: "phone" | "browser";
    videoUrl: string;
    poster?: string;
  };
  stats: {
    items: Array<{ labelEn: string; labelAr?: string; value: string }>;
  };
  comparison: {
    rows: Array<{
      featureEn: string;
      featureAr?: string;
      manualEn: string;
      manualAr?: string;
      automatedEn: string;
      automatedAr?: string;
    }>;
  };
  roi_embed: {
    /** Keep or remove the "Build This Automation For Us" call-to-action. */
    showCta?: boolean;
    /** Pre-filled starting values, tailored to the business in this work item. */
    teamSize?: number;
    hoursPerWeek?: number;
    hourlyRate?: number;
    currency?: "EGP" | "USD";
  };
  callout: { variant: "info" | "warning" | "success" | "danger" };
  cta: { labelEn: string; labelAr?: string; href: string };
};

export type BlockType = keyof BlockDataByType;

/**
 * Default starting values for the ROI calculator. Shared by the public
 * calculator, the roi_embed editor form, and block defaults so the fallback
 * numbers stay in one place.
 */
export const ROI_CALCULATOR_DEFAULTS = {
  teamSize: 5,
  hoursPerWeek: 10,
  hourlyRate: 100,
  currency: "EGP",
} as const satisfies NonNullable<BlockDataByType["roi_embed"]>;
