import { db } from "@/drizzle";
import { SalesTodayPage } from "@/features/system/sales/admin/today-page";
import { getCallingWindowAdvice } from "@/features/system/sales/lib/calling-window";
import { getSalesSettings } from "@/features/system/sales/server/settings";
import { HydrateClient } from "@/integrations/trpc/server";

/**
 * Internal, admin-only. `src/proxy.ts` blocks `/sales` by screen permission
 * and `(system-pages)/layout.tsx` redirects anonymous requests; the tRPC
 * procedures assert admin independently.
 */
export const metadata = {
  title: "Today's Work",
  robots: { index: false, follow: false },
};

export default async function SalesTodayRoute() {
  // Resolved server-side so the calling-window advice follows Cairo business
  // hours rather than the operator's device clock.
  const { timeZone } = await getSalesSettings(db);
  const advice = getCallingWindowAdvice(new Date(), timeZone);

  return (
    <HydrateClient>
      <SalesTodayPage
        callingWindow={{
          isBeforeCallingHours: advice.isBeforeCallingHours,
          isAfterCallingHours: advice.isAfterCallingHours,
        }}
      />
    </HydrateClient>
  );
}
