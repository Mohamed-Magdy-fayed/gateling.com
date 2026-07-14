import { CaseStudyBlockEditor } from "@/components/forms/block-editor/case-study-block-editor";
import { HydrateClient } from "@/integrations/trpc/server";

type Props = { params: Promise<{ id: string }> };

export default async function CaseStudyEditPage({ params }: Props) {
  const { id } = await params;
  return (
    <HydrateClient>
      <CaseStudyBlockEditor id={id} />
    </HydrateClient>
  );
}
