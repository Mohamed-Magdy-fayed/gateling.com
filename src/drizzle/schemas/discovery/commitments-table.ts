import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { DiscoveryContactsTable } from "@/drizzle/schemas/discovery/contacts-table";
import { DiscoveryStudiesTable } from "@/drizzle/schemas/discovery/studies-table";
import { createdAt, createdBy, id, updatedAt } from "@/drizzle/schemas/helpers";

/**
 * Money signals, kept apart from talk. `argued_price` (interested, haggling)
 * and `argued_need` (not interested) are the two ways a price test fails.
 */
export const discoveryCommitmentTypeValues = [
  "deposit",
  "pre_order",
  "price_accepted",
  "argued_price",
  "argued_need",
] as const;
export type DiscoveryCommitmentType =
  (typeof discoveryCommitmentTypeValues)[number];
export const discoveryCommitmentTypeEnum = pgEnum(
  "discovery_commitment_type",
  discoveryCommitmentTypeValues,
);

export const discoveryCommitmentStatusValues = [
  "promised",
  "paid",
  "refunded",
  "withdrawn",
] as const;
export type DiscoveryCommitmentStatus =
  (typeof discoveryCommitmentStatusValues)[number];
export const discoveryCommitmentStatusEnum = pgEnum(
  "discovery_commitment_status",
  discoveryCommitmentStatusValues,
);

export const DiscoveryCommitmentsTable = pgTable(
  "discovery_commitments",
  {
    id,
    studyId: uuid()
      .notNull()
      .references(() => DiscoveryStudiesTable.id, { onDelete: "cascade" }),
    contactId: uuid()
      .notNull()
      .references(() => DiscoveryContactsTable.id, { onDelete: "cascade" }),
    type: discoveryCommitmentTypeEnum().notNull(),
    status: discoveryCommitmentStatusEnum().notNull().default("promised"),
    amountEgp: integer(),
    priceQuoted: varchar({ length: 255 }),
    note: text(),
    createdBy,
    createdAt,
    updatedAt,
  },
  (table) => [index("discovery_commitments_study_idx").on(table.studyId)],
);

export type DiscoveryCommitment = typeof DiscoveryCommitmentsTable.$inferSelect;
