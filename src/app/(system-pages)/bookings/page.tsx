import { BookingsTablePage } from "@/features/system/bookings/admin";
import { HydrateClient } from "@/integrations/trpc/server";

export default function BookingsPage() {
  return (
    <HydrateClient>
      <BookingsTablePage />
    </HydrateClient>
  );
}
