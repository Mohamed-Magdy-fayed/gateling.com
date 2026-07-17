import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { UsersTable } from "@/drizzle/schemas/auth/users-table";
import {
  createdAt,
  createdBy,
  deletedAt,
  deletedBy,
  id,
  updatedAt,
  updatedBy,
} from "@/drizzle/schemas/helpers";
import { CaseStudyBlocksTable } from "./case-study-blocks-table";
import { CaseStudyMediaTable } from "./case-study-media-table";
import { TestimonialsTable } from "./testimonials-table";

export const caseStudyStatusValues = [
  "draft",
  "published",
  "archived",
] as const;
export type CaseStudyStatus = (typeof caseStudyStatusValues)[number];
export const caseStudyStatusEnum = pgEnum(
  "case_study_status",
  caseStudyStatusValues,
);

export type CaseStudyResults = {
  metrics: Array<{ label: string; value: string }>;
  summary: string;
};

export const CaseStudiesTable = pgTable(
  "case_studies",
  {
    id,
    title: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull().unique(),
    client: varchar({ length: 255 }).notNull(),
    industry: varchar({ length: 128 }).notNull(),
    problemStatement: text().notNull(),
    solution: text().notNull(),
    results: jsonb().$type<CaseStudyResults>().notNull(),
    titleAr: varchar({ length: 255 }),
    clientAr: varchar({ length: 255 }),
    industryAr: varchar({ length: 128 }),
    problemStatementAr: text(),
    solutionAr: text(),
    resultsAr: jsonb().$type<CaseStudyResults>(),
    coverImageUrl: varchar({ length: 1024 }),
    liveUrl: varchar({ length: 1024 }),
    status: caseStudyStatusEnum().notNull().default("draft"),
    publishedAt: timestamp({ withTimezone: true }),
    sortOrder: integer().notNull().default(0),
    // The client's login account, used to request feedback (WhatsApp magic link).
    clientUserId: uuid("client_user_id").references(() => UsersTable.id, {
      onDelete: "set null",
    }),
    createdBy,
    createdAt,
    updatedBy,
    updatedAt,
    deletedBy,
    deletedAt,
  },
  (table) => [
    index("case_studies_status_idx").on(table.status),
    index("case_studies_slug_idx").on(table.slug),
    index("case_studies_client_user_idx").on(table.clientUserId),
  ],
);

export const caseStudiesRelations = relations(
  CaseStudiesTable,
  ({ many, one }) => ({
    testimonials: many(TestimonialsTable),
    media: many(CaseStudyMediaTable),
    blocks: many(CaseStudyBlocksTable),
    clientUser: one(UsersTable, {
      fields: [CaseStudiesTable.clientUserId],
      references: [UsersTable.id],
    }),
  }),
);

export type CaseStudy = typeof CaseStudiesTable.$inferSelect;
export type NewCaseStudy = typeof CaseStudiesTable.$inferInsert;
