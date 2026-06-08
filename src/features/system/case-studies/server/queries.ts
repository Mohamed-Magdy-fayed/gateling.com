import { and, asc, count, desc, eq, ilike, isNull, or } from "drizzle-orm";

import { CaseStudiesTable } from "@/drizzle/schema";
import { localize } from "@/lib/i18n-content";
import type { ListCaseStudiesInput } from "./schemas";
import {
  assertAdminRole,
  getRequiredSession,
  type TRPCContext,
} from "./shared";
import type { CaseStudyRow } from "./types";

export async function listCaseStudies(
  ctx: TRPCContext,
  input: ListCaseStudiesInput,
) {
  const session = getRequiredSession(ctx);
  assertAdminRole(session.user.role);

  const conditions = [isNull(CaseStudiesTable.deletedAt)];

  if (input.status && input.status !== "all") {
    conditions.push(eq(CaseStudiesTable.status, input.status));
  }
  if (input.industry) {
    conditions.push(eq(CaseStudiesTable.industry, input.industry));
  }
  if (input.globalFilter?.trim()) {
    const like = `%${input.globalFilter.trim()}%`;
    conditions.push(
      or(
        ilike(CaseStudiesTable.title, like),
        ilike(CaseStudiesTable.client, like),
        ilike(CaseStudiesTable.industry, like),
      ) ?? isNull(CaseStudiesTable.deletedAt),
    );
  }

  const where = and(...conditions);
  const [{ total }] = await ctx.db
    .select({ total: count() })
    .from(CaseStudiesTable)
    .where(where);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);
  const offset = (page - 1) * input.perPage;

  const firstSort = input.sorting[0];
  const orderBy = firstSort
    ? firstSort.id === "title"
      ? firstSort.desc
        ? [desc(CaseStudiesTable.title)]
        : [asc(CaseStudiesTable.title)]
      : firstSort.id === "createdAt"
        ? firstSort.desc
          ? [desc(CaseStudiesTable.createdAt)]
          : [asc(CaseStudiesTable.createdAt)]
        : [asc(CaseStudiesTable.sortOrder), desc(CaseStudiesTable.createdAt)]
    : [asc(CaseStudiesTable.sortOrder), desc(CaseStudiesTable.createdAt)];

  const rows = await ctx.db
    .select({
      id: CaseStudiesTable.id,
      title: CaseStudiesTable.title,
      titleAr: CaseStudiesTable.titleAr,
      slug: CaseStudiesTable.slug,
      client: CaseStudiesTable.client,
      clientAr: CaseStudiesTable.clientAr,
      industry: CaseStudiesTable.industry,
      industryAr: CaseStudiesTable.industryAr,
      problemStatementAr: CaseStudiesTable.problemStatementAr,
      solutionAr: CaseStudiesTable.solutionAr,
      status: CaseStudiesTable.status,
      publishedAt: CaseStudiesTable.publishedAt,
      sortOrder: CaseStudiesTable.sortOrder,
      coverImageUrl: CaseStudiesTable.coverImageUrl,
      liveUrl: CaseStudiesTable.liveUrl,
      results: CaseStudiesTable.results,
      resultsAr: CaseStudiesTable.resultsAr,
      createdAt: CaseStudiesTable.createdAt,
      updatedAt: CaseStudiesTable.updatedAt,
    })
    .from(CaseStudiesTable)
    .where(where)
    .orderBy(...orderBy)
    .limit(input.perPage)
    .offset(offset);

  return { rows: rows as CaseStudyRow[], pageCount, total: Number(total) };
}

export async function getCaseStudyById(ctx: TRPCContext, id: string) {
  return ctx.db.query.CaseStudiesTable.findFirst({
    where: and(eq(CaseStudiesTable.id, id), isNull(CaseStudiesTable.deletedAt)),
  });
}

export async function listPublishedCaseStudies(ctx: TRPCContext) {
  const rows = await ctx.db
    .select({
      id: CaseStudiesTable.id,
      slug: CaseStudiesTable.slug,
      client: CaseStudiesTable.client,
      clientAr: CaseStudiesTable.clientAr,
      industry: CaseStudiesTable.industry,
      industryAr: CaseStudiesTable.industryAr,
      problemStatement: CaseStudiesTable.problemStatement,
      problemStatementAr: CaseStudiesTable.problemStatementAr,
      solution: CaseStudiesTable.solution,
      solutionAr: CaseStudiesTable.solutionAr,
      results: CaseStudiesTable.results,
      resultsAr: CaseStudiesTable.resultsAr,
      liveUrl: CaseStudiesTable.liveUrl,
      coverImageUrl: CaseStudiesTable.coverImageUrl,
      sortOrder: CaseStudiesTable.sortOrder,
    })
    .from(CaseStudiesTable)
    .where(
      and(
        eq(CaseStudiesTable.status, "published"),
        isNull(CaseStudiesTable.deletedAt),
      ),
    )
    .orderBy(asc(CaseStudiesTable.sortOrder), desc(CaseStudiesTable.createdAt));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    liveUrl: row.liveUrl,
    coverImageUrl: row.coverImageUrl,
    sortOrder: row.sortOrder,
    client: localize(row.client, row.clientAr, ctx.locale),
    industry: localize(row.industry, row.industryAr, ctx.locale),
    problemStatement: localize(
      row.problemStatement,
      row.problemStatementAr,
      ctx.locale,
    ),
    solution: localize(row.solution, row.solutionAr, ctx.locale),
    results: localize(row.results, row.resultsAr, ctx.locale),
  }));
}

export async function getPublishedCaseStudyBySlug(
  ctx: TRPCContext,
  slug: string,
) {
  const row = await ctx.db.query.CaseStudiesTable.findFirst({
    where: and(
      eq(CaseStudiesTable.slug, slug),
      eq(CaseStudiesTable.status, "published"),
      isNull(CaseStudiesTable.deletedAt),
    ),
  });
  if (!row) return undefined;
  return {
    ...row,
    title: localize(row.title, row.titleAr, ctx.locale),
    client: localize(row.client, row.clientAr, ctx.locale),
    industry: localize(row.industry, row.industryAr, ctx.locale),
    problemStatement: localize(
      row.problemStatement,
      row.problemStatementAr,
      ctx.locale,
    ),
    solution: localize(row.solution, row.solutionAr, ctx.locale),
    results: localize(row.results, row.resultsAr, ctx.locale),
  };
}
