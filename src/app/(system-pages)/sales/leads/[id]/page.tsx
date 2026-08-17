import { SalesLeadDetailPage } from "@/features/system/sales/admin/lead-detail-page";
import { HydrateClient } from "@/integrations/trpc/server";

export const metadata = {
  title: "Lead",
  robots: { index: false, follow: false },
};

export default async function SalesLeadDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <HydrateClient>
      <SalesLeadDetailPage leadId={id} />
    </HydrateClient>
  );
}
