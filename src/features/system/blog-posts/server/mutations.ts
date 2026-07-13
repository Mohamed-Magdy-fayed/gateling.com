import { TRPCError } from "@trpc/server";
import { and, eq, isNull, ne } from "drizzle-orm";

import {
  BlogPostBlocksTable,
  BlogPostMediaTable,
  BlogPostsTable,
} from "@/drizzle/schema";
import type { MediaItemInput } from "@/features/system/case-studies/server/schemas";
import type { BlockItemInput } from "@/features/system/shared/content-blocks";
import { blogPostPublishedEvent, inngest } from "@/integrations/inngest/client";
import type { BlogPostMutationInput, BlogPostUpdateInput } from "./schemas";
import {
  assertAdminRole,
  getRequiredSession,
  type TRPCContext,
} from "./shared";

type DbOrTx = Parameters<
  Parameters<TRPCContext["db"]["transaction"]>[0]
>[0];

async function upsertBlogPostMedia(
  db: DbOrTx,
  blogPostId: string,
  media: MediaItemInput[],
  actorId: string,
) {
  await db
    .delete(BlogPostMediaTable)
    .where(eq(BlogPostMediaTable.blogPostId, blogPostId));
  if (media.length === 0) return;
  await db.insert(BlogPostMediaTable).values(
    media.map((item, idx) => ({
      blogPostId,
      type: item.type,
      url: item.url,
      title: item.title ?? null,
      isFeatured: item.isFeatured,
      isSecondary: item.isSecondary,
      sortOrder: item.sortOrder ?? idx,
      createdBy: actorId,
    })),
  );
}

async function upsertBlogPostBlocks(
  db: DbOrTx,
  blogPostId: string,
  blocks: BlockItemInput[],
  actorId: string,
) {
  await db
    .delete(BlogPostBlocksTable)
    .where(eq(BlogPostBlocksTable.parentId, blogPostId));
  if (blocks.length === 0) return;
  await db.insert(BlogPostBlocksTable).values(
    blocks.map((item, idx) => ({
      parentId: blogPostId,
      type: item.type,
      sortOrder: item.sortOrder ?? idx,
      contentEn: item.contentEn ?? null,
      contentAr: item.contentAr ?? null,
      data: item.data ?? null,
      mediaId: item.mediaId ?? null,
      createdBy: actorId,
    })),
  );
}

async function assertUniqueSlug(
  ctx: TRPCContext,
  slug: string,
  excludeId?: string,
) {
  const existing = await ctx.db.query.BlogPostsTable.findFirst({
    columns: { id: true },
    where: excludeId
      ? and(
          eq(BlogPostsTable.slug, slug),
          ne(BlogPostsTable.id, excludeId),
          isNull(BlogPostsTable.deletedAt),
        )
      : and(eq(BlogPostsTable.slug, slug), isNull(BlogPostsTable.deletedAt)),
  });
  if (existing)
    throw new TRPCError({
      code: "CONFLICT",
      message: ctx.t("blogPosts.slugDuplicate"),
    });
}

export async function createBlogPost(
  ctx: TRPCContext,
  input: BlogPostMutationInput,
) {
  const session = getRequiredSession(ctx);
  assertAdminRole(session.user.role);
  await assertUniqueSlug(ctx, input.slug);
  const { media, blocks, ...data } = input;
  const id = await ctx.db.transaction(async (tx) => {
    const [row] = await tx
      .insert(BlogPostsTable)
      .values({
        ...data,
        coverImageUrl: data.coverImageUrl ?? null,
        createdBy: session.user.id,
      })
      .returning({ id: BlogPostsTable.id });
    await upsertBlogPostMedia(tx, row.id, media, session.user.id);
    await upsertBlogPostBlocks(tx, row.id, blocks, session.user.id);
    return row.id;
  });
  return { id };
}

export async function updateBlogPost(
  ctx: TRPCContext,
  input: BlogPostUpdateInput,
) {
  const session = getRequiredSession(ctx);
  assertAdminRole(session.user.role);
  await assertUniqueSlug(ctx, input.slug, input.id);
  const { id, media, blocks, ...data } = input;
  await ctx.db.transaction(async (tx) => {
    await tx
      .update(BlogPostsTable)
      .set({
        ...data,
        coverImageUrl: data.coverImageUrl ?? null,
        updatedBy: session.user.id,
      })
      .where(eq(BlogPostsTable.id, id));
    await upsertBlogPostMedia(tx, id, media, session.user.id);
    await upsertBlogPostBlocks(tx, id, blocks, session.user.id);
  });
  return { updated: true };
}

export async function publishBlogPost(ctx: TRPCContext, id: string) {
  const session = getRequiredSession(ctx);
  assertAdminRole(session.user.role);
  const existing = await ctx.db.query.BlogPostsTable.findFirst({
    columns: { id: true, slug: true, publishedAt: true },
    where: and(eq(BlogPostsTable.id, id), isNull(BlogPostsTable.deletedAt)),
  });
  if (!existing)
    throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
  await ctx.db
    .update(BlogPostsTable)
    .set({
      status: "published",
      publishedAt: existing.publishedAt ?? new Date(),
      updatedBy: session.user.id,
    })
    .where(eq(BlogPostsTable.id, id));
  try {
    await inngest.send(
      blogPostPublishedEvent.create({ blogPostId: id, slug: existing.slug }),
    );
  } catch {}
  return { published: true };
}

export async function unpublishBlogPost(ctx: TRPCContext, id: string) {
  const session = getRequiredSession(ctx);
  assertAdminRole(session.user.role);
  await ctx.db
    .update(BlogPostsTable)
    .set({ status: "draft", updatedBy: session.user.id })
    .where(and(eq(BlogPostsTable.id, id), isNull(BlogPostsTable.deletedAt)));
  return { unpublished: true };
}

export async function deleteBlogPost(ctx: TRPCContext, id: string) {
  const session = getRequiredSession(ctx);
  assertAdminRole(session.user.role);
  await ctx.db
    .update(BlogPostsTable)
    .set({ deletedAt: new Date(), deletedBy: session.user.id })
    .where(eq(BlogPostsTable.id, id));
  return { deleted: true };
}
