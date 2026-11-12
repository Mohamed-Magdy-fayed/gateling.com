import { DiscoveryContactPage } from "@/features/system/discovery/admin/contact-page";
import { HydrateClient } from "@/integrations/trpc/server";

export const metadata = {
  title: "Contact",
  robots: { index: false, follow: false },
};

export default async function DiscoveryContactRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <HydrateClient>
      <DiscoveryContactPage contactId={id} />
    </HydrateClient>
  );
}
