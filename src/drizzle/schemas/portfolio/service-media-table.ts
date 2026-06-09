import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
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
import { ServicesTable } from "./services-table";

export const mediaTypeValues = ["image", "video"] as const;
export type MediaType = (typeof mediaTypeValues)[number];
export const mediaTypeEnum = pgEnum("media_type", mediaTypeValues);

export const ServiceMediaTable = pgTable(
  "service_media",
  {
    id,
    serviceId: uuid("service_id")
      .notNull()
      .references(() => ServicesTable.id, { onDelete: "cascade" }),
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
    index("service_media_service_idx").on(table.serviceId),
    index("service_media_featured_idx").on(table.serviceId, table.isFeatured),
  ],
);

export const serviceMediaRelations = relations(
  ServiceMediaTable,
  ({ one }) => ({
    service: one(ServicesTable, {
      fields: [ServiceMediaTable.serviceId],
      references: [ServicesTable.id],
    }),
  }),
);

export type ServiceMedia = typeof ServiceMediaTable.$inferSelect;
export type NewServiceMedia = typeof ServiceMediaTable.$inferInsert;
