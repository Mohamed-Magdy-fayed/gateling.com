import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import { DiscoveryContactsTable } from "@/drizzle/schemas/discovery/contacts-table";
import { DiscoveryHypothesesTable } from "@/drizzle/schemas/discovery/hypotheses-table";
import { DiscoveryStudiesTable } from "@/drizzle/schemas/discovery/studies-table";
import { DiscoveryTouchpointsTable } from "@/drizzle/schemas/discovery/touchpoints-table";
import { createdAt, createdBy, id } from "@/drizzle/schemas/helpers";

/** Evidence, not opinions. `compliment` is recorded only so it can be ignored. */
export const discoveryEvidenceKindValues = [
  "incident",
  "workaround_tool",
  "cost_loss",
  "money_commitment",
  "compliment",
  "other_pain",
] as const;
export type DiscoveryEvidenceKind =
  (typeof discoveryEvidenceKindValues)[number];
export const discoveryEvidenceKindEnum = pgEnum(
  "discovery_evidence_kind",
  discoveryEvidenceKindValues,
);

export const discoveryStanceValues = ["supports", "contradicts"] as const;
export type DiscoveryStance = (typeof discoveryStanceValues)[number];
export const discoveryStanceEnum = pgEnum(
  "discovery_stance",
  discoveryStanceValues,
);

export const DiscoveryEvidenceTable = pgTable(
  "discovery_evidence",
  {
    id,
    studyId: uuid()
      .notNull()
      .references(() => DiscoveryStudiesTable.id, { onDelete: "cascade" }),
    contactId: uuid()
      .notNull()
      .references(() => DiscoveryContactsTable.id, { onDelete: "cascade" }),
    touchpointId: uuid().references(() => DiscoveryTouchpointsTable.id, {
      onDelete: "set null",
    }),
    kind: discoveryEvidenceKindEnum().notNull(),
    /** Their exact words, usually Arabic. */
    quote: text().notNull(),
    note: text(),
    amountEgp: integer(),
    createdBy,
    createdAt,
  },
  (table) => [
    index("discovery_evidence_study_idx").on(table.studyId),
    index("discovery_evidence_contact_idx").on(table.contactId),
  ],
);

export const DiscoveryEvidenceHypothesesTable = pgTable(
  "discovery_evidence_hypotheses",
  {
    evidenceId: uuid()
      .notNull()
      .references(() => DiscoveryEvidenceTable.id, { onDelete: "cascade" }),
    hypothesisId: uuid()
      .notNull()
      .references(() => DiscoveryHypothesesTable.id, { onDelete: "cascade" }),
    stance: discoveryStanceEnum().notNull().default("supports"),
  },
  (table) => [primaryKey({ columns: [table.evidenceId, table.hypothesisId] })],
);

export type DiscoveryEvidence = typeof DiscoveryEvidenceTable.$inferSelect;
