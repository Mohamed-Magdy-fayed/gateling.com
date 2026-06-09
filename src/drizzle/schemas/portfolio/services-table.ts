import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  varchar,
} from "drizzle-orm/pg-core";

import {
  createdAt,
  createdBy,
  deletedAt,
  deletedBy,
  id,
  updatedAt,
  updatedBy,
} from "@/drizzle/schemas/helpers";
import { ServiceMediaTable } from "./service-media-table";

export const ServicesTable = pgTable(
  "services",
  {
    id,
    title: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull().unique(),
    shortDescription: varchar({ length: 512 }).notNull(),
    fullDescription: varchar({ length: 2048 }),
    titleAr: varchar({ length: 255 }),
    shortDescriptionAr: varchar({ length: 512 }),
    fullDescriptionAr: varchar({ length: 2048 }),
    featuresAr: jsonb().$type<string[]>(),
    icon: varchar({ length: 64 }).notNull().default("Zap"),
    features: jsonb().$type<string[]>().notNull().default([]),
    coverImageUrl: varchar({ length: 1024 }),
    sortOrder: integer().notNull().default(0),
    isActive: boolean().notNull().default(true),
    createdBy,
    createdAt,
    updatedBy,
    updatedAt,
    deletedBy,
    deletedAt,
  },
  (table) => [index("services_active_idx").on(table.isActive)],
);

export const servicesRelations = relations(ServicesTable, ({ many }) => ({
  media: many(ServiceMediaTable),
}));

export type Service = typeof ServicesTable.$inferSelect;
export type NewService = typeof ServicesTable.$inferInsert;
