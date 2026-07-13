import { TRPCError } from "@trpc/server";
import { and, eq, isNull, ne } from "drizzle-orm";

import {
  CaseStudiesTable,
  CaseStudyBlocksTable,
  CaseStudyMediaTable,
} from "@/drizzle/schema";
import type { BlockItemInput } from "@/features/system/shared/content-blocks";
import {
  caseStudyPublishedEvent,
  inngest,
} from "@/integrations/inngest/client";
import type {
  CaseStudyMutationInput,
  CaseStudyUpdateInput,
  MediaItemInput,
} from "./schemas";
import {
  assertAdminRole,
  getRequiredSession,
  type TRPCContext,
} from "./shared";

type DbOrTx = Parameters<
  Parameters<TRPCContext["db"]["transaction"]>[0]
>[0];

async function upsertCaseStudyMedia(
  db: DbOrTx,
  caseStudyId: string,
  media: MediaItemInput[],
  actorId: string,
) {
  await db
    .delete(CaseStudyMediaTable)
    .where(eq(CaseStudyMediaTable.caseStudyId, caseStudyId));
  if (media.length === 0) return;
  await db.insert(CaseStudyMediaTable).values(
    media.map((item, idx) => ({
      caseStudyId,
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

async function upsertCaseStudyBlocks(
  db: DbOrTx,
  caseStudyId: string,
  blocks: BlockItemInput[],
  actorId: string,
) {
  await db
    .delete(CaseStudyBlocksTable)
    .where(eq(CaseStudyBlocksTable.parentId, caseStudyId));
  if (blocks.length === 0) return;
  await db.insert(CaseStudyBlocksTable).values(
    blocks.map((item, idx) => ({
      parentId: caseStudyId,
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
  const existing = await ctx.db.query.CaseStudiesTable.findFirst({
    columns: { id: true },
    where: excludeId
      ? and(
          eq(CaseStudiesTable.slug, slug),
          ne(CaseStudiesTable.id, excludeId),
          isNull(CaseStudiesTable.deletedAt),
        )
      : and(
          eq(CaseStudiesTable.slug, slug),
          isNull(CaseStudiesTable.deletedAt),
        ),
  });
  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: ctx.t("work.slugDuplicate"),
    });
  }
}

export async function createCaseStudy(
  ctx: TRPCContext,
  input: CaseStudyMutationInput,
) {
  const session = getRequiredSession(ctx);
  assertAdminRole(session.user.role);
  await assertUniqueSlug(ctx, input.slug);

  const { media, blocks, ...data } = input;
  const id = await ctx.db.transaction(async (tx) => {
    const [row] = await tx
      .insert(CaseStudiesTable)
      .values({
        ...data,
        coverImageUrl: data.coverImageUrl ?? null,
        liveUrl: data.liveUrl ?? null,
        createdBy: session.user.id,
      })
      .returning({ id: CaseStudiesTable.id });

    await upsertCaseStudyMedia(tx, row.id, media, session.user.id);
    await upsertCaseStudyBlocks(tx, row.id, blocks, session.user.id);
    return row.id;
  });
  return { id };
}

export async function updateCaseStudy(
  ctx: TRPCContext,
  input: CaseStudyUpdateInput,
) {
  const session = getRequiredSession(ctx);
  assertAdminRole(session.user.role);

  const existing = await ctx.db.query.CaseStudiesTable.findFirst({
    columns: { id: true },
    where: and(
      eq(CaseStudiesTable.id, input.id),
      isNull(CaseStudiesTable.deletedAt),
    ),
  });
  if (!existing) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Case study not found" });
  }

  await assertUniqueSlug(ctx, input.slug, input.id);

  const { id, media, blocks, ...data } = input;
  await ctx.db.transaction(async (tx) => {
    await tx
      .update(CaseStudiesTable)
      .set({
        ...data,
        coverImageUrl: data.coverImageUrl ?? null,
        liveUrl: data.liveUrl ?? null,
        updatedBy: session.user.id,
      })
      .where(eq(CaseStudiesTable.id, id));

    await upsertCaseStudyMedia(tx, id, media, session.user.id);
    await upsertCaseStudyBlocks(tx, id, blocks, session.user.id);
  });
  return { updated: true };
}

export async function publishCaseStudy(ctx: TRPCContext, id: string) {
  const session = getRequiredSession(ctx);
  assertAdminRole(session.user.role);

  const existing = await ctx.db.query.CaseStudiesTable.findFirst({
    columns: { id: true, slug: true, publishedAt: true },
    where: and(eq(CaseStudiesTable.id, id), isNull(CaseStudiesTable.deletedAt)),
  });
  if (!existing) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Case study not found" });
  }

  await ctx.db
    .update(CaseStudiesTable)
    .set({
      status: "published",
      publishedAt: existing.publishedAt ?? new Date(),
      updatedBy: session.user.id,
    })
    .where(eq(CaseStudiesTable.id, id));

  try {
    await inngest.send(
      caseStudyPublishedEvent.create({ caseStudyId: id, slug: existing.slug }),
    );
  } catch {}

  return { published: true };
}

export async function archiveCaseStudy(ctx: TRPCContext, id: string) {
  const session = getRequiredSession(ctx);
  assertAdminRole(session.user.role);

  await ctx.db
    .update(CaseStudiesTable)
    .set({ status: "archived", updatedBy: session.user.id })
    .where(
      and(eq(CaseStudiesTable.id, id), isNull(CaseStudiesTable.deletedAt)),
    );

  return { archived: true };
}

export async function deleteCaseStudy(ctx: TRPCContext, id: string) {
  const session = getRequiredSession(ctx);
  assertAdminRole(session.user.role);

  await ctx.db
    .update(CaseStudiesTable)
    .set({ deletedAt: new Date(), deletedBy: session.user.id })
    .where(eq(CaseStudiesTable.id, id));

  return { deleted: true };
}
