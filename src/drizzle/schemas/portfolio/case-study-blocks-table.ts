import { relations } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

import {
  createdAt,
  createdBy,
  id,
  updatedAt,
  updatedBy,
} from "@/drizzle/schemas/helpers";
import { blockTypeEnum, type BlockData } from "./blog-post-blocks-table";
import { CaseStudiesTable } from "./case-studies-table";
import { CaseStudyMediaTable } from "./case-study-media-table";

export const CaseStudyBlocksTable = pgTable(
  "case_study_blocks",
  {
    id,
    parentId: uuid("parent_id")
      .notNull()
      .references(() => CaseStudiesTable.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    type: blockTypeEnum().notNull(),
    contentEn: text("content_en"),
    contentAr: text("content_ar"),
    data: jsonb().$type<BlockData>(),
    mediaId: uuid("media_id").references(() => CaseStudyMediaTable.id, {
      onDelete: "set null",
    }),
    createdBy,
    createdAt,
    updatedBy,
    updatedAt,
  },
  (table) => [
    index("case_study_blocks_parent_sort_idx").on(
      table.parentId,
      table.sortOrder,
    ),
  ],
);

export const caseStudyBlocksRelations = relations(
  CaseStudyBlocksTable,
  ({ one }) => ({
    caseStudy: one(CaseStudiesTable, {
      fields: [CaseStudyBlocksTable.parentId],
      references: [CaseStudiesTable.id],
    }),
    media: one(CaseStudyMediaTable, {
      fields: [CaseStudyBlocksTable.mediaId],
      references: [CaseStudyMediaTable.id],
    }),
  }),
);

export type CaseStudyBlock = typeof CaseStudyBlocksTable.$inferSelect;
export type NewCaseStudyBlock = typeof CaseStudyBlocksTable.$inferInsert;
