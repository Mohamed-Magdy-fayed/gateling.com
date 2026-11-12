import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";

import {
  discoveryStepEnum,
  discoveryStudyStatusEnum,
} from "@/drizzle/schemas/discovery/enums";
import { createdAt, createdBy, id, updatedAt } from "@/drizzle/schemas/helpers";

/**
 * One niche plus one problem. The decision thresholds live on the row so a
 * study's readout is reproducible even if the defaults change later.
 */
export const DiscoveryStudiesTable = pgTable("discovery_studies", {
  id,
  title: varchar({ length: 255 }).notNull(),
  niche: varchar({ length: 255 }).notNull(),
  problemStatement: text().notNull(),
  /** Moved by a person only; the readout merely suggests the next step. */
  step: discoveryStepEnum().notNull().default("problem"),
  status: discoveryStudyStatusEnum().notNull().default("active"),
  targetConversations: integer().notNull().default(10),
  goMinCommitments: integer().notNull().default(3),
  killMinStories: integer().notNull().default(3),
  /** One price for the first batch of calls, so the answers are comparable. */
  priceQuoted: varchar({ length: 255 }),
  decisionNote: text(),
  createdBy,
  createdAt,
  updatedAt,
});

export type DiscoveryStudy = typeof DiscoveryStudiesTable.$inferSelect;
export type NewDiscoveryStudy = typeof DiscoveryStudiesTable.$inferInsert;
