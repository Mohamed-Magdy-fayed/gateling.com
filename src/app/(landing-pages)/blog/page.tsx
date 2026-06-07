import type { Metadata } from "next";
import Link from "next/link";

import { LinkButton } from "@/components/general/link-button";
import { Badge } from "@/components/ui/badge";
import {
  CardHeading,
  Container,
  HeroContainer,
  PageHeading,
  ProseText,
  Section,
} from "@/components/ui/containers";
import { getT } from "@/features/core/i18n/server";
import { api } from "@/integrations/trpc/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("publicPages.blogPage.metaTitle"),
    description: t("publicPages.blogPage.metaDescription"),
  };
}

export default async function BlogPage() {
  const { t } = await getT();
  const caller = await api();
  const result = await caller.blogPosts
    .list({ status: "published", page: 1, perPage: 20 })
    .catch(
      () =>
        ({
          rows: [] as Awaited<ReturnType<typeof caller.blogPosts.list>>["rows"],
        }) as Awaited<ReturnType<typeof caller.blogPosts.list>>,
    );
  const posts = result.rows;

  return (
    <>
      <HeroContainer>
        <Container className="text-center">
          <PageHeading>{t("publicPages.blogPage.heading")}</PageHeading>
          <ProseText size="lg" className="mx-auto mt-4 max-w-2xl">
            {t("publicPages.blogPage.subheading")}
          </ProseText>
        </Container>
      </HeroContainer>

      <Section variant="feature">
        <Container size="narrow">
          {posts.length === 0 ? (
            <div className="text-center">
              <ProseText>{t("publicPages.blogPage.noPosts")}</ProseText>
              <LinkButton href="/contact" variant="outline" className="mt-4">
                {t("publicPages.blogPage.getInTouch")}
              </LinkButton>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-background block rounded-xl border p-6 shadow-sm transition-all hover:shadow-md hover:ring-1 hover:ring-primary/20"
                >
                  <div className="mb-2 flex items-center gap-3">
                    {post.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                    {post.publishedAt && (
                      <span className="text-muted-foreground text-xs">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <CardHeading className="mb-2 transition-colors group-hover:text-primary">
                    {post.title}
                  </CardHeading>
                  <ProseText size="sm">{post.excerpt}</ProseText>
                  <p className="text-primary mt-3 text-sm font-medium">
                    {t("publicPages.blogPage.readMore")}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
