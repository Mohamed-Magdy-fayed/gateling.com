import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { DiscoveryContactsTable } from "@/drizzle/schemas/discovery/contacts-table";
import {
  discoveryChannelEnum,
  discoveryPersonaEnum,
} from "@/drizzle/schemas/discovery/enums";
import { DiscoveryStudiesTable } from "@/drizzle/schemas/discovery/studies-table";
import { DiscoveryTemplatesTable } from "@/drizzle/schemas/discovery/templates-table";
import { createdAt, createdBy, id } from "@/drizzle/schemas/helpers";
import { WebhookEventsTable } from "@/drizzle/schemas/system/webhook-events-table";

export const discoveryTouchpointFormatValues = [
  "dm",
  "comment",
  "post",
  "call",
  "meeting",
  "voice_note",
] as const;
export type DiscoveryTouchpointFormat =
  (typeof discoveryTouchpointFormatValues)[number];
export const discoveryTouchpointFormatEnum = pgEnum(
  "discovery_touchpoint_format",
  discoveryTouchpointFormatValues,
);

export const discoveryDirectionValues = ["outbound", "inbound"] as const;
export type DiscoveryDirection = (typeof discoveryDirectionValues)[number];
export const discoveryDirectionEnum = pgEnum(
  "discovery_direction",
  discoveryDirectionValues,
);

/** How the row got here. `meta_webhook` is reserved for the later ingest. */
export const discoverySourceValues = [
  "manual",
  "share",
  "paste",
  "mcp",
  "meta_webhook",
] as const;
export type DiscoverySource = (typeof discoverySourceValues)[number];
export const discoverySourceEnum = pgEnum(
  "discovery_source",
  discoverySourceValues,
);

/**
 * Every message, comment, call or meeting with a contact, on any channel.
 * Reply time is `repliedAt - occurredAt` on an outbound row.
 */
export const DiscoveryTouchpointsTable = pgTable(
  "discovery_touchpoints",
  {
    id,
    studyId: uuid()
      .notNull()
      .references(() => DiscoveryStudiesTable.id, { onDelete: "cascade" }),
    contactId: uuid()
      .notNull()
      .references(() => DiscoveryContactsTable.id, { onDelete: "cascade" }),
    channel: discoveryChannelEnum().notNull(),
    format: discoveryTouchpointFormatEnum().notNull().default("dm"),
    direction: discoveryDirectionEnum().notNull().default("outbound"),
    persona: discoveryPersonaEnum().notNull().default("personal"),
    templateId: uuid().references(() => DiscoveryTemplatesTable.id, {
      onDelete: "set null",
    }),
    url: varchar({ length: 2048 }),
    message: text(),
    /** Their answer, when it was captured together with the outbound message. */
    replyText: text(),
    occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    repliedAt: timestamp({ withTimezone: true }),
    source: discoverySourceEnum().notNull().default("manual"),
    externalId: varchar({ length: 255 }),
    webhookEventId: uuid().references(() => WebhookEventsTable.id, {
      onDelete: "set null",
    }),
    attachments: jsonb().$type<string[]>().notNull().default([]),
    createdBy,
    createdAt,
    /**
     * Soft removal of a wrongly logged row (e.g. a call that only reached
     * staff). The row stays for the audit trail but counts nowhere: not in
     * readouts, reply stats, lists or the reply matching.
     */
    removedAt: timestamp({ withTimezone: true }),
    removedBy: varchar(),
    removedReason: text(),
  },
  (table) => [
    index("discovery_touchpoints_study_idx").on(
      table.studyId,
      table.occurredAt,
    ),
    index("discovery_touchpoints_contact_idx").on(
      table.contactId,
      table.occurredAt,
    ),
    uniqueIndex("discovery_touchpoints_external_uq").on(
      table.source,
      table.externalId,
    ),
  ],
);

export type DiscoveryTouchpoint = typeof DiscoveryTouchpointsTable.$inferSelect;
