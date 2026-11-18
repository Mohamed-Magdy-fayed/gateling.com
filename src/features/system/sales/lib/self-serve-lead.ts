import { z } from "zod";

import type { NewLead } from "@/drizzle/schema";

/**
 * Self-serve signup leads. The Atelier system's /try page collects a short
 * questionnaire and its server forwards it here (`/api/leads/self-serve`).
 * Pure parsing and mapping lives in this file so it can be unit tested without
 * a database; the route handles auth, rate limits and the insert.
 */

export const SELF_SERVE_SOURCE = "self-serve";

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  text(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const selfServeLeadSchema = z.object({
  ownerName: text(255).min(1),
  phone: text(32).min(6),
  atelierName: text(255).min(1),
  city: optionalText(128),
  branches: optionalText(64),
  dressVolume: optionalText(64),
  currentTool: optionalText(255),
  biggestPain: optionalText(1000),
  priceReaction: optionalText(255),
  locale: z.enum(["ar", "en"]).default("ar"),
  consent: z.literal(true),
  /** Honeypot: hidden on the form, so only bots fill it. */
  website: z.string().optional().nullable(),
});
export type SelfServeLeadInput = z.infer<typeof selfServeLeadSchema>;

/** A filled honeypot means a bot; the route accepts and drops it silently. */
export function isHoneypotFilled(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const value = (body as { website?: unknown }).website;
  return typeof value === "string" && value.trim() !== "";
}

/** Notes shown on the lead page: the answers in the order the owner gave them. */
export function formatSelfServeNotes(input: SelfServeLeadInput): string {
  const rows: Array<[string, string | null]> = [
    ["Owner", input.ownerName],
    ["Branches", input.branches],
    ["Dresses", input.dressVolume],
    ["Current tool", input.currentTool],
    ["Biggest pain", input.biggestPain],
    ["Price reaction", input.priceReaction],
    ["Locale", input.locale],
  ];
  return rows
    .filter((row): row is [string, string] => row[1] != null)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

/**
 * The `leads` row for a self-serve signup. It is a prospect (so it lands in
 * the sales queue) tagged `source = self-serve`. The phone is the number the
 * owner gave as WhatsApp, because that is how we answer.
 */
export function toSelfServeLeadRow(
  input: SelfServeLeadInput,
  ipAddress: string | null,
): NewLead {
  return {
    kind: "prospect",
    name: input.atelierName,
    nameAr: input.locale === "ar" ? input.atelierName : null,
    phone: input.phone,
    whatsappPhone: input.phone,
    whatsappStatus: "unknown",
    city: input.city,
    businessType: "dress atelier",
    source: SELF_SERVE_SOURCE,
    notes: formatSelfServeNotes(input),
    pipelineStatus: "new",
    ipAddress,
    updatedBy: SELF_SERVE_SOURCE,
  };
}
