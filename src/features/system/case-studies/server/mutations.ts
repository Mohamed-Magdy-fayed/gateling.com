import { TRPCError } from "@trpc/server";
import { and, eq, isNull, ne } from "drizzle-orm";

import { CaseStudiesTable, CaseStudyMediaTable } from "@/drizzle/schema";
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

async function upsertCaseStudyMedia(
  db: TRPCContext["db"],
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

  const { media, ...data } = input;
  const [row] = await ctx.db
    .insert(CaseStudiesTable)
    .values({
      ...data,
      coverImageUrl: data.coverImageUrl ?? null,
      liveUrl: data.liveUrl ?? null,
      createdBy: session.user.id,
    })
    .returning({ id: CaseStudiesTable.id });

  await upsertCaseStudyMedia(ctx.db, row.id, media, session.user.id);
  return { id: row.id };
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

  const { id, media, ...data } = input;
  await ctx.db
    .update(CaseStudiesTable)
    .set({
      ...data,
      coverImageUrl: data.coverImageUrl ?? null,
      liveUrl: data.liveUrl ?? null,
      updatedBy: session.user.id,
    })
    .where(eq(CaseStudiesTable.id, id));

  await upsertCaseStudyMedia(ctx.db, id, media, session.user.id);
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
