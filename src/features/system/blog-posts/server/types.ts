import type { BlogPost } from "@/drizzle/schema";

export type BlogPostRow = Pick<
  BlogPost,
  | "id"
  | "title"
  | "titleAr"
  | "slug"
  | "excerpt"
  | "excerptAr"
  | "contentAr"
  | "authorName"
  | "tags"
  | "status"
  | "publishedAt"
  | "coverImageUrl"
  | "createdAt"
  | "updatedAt"
>;
