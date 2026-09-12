import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { UsersTable } from "@/drizzle/schemas/auth/users-table";
import { id, updatedBy } from "@/drizzle/schemas/helpers";

/**
 * This table holds two kinds of record, told apart by `kind`:
 *
 * - `inbound`  — public contact-form submissions. Owns `email`, `message`,
 *   `status`, and the UTM columns. Surfaced at `/leads`.
 * - `prospect` — outbound sales prospects worked from `/sales/today`. Owns
 *   `pipelineStatus` and everything from `nameAr` down. Surfaced at `/sales`.
 *
 * The two share a table by decision (one prospect record type, one place to
 * look) but deliberately do NOT share a status column: `lead_status` speaks the
 * contact-form vocabulary (`qualified`, `closed`) and `lead_pipeline_status`
 * speaks the outbound one. Keeping them apart means the contact form and the
 * `/leads` screen are entirely unaffected by pipeline work.
 *
 * `email` and `message` are nullable because prospects have neither — the
 * contact-form Zod schema still requires both at the boundary.
 */

export const leadKindValues = ["inbound", "prospect"] as const;
export type LeadKind = (typeof leadKindValues)[number];
export const leadKindEnum = pgEnum("lead_kind", leadKindValues);

/** Contact-form lifecycle. Applies to `kind = 'inbound'` rows. */
export const leadStatusValues = [
  "new",
  "contacted",
  "qualified",
  "closed",
] as const;
export type LeadStatus = (typeof leadStatusValues)[number];
export const leadStatusEnum = pgEnum("lead_status", leadStatusValues);

/** Outbound sales pipeline. Applies to `kind = 'prospect'` rows. */
export const leadPipelineStatusValues = [
  "new",
  "contacted",
  "awaiting_reply",
  "callback_scheduled",
  "demo_agreed",
  "demo_scheduled",
  "demo_done",
  "won",
  "lost",
  "parked",
  "blocked_no_number",
] as const;
export type LeadPipelineStatus = (typeof leadPipelineStatusValues)[number];
export const leadPipelineStatusEnum = pgEnum(
  "lead_pipeline_status",
  leadPipelineStatusValues,
);

export const whatsappStatusValues = [
  "confirmed",
  "not_confirmed",
  "unknown",
] as const;
export type WhatsappStatus = (typeof whatsappStatusValues)[number];
export const whatsappStatusEnum = pgEnum(
  "whatsapp_status",
  whatsappStatusValues,
);

/** Business size band. `A` is largest — the new queue is ordered A → C. */
export const leadTierValues = ["A", "B", "C"] as const;
export type LeadTier = (typeof leadTierValues)[number];
export const leadTierEnum = pgEnum("lead_tier", leadTierValues);

export const LeadsTable = pgTable(
  "leads",
  {
    id,
    kind: leadKindEnum().notNull().default("inbound"),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 256 }),
    company: varchar({ length: 255 }),
    /**
     * The primary phone for both kinds. The CSV's `phone_primary` maps here.
     * Stored exactly as entered — never normalised destructively, because a
     * mis-normalised Egyptian mobile is an un-callable lead.
     */
    phone: varchar({ length: 32 }),
    message: text(),
    status: leadStatusEnum().notNull().default("new"),
    source: varchar({ length: 128 }).default("contact-form"),
    utmSource: varchar({ length: 255 }),
    utmMedium: varchar({ length: 255 }),
    utmCampaign: varchar({ length: 255 }),
    utmContent: varchar({ length: 255 }),
    referrer: varchar({ length: 512 }),
    ipAddress: varchar({ length: 64 }),

    // ─── Sales pipeline (kind = 'prospect') ──────────────────────────────
    pipelineStatus: leadPipelineStatusEnum().notNull().default("new"),
    nameAr: varchar({ length: 255 }),
    city: varchar({ length: 128 }),
    area: varchar({ length: 255 }),
    address: text(),
    phoneSecondary: varchar({ length: 32 }),
    whatsappStatus: whatsappStatusEnum().notNull().default("unknown"),
    /** Public WhatsApp display name, used to verify identity before outreach. */
    whatsappProfileName: varchar({ length: 255 }),
    tier: leadTierEnum(),
    socialPlatform: varchar({ length: 64 }),
    socialHandle: varchar({ length: 255 }),
    socialFollowers: integer(),
    branchCount: integer(),
    /** Free text for now: rental / sale / both. */
    businessType: varchar({ length: 255 }),
    sourceUrl: text(),
    doNotContact: boolean().notNull().default(false),
    notes: text(),
    ownerId: uuid().references(() => UsersTable.id, { onDelete: "set null" }),

    // ─── Demo meeting (prospects) ───────────────────────────────────────────
    // One live demo room per lead, provisioned on Gateling Meetings when a
    // `demo_scheduled` activity is logged (externalRef `lead:<id>:demo`); a
    // later `demo_scheduled` reschedules the same room. Lives here, not on
    // `lead_activities`, because that log is append-only.
    demoMeetingCode: varchar({ length: 12 }),
    demoMeetingUrl: text(),

    // ─── Derived cache (recomputed from lead_activities, never hand-edited) ──
    // Written only by `recomputeLeadDerived()` in the sales service layer.
    // Treat as read-only everywhere else: the activity log is the truth.
    /** Latest `occurredAt` among contact-type activities. */
    lastContactedAt: timestamp({ withTimezone: true }),
    /** `whatsapp_sent` + `call` count since the last inbound reply. */
    followUpCount: integer().notNull().default(0),
    /** Earliest unfulfilled `nextActionAt` across the lead's activities. */
    nextActionAt: timestamp({ withTimezone: true }),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
    updatedBy,
  },
  (table) => [
    index("leads_status_idx").on(table.status),
    index("leads_created_at_idx").on(table.createdAt),
    index("leads_email_idx").on(table.email),
    // The Today view filters on kind + pipelineStatus on every load.
    index("leads_kind_pipeline_status_idx").on(
      table.kind,
      table.pipelineStatus,
    ),
    index("leads_next_action_at_idx").on(table.nextActionAt),
    index("leads_last_contacted_at_idx").on(table.lastContactedAt),
    // Backs the importer's (name, phone) idempotency probe and phone search.
    index("leads_phone_idx").on(table.phone),
  ],
);

export type Lead = typeof LeadsTable.$inferSelect;
export type NewLead = typeof LeadsTable.$inferInsert;
