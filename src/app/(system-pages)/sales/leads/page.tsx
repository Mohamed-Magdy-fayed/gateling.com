import { SalesLeadsTablePage } from "@/features/system/sales/admin/leads-table-page";
import { HydrateClient } from "@/integrations/trpc/server";

export const metadata = {
  title: "Sales Pipeline",
  robots: { index: false, follow: false },
};

export default function SalesLeadsRoute() {
  return (
    <HydrateClient>
      <SalesLeadsTablePage />
    </HydrateClient>
  );
}
