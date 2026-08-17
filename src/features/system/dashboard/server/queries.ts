import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte, isNull } from "drizzle-orm";
import {
  BlogPostsTable,
  CaseStudiesTable,
  LeadsTable,
  ServicesTable,
  SubscribersTable,
} from "@/drizzle/schema";

import type { createTRPCContext } from "@/integrations/trpc/init";

import type { DashboardData } from "./types";

type Ctx = Awaited<ReturnType<typeof createTRPCContext>>;

function getRequiredSession(ctx: Ctx) {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return ctx.session;
}

export async function getDashboardData(ctx: Ctx): Promise<DashboardData> {
  getRequiredSession(ctx);

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    newLeadsRow,
    totalLeadsRow,
    subscribersRow,
    caseStudiesRow,
    blogPostsRow,
    servicesRow,
    recentLeadsRaw,
  ] = await Promise.all([
    // Every lead figure on this dashboard means *contact-form* leads. Sales
    // prospects share the table and would otherwise inflate all three.
    ctx.db
      .select({ count: count() })
      .from(LeadsTable)
      .where(
        and(
          eq(LeadsTable.kind, "inbound"),
          gte(LeadsTable.createdAt, currentMonthStart),
        ),
      ),

    ctx.db
      .select({ count: count() })
      .from(LeadsTable)
      .where(eq(LeadsTable.kind, "inbound")),

    ctx.db
      .select({ count: count() })
      .from(SubscribersTable)
      .where(eq(SubscribersTable.status, "active")),

    ctx.db
      .select({ count: count() })
      .from(CaseStudiesTable)
      .where(
        and(
          eq(CaseStudiesTable.status, "published"),
          isNull(CaseStudiesTable.deletedAt),
        ),
      ),

    ctx.db
      .select({ count: count() })
      .from(BlogPostsTable)
      .where(
        and(
          eq(BlogPostsTable.status, "published"),
          isNull(BlogPostsTable.deletedAt),
        ),
      ),

    ctx.db
      .select({ count: count() })
      .from(ServicesTable)
      .where(
        and(eq(ServicesTable.isActive, true), isNull(ServicesTable.deletedAt)),
      ),

    ctx.db
      .select({
        id: LeadsTable.id,
        name: LeadsTable.name,
        email: LeadsTable.email,
        company: LeadsTable.company,
        status: LeadsTable.status,
        source: LeadsTable.source,
        createdAt: LeadsTable.createdAt,
      })
      .from(LeadsTable)
      .where(eq(LeadsTable.kind, "inbound"))
      .orderBy(desc(LeadsTable.createdAt))
      .limit(10),
  ]);

  return {
    summary: {
      newLeadsThisMonth: newLeadsRow[0]?.count ?? 0,
      totalLeads: totalLeadsRow[0]?.count ?? 0,
      activeSubscribers: subscribersRow[0]?.count ?? 0,
      publishedCaseStudies: caseStudiesRow[0]?.count ?? 0,
      publishedBlogPosts: blogPostsRow[0]?.count ?? 0,
      activeServices: servicesRow[0]?.count ?? 0,
    },
    recentLeads: recentLeadsRaw.map((lead) => ({
      id: lead.id,
      name: lead.name,
      // Non-null in practice — the query is scoped to inbound leads, whose
      // email the contact-form schema requires.
      email: lead.email ?? "",
      company: lead.company,
      status: lead.status,
      source: lead.source,
      createdAt: lead.createdAt.toISOString(),
    })),
  };
}
