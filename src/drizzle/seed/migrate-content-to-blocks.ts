import { and, count, eq, isNotNull, isNull, ne } from "drizzle-orm";

import { db } from "@/drizzle";
import {
  BlogPostBlocksTable,
  BlogPostsTable,
  CaseStudiesTable,
  CaseStudyBlocksTable,
} from "@/drizzle/schema";

const MIGRATION_ACTOR = "system-migration";

/**
 * One-time data migration (Phase 4.7): backfills the normalized
 * blog_post_blocks / case_study_blocks tables from the legacy free-text
 * columns (content/contentAr, problemStatement/solution) so the new
 * block-based editor/renderer has something to read for existing rows.
 *
 * Idempotent: skips any post/case study that already has at least one
 * block row. Does NOT touch or drop the legacy columns — that is an
 * explicit follow-up after a human verifies the migrated content renders
 * correctly in the new block editor.
 */
export async function migrateContentToBlocks() {
  const summary = {
    blogPosts: { migrated: 0, skipped: 0 },
    caseStudies: { migrated: 0, skipped: 0 },
  };

  const posts = await db
    .select({
      id: BlogPostsTable.id,
      content: BlogPostsTable.content,
      contentAr: BlogPostsTable.contentAr,
    })
    .from(BlogPostsTable)
    .where(
      and(
        isNull(BlogPostsTable.deletedAt),
        isNotNull(BlogPostsTable.content),
        ne(BlogPostsTable.content, ""),
      ),
    );

  for (const post of posts) {
    const [{ existing }] = await db
      .select({ existing: count() })
      .from(BlogPostBlocksTable)
      .where(eq(BlogPostBlocksTable.parentId, post.id));

    if (existing > 0) {
      summary.blogPosts.skipped += 1;
      continue;
    }

    await db.insert(BlogPostBlocksTable).values({
      parentId: post.id,
      type: "paragraph",
      sortOrder: 0,
      contentEn: post.content,
      contentAr: post.contentAr ?? null,
      createdBy: MIGRATION_ACTOR,
    });
    summary.blogPosts.migrated += 1;
  }

  const caseStudies = await db
    .select({
      id: CaseStudiesTable.id,
      problemStatement: CaseStudiesTable.problemStatement,
      problemStatementAr: CaseStudiesTable.problemStatementAr,
      solution: CaseStudiesTable.solution,
      solutionAr: CaseStudiesTable.solutionAr,
    })
    .from(CaseStudiesTable)
    .where(isNull(CaseStudiesTable.deletedAt));

  for (const cs of caseStudies) {
    const [{ existing }] = await db
      .select({ existing: count() })
      .from(CaseStudyBlocksTable)
      .where(eq(CaseStudyBlocksTable.parentId, cs.id));

    if (existing > 0) {
      summary.caseStudies.skipped += 1;
      continue;
    }

    await db.insert(CaseStudyBlocksTable).values([
      {
        parentId: cs.id,
        type: "paragraph",
        sortOrder: 0,
        contentEn: cs.problemStatement,
        contentAr: cs.problemStatementAr ?? null,
        createdBy: MIGRATION_ACTOR,
      },
      {
        parentId: cs.id,
        type: "paragraph",
        sortOrder: 1,
        contentEn: cs.solution,
        contentAr: cs.solutionAr ?? null,
        createdBy: MIGRATION_ACTOR,
      },
    ]);
    summary.caseStudies.migrated += 1;
  }

  console.log("Content-to-blocks migration summary:");
  console.log(
    `  Blog posts:   migrated=${summary.blogPosts.migrated} skipped=${summary.blogPosts.skipped}`,
  );
  console.log(
    `  Case studies: migrated=${summary.caseStudies.migrated} skipped=${summary.caseStudies.skipped}`,
  );

  return summary;
}
