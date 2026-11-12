import {
  boolean,
  index,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { discoveryStepEnum } from "@/drizzle/schemas/discovery/enums";
import { DiscoveryStudiesTable } from "@/drizzle/schemas/discovery/studies-table";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";

/** Outreach messages per step. Question-first, never a pitch. */
export const DiscoveryTemplatesTable = pgTable(
  "discovery_templates",
  {
    id,
    /** Null = reusable across studies. */
    studyId: uuid().references(() => DiscoveryStudiesTable.id, {
      onDelete: "cascade",
    }),
    step: discoveryStepEnum().notNull().default("problem"),
    title: varchar({ length: 255 }).notNull(),
    body: text().notNull(),
    active: boolean().notNull().default(true),
    createdAt,
    updatedAt,
  },
  (table) => [index("discovery_templates_study_idx").on(table.studyId)],
);

export type DiscoveryTemplate = typeof DiscoveryTemplatesTable.$inferSelect;
