import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import {
  createdAt,
  createdBy,
  id,
  updatedAt,
  updatedBy,
} from "@/drizzle/schemas/helpers";
import { CaseStudiesTable } from "./case-studies-table";
import { mediaTypeEnum } from "./service-media-table";

export const CaseStudyMediaTable = pgTable(
  "case_study_media",
  {
    id,
    caseStudyId: uuid("case_study_id")
      .notNull()
      .references(() => CaseStudiesTable.id, { onDelete: "cascade" }),
    type: mediaTypeEnum().notNull().default("image"),
    url: varchar({ length: 1024 }).notNull(),
    title: varchar({ length: 255 }),
    isFeatured: boolean("is_featured").notNull().default(false),
    isSecondary: boolean("is_secondary").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdBy,
    createdAt,
    updatedBy,
    updatedAt,
  },
  (table) => [
    index("case_study_media_case_study_idx").on(table.caseStudyId),
    index("case_study_media_featured_idx").on(
      table.caseStudyId,
      table.isFeatured,
    ),
  ],
);

export const caseStudyMediaRelations = relations(
  CaseStudyMediaTable,
  ({ one }) => ({
    caseStudy: one(CaseStudiesTable, {
      fields: [CaseStudyMediaTable.caseStudyId],
      references: [CaseStudiesTable.id],
    }),
  }),
);

export type CaseStudyMedia = typeof CaseStudyMediaTable.$inferSelect;
export type NewCaseStudyMedia = typeof CaseStudyMediaTable.$inferInsert;
