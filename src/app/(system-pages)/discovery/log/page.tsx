import { DiscoveryQuickLogPage } from "@/features/system/discovery/admin/quick-log-page";
import { HydrateClient } from "@/integrations/trpc/server";

/**
 * Quick capture, and the Web Share Target landing page (`app/manifest.ts`):
 * Android's share sheet opens `/discovery/log?url=&text=&title=`.
 */
export const metadata = {
  title: "Log",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v ? v.slice(0, 4000) : undefined;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function DiscoveryLogRoute({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const studyId = first(params.studyId);
  const contactId = first(params.contactId);
  const contactName = first(params.contactName);

  return (
    <HydrateClient>
      <DiscoveryQuickLogPage
        shared={{
          url: first(params.url),
          text: first(params.text),
          title: first(params.title),
        }}
        initialStudyId={studyId && UUID.test(studyId) ? studyId : undefined}
        initialContact={
          contactId && UUID.test(contactId)
            ? { id: contactId, name: contactName ?? "" }
            : undefined
        }
      />
    </HydrateClient>
  );
}
