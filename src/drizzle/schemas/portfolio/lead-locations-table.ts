import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { id, updatedBy } from "@/drizzle/schemas/helpers";
import { LeadsTable } from "@/drizzle/schemas/portfolio/leads-table";

/**
 * Every Google Maps listing a prospect runs: the main shop plus its branches.
 * A lead's branch count is the number of rows here — there is no separate
 * counter to drift out of step.
 *
 * Filled by hand: the operator pastes the listing's "Embed a map" code (only
 * its `src` is kept, see `lib/maps-embed.ts`) and types the rating, reviews,
 * category and address as they appear on Maps. `checkedAt` says how fresh
 * those numbers are; nothing syncs them.
 */
export const LeadLocationsTable = pgTable(
  "lead_locations",
  {
    id,
    leadId: uuid()
      .notNull()
      .references(() => LeadsTable.id, { onDelete: "cascade" }),
    /** Exactly one per lead (partial unique index below): the main shop. */
    isPrimary: boolean().notNull().default(false),
    name: varchar({ length: 255 }).notNull(),
    address: text(),
    /** Google's category label as shown on the listing, e.g. "Bridal shop". */
    category: varchar({ length: 128 }),
    /** 0–5, one decimal, as Maps shows it. */
    rating: real(),
    reviewCount: integer(),
    lat: doublePrecision(),
    lng: doublePrecision(),
    /** A validated `https://www.google.com/maps/embed?pb=…` URL, never raw HTML. */
    embedSrc: text(),
    checkedAt: timestamp({ withTimezone: true }),
    sortOrder: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
    updatedBy,
  },
  (table) => [
    index("lead_locations_lead_id_idx").on(table.leadId),
    uniqueIndex("lead_locations_one_primary_idx")
      .on(table.leadId)
      .where(sql`${table.isPrimary}`),
  ],
);

export type LeadLocation = typeof LeadLocationsTable.$inferSelect;
export type NewLeadLocation = typeof LeadLocationsTable.$inferInsert;
