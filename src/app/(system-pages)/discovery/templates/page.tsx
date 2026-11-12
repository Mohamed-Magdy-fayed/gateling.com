import { DiscoveryTemplatesPage } from "@/features/system/discovery/admin/templates-page";
import { HydrateClient } from "@/integrations/trpc/server";

export const metadata = {
  title: "Discovery templates",
  robots: { index: false, follow: false },
};

export default function DiscoveryTemplatesRoute() {
  return (
    <HydrateClient>
      <DiscoveryTemplatesPage />
    </HydrateClient>
  );
}
