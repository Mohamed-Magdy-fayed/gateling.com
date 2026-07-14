import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import {
  createdAt,
  createdBy,
  id,
  updatedAt,
  updatedBy,
} from "@/drizzle/schemas/helpers";
import { BlogPostMediaTable } from "./blog-post-media-table";
import { BlogPostsTable } from "./blog-posts-table";

export const blockTypeValues = [
  "heading",
  "paragraph",
  "list",
  "quote",
  "image",
  "video",
  "gallery",
  "before_after",
  "device_player",
  "stats",
  "comparison",
  "roi_embed",
  "callout",
  "cta",
] as const;
export type BlockType = (typeof blockTypeValues)[number];
export const blockTypeEnum = pgEnum("block_type", blockTypeValues);

export type BlockData = Record<string, unknown>;

export const BlogPostBlocksTable = pgTable(
  "blog_post_blocks",
  {
    id,
    parentId: uuid("parent_id")
      .notNull()
      .references(() => BlogPostsTable.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    type: blockTypeEnum().notNull(),
    contentEn: text("content_en"),
    contentAr: text("content_ar"),
    data: jsonb().$type<BlockData>(),
    mediaId: uuid("media_id").references(() => BlogPostMediaTable.id, {
      onDelete: "set null",
    }),
    createdBy,
    createdAt,
    updatedBy,
    updatedAt,
  },
  (table) => [
    index("blog_post_blocks_parent_sort_idx").on(
      table.parentId,
      table.sortOrder,
    ),
  ],
);

export const blogPostBlocksRelations = relations(
  BlogPostBlocksTable,
  ({ one }) => ({
    blogPost: one(BlogPostsTable, {
      fields: [BlogPostBlocksTable.parentId],
      references: [BlogPostsTable.id],
    }),
    media: one(BlogPostMediaTable, {
      fields: [BlogPostBlocksTable.mediaId],
      references: [BlogPostMediaTable.id],
    }),
  }),
);

export type BlogPostBlock = typeof BlogPostBlocksTable.$inferSelect;
export type NewBlogPostBlock = typeof BlogPostBlocksTable.$inferInsert;
