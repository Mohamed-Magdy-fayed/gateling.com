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
import { BlogPostsTable } from "./blog-posts-table";
import { mediaTypeEnum } from "./service-media-table";

export const BlogPostMediaTable = pgTable(
  "blog_post_media",
  {
    id,
    blogPostId: uuid("blog_post_id")
      .notNull()
      .references(() => BlogPostsTable.id, { onDelete: "cascade" }),
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
    index("blog_post_media_blog_post_idx").on(table.blogPostId),
    index("blog_post_media_featured_idx").on(
      table.blogPostId,
      table.isFeatured,
    ),
  ],
);

export const blogPostMediaRelations = relations(
  BlogPostMediaTable,
  ({ one }) => ({
    blogPost: one(BlogPostsTable, {
      fields: [BlogPostMediaTable.blogPostId],
      references: [BlogPostsTable.id],
    }),
  }),
);

export type BlogPostMedia = typeof BlogPostMediaTable.$inferSelect;
export type NewBlogPostMedia = typeof BlogPostMediaTable.$inferInsert;
