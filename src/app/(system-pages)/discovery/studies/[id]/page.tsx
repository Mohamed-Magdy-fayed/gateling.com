import { DiscoveryStudyPage } from "@/features/system/discovery/admin/study-page";
import { HydrateClient } from "@/integrations/trpc/server";

export const metadata = {
  title: "Study",
  robots: { index: false, follow: false },
};

export default async function DiscoveryStudyRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <HydrateClient>
      <DiscoveryStudyPage studyId={id} />
    </HydrateClient>
  );
}
