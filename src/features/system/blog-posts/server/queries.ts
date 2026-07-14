import { and, asc, count, desc, eq, ilike, isNull, or } from "drizzle-orm";

import {
  BlogPostBlocksTable,
  BlogPostMediaTable,
  BlogPostsTable,
} from "@/drizzle/schema";
import type { ListBlogPostsInput } from "./schemas";
import {
  assertAdminRole,
  getRequiredSession,
  type TRPCContext,
} from "./shared";

export async function listPublishedBlogPosts(ctx: TRPCContext) {
  return ctx.db.query.BlogPostsTable.findMany({
    where: and(
      eq(BlogPostsTable.status, "published"),
      isNull(BlogPostsTable.deletedAt),
    ),
    columns: {
      id: true,
      title: true,
      titleAr: true,
      slug: true,
      excerpt: true,
      excerptAr: true,
      authorName: true,
      authorNameAr: true,
      tags: true,
      tagsAr: true,
      publishedAt: true,
      coverImageUrl: true,
      content: true,
    },
    with: { media: { orderBy: [asc(BlogPostMediaTable.sortOrder)] } },
    orderBy: [desc(BlogPostsTable.publishedAt)],
  });
}

export async function getBlogPostById(ctx: TRPCContext, id: string) {
  return ctx.db.query.BlogPostsTable.findFirst({
    where: and(eq(BlogPostsTable.id, id), isNull(BlogPostsTable.deletedAt)),
    with: {
      media: { orderBy: [asc(BlogPostMediaTable.sortOrder)] },
      blocks: { orderBy: [asc(BlogPostBlocksTable.sortOrder)] },
    },
  });
}

export async function getPublishedBlogPostBySlug(
  ctx: TRPCContext,
  slug: string,
) {
  return ctx.db.query.BlogPostsTable.findFirst({
    where: and(
      eq(BlogPostsTable.slug, slug),
      eq(BlogPostsTable.status, "published"),
      isNull(BlogPostsTable.deletedAt),
    ),
    with: {
      media: { orderBy: [asc(BlogPostMediaTable.sortOrder)] },
      blocks: { orderBy: [asc(BlogPostBlocksTable.sortOrder)] },
    },
  });
}

export async function listBlogPosts(
  ctx: TRPCContext,
  input: ListBlogPostsInput,
) {
  const session = getRequiredSession(ctx);
  assertAdminRole(session.user.role);

  const conditions = [isNull(BlogPostsTable.deletedAt)];
  if (input.status && input.status !== "all") {
    conditions.push(eq(BlogPostsTable.status, input.status));
  }
  if (input.globalFilter?.trim()) {
    const like = `%${input.globalFilter.trim()}%`;
    conditions.push(
      or(
        ilike(BlogPostsTable.title, like),
        ilike(BlogPostsTable.excerpt, like),
      ) ?? isNull(BlogPostsTable.deletedAt),
    );
  }

  const where = and(...conditions);
  const [{ total }] = await ctx.db
    .select({ total: count() })
    .from(BlogPostsTable)
    .where(where);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);
  const offset = (page - 1) * input.perPage;

  const firstSort = input.sorting[0];
  const orderBy =
    firstSort?.id === "createdAt"
      ? [
          firstSort.desc
            ? desc(BlogPostsTable.createdAt)
            : asc(BlogPostsTable.createdAt),
        ]
      : [desc(BlogPostsTable.createdAt)];

  const rows = await ctx.db
    .select({
      id: BlogPostsTable.id,
      title: BlogPostsTable.title,
      titleAr: BlogPostsTable.titleAr,
      slug: BlogPostsTable.slug,
      excerpt: BlogPostsTable.excerpt,
      excerptAr: BlogPostsTable.excerptAr,
      contentAr: BlogPostsTable.contentAr,
      authorName: BlogPostsTable.authorName,
      authorNameAr: BlogPostsTable.authorNameAr,
      tags: BlogPostsTable.tags,
      tagsAr: BlogPostsTable.tagsAr,
      status: BlogPostsTable.status,
      publishedAt: BlogPostsTable.publishedAt,
      coverImageUrl: BlogPostsTable.coverImageUrl,
      createdAt: BlogPostsTable.createdAt,
      updatedAt: BlogPostsTable.updatedAt,
    })
    .from(BlogPostsTable)
    .where(where)
    .orderBy(...orderBy)
    .limit(input.perPage)
    .offset(offset);

  return { rows, pageCount, total: Number(total) };
}
