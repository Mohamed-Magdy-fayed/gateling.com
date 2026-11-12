import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { DiscoveryStudiesTable } from "@/drizzle/schemas/discovery/studies-table";
import { createdAt, id } from "@/drizzle/schemas/helpers";

/**
 * What a hypothesis is measured by:
 * - `supporting_contacts`: distinct contacts with evidence that supports it.
 * - `commitments`: distinct contacts who committed money (H4-style).
 * - `manual`: only the verdict override decides.
 */
export const discoveryHypothesisMeasureValues = [
  "supporting_contacts",
  "commitments",
  "manual",
] as const;
export type DiscoveryHypothesisMeasure =
  (typeof discoveryHypothesisMeasureValues)[number];
export const discoveryHypothesisMeasureEnum = pgEnum(
  "discovery_hypothesis_measure",
  discoveryHypothesisMeasureValues,
);

export const discoveryVerdictValues = ["open", "true", "false"] as const;
export type DiscoveryVerdict = (typeof discoveryVerdictValues)[number];
export const discoveryVerdictEnum = pgEnum(
  "discovery_verdict",
  discoveryVerdictValues,
);

export const DiscoveryHypothesesTable = pgTable(
  "discovery_hypotheses",
  {
    id,
    studyId: uuid()
      .notNull()
      .references(() => DiscoveryStudiesTable.id, { onDelete: "cascade" }),
    code: varchar({ length: 16 }).notNull(),
    statement: text().notNull(),
    passRule: text().notNull(),
    passThreshold: integer().notNull().default(5),
    measure: discoveryHypothesisMeasureEnum()
      .notNull()
      .default("supporting_contacts"),
    /** A person's override; `open` means "let the evidence decide". */
    verdict: discoveryVerdictEnum().notNull().default("open"),
    sortOrder: integer().notNull().default(0),
    createdAt,
  },
  (table) => [index("discovery_hypotheses_study_idx").on(table.studyId)],
);

export type DiscoveryHypothesis = typeof DiscoveryHypothesesTable.$inferSelect;
