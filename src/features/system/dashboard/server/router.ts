import { TRPCError } from "@trpc/server";

import { getSalesDashboard } from "@/features/system/sales/server/dashboard";
import { createTRPCRouter, protectedProcedure } from "@/integrations/trpc/init";

import { getDashboardData } from "./queries";

export const dashboardRouter = createTRPCRouter({
  getData: protectedProcedure.query(({ ctx }) => getDashboardData(ctx)),
  // Same rule as the sales router: the route guard is not the authorisation.
  getSales: protectedProcedure.query(({ ctx }) => {
    if (ctx.session?.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return getSalesDashboard(ctx.db);
  }),
});
