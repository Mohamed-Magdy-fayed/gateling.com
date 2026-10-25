import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { LeadsTable } from "@/drizzle/schema";

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

  const [newLeadsRow, recentLeadsRaw] = await Promise.all([
    // Every lead figure here means *contact-form* leads. Sales prospects share
    // the table and are covered by the sales half of the dashboard.
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
    newLeadsThisMonth: newLeadsRow[0]?.count ?? 0,
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
