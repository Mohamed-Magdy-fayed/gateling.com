import { assertSalesStaff } from "@/features/system/sales/server/access";
import { getSalesDashboard } from "@/features/system/sales/server/dashboard";
import { createTRPCRouter, protectedProcedure } from "@/integrations/trpc/init";

import { getDashboardData } from "./queries";

export const dashboardRouter = createTRPCRouter({
  getData: protectedProcedure.query(({ ctx }) => getDashboardData(ctx)),
  // Same rule as the sales router: the route guard is not the authorisation.
  getSales: protectedProcedure.query(({ ctx }) => {
    assertSalesStaff(ctx.session?.user.role);
    return getSalesDashboard(ctx.db);
  }),
});
