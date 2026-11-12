import {
  index,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { discoveryChannelEnum } from "@/drizzle/schemas/discovery/enums";
import { createdAt, createdBy, id, updatedAt } from "@/drizzle/schemas/helpers";
import { LeadsTable } from "@/drizzle/schemas/portfolio/leads-table";

export const discoveryContactKindValues = ["person", "business"] as const;
export type DiscoveryContactKind = (typeof discoveryContactKindValues)[number];
export const discoveryContactKindEnum = pgEnum(
  "discovery_contact_kind",
  discoveryContactKindValues,
);

/** Feeds the "does the person you talk to decide?" hypothesis. */
export const discoveryContactRoleValues = [
  "owner",
  "staff",
  "relative",
  "unknown",
] as const;
export type DiscoveryContactRole = (typeof discoveryContactRoleValues)[number];
export const discoveryContactRoleEnum = pgEnum(
  "discovery_contact_role",
  discoveryContactRoleValues,
);

export const DiscoveryContactsTable = pgTable(
  "discovery_contacts",
  {
    id,
    kind: discoveryContactKindEnum().notNull().default("business"),
    displayName: varchar({ length: 255 }).notNull(),
    businessName: varchar({ length: 255 }),
    phone: varchar({ length: 32 }),
    city: varchar({ length: 128 }),
    role: discoveryContactRoleEnum().notNull().default("unknown"),
    /** The only link to Sales: a pointer, never a write. */
    leadId: uuid().references(() => LeadsTable.id, { onDelete: "set null" }),
    notes: text(),
    createdBy,
    createdAt,
    updatedAt,
  },
  (table) => [
    index("discovery_contacts_name_idx").on(table.displayName),
    index("discovery_contacts_lead_idx").on(table.leadId),
  ],
);

/**
 * One identity per channel. `externalId` is the platform's sender id
 * (Meta PSID / IGSID, a WhatsApp number): empty for manual capture, filled
 * by webhook ingest later, which is how an inbound message finds its contact.
 */
export const DiscoveryContactHandlesTable = pgTable(
  "discovery_contact_handles",
  {
    id,
    contactId: uuid()
      .notNull()
      .references(() => DiscoveryContactsTable.id, { onDelete: "cascade" }),
    channel: discoveryChannelEnum().notNull(),
    url: varchar({ length: 2048 }),
    handle: varchar({ length: 255 }),
    externalId: varchar({ length: 255 }),
    createdAt,
  },
  (table) => [
    index("discovery_contact_handles_contact_idx").on(table.contactId),
    index("discovery_contact_handles_url_idx").on(table.url),
    uniqueIndex("discovery_contact_handles_external_uq").on(
      table.channel,
      table.externalId,
    ),
  ],
);

export type DiscoveryContact = typeof DiscoveryContactsTable.$inferSelect;
export type DiscoveryContactHandle =
  typeof DiscoveryContactHandlesTable.$inferSelect;
