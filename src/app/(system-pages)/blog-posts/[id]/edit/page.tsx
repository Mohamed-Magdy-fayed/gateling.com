import { BlogPostBlockEditor } from "@/components/forms/block-editor/blog-post-block-editor";
import { HydrateClient } from "@/integrations/trpc/server";

type Props = { params: Promise<{ id: string }> };

export default async function BlogPostEditPage({ params }: Props) {
  const { id } = await params;
  return (
    <HydrateClient>
      <BlogPostBlockEditor id={id} />
    </HydrateClient>
  );
}
