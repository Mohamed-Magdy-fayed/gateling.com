import { DiscoveryStudiesPage } from "@/features/system/discovery/admin/studies-page";
import { HydrateClient } from "@/integrations/trpc/server";

/** Staff-only: `src/proxy.ts` guards `/discovery`; procedures assert the role. */
export const metadata = {
  title: "Discovery",
  robots: { index: false, follow: false },
};

export default function DiscoveryRoute() {
  return (
    <HydrateClient>
      <DiscoveryStudiesPage />
    </HydrateClient>
  );
}
