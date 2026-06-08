import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { LinkButton } from "@/components/general/link-button";
import { Badge } from "@/components/ui/badge";
import {
  CardHeading,
  Container,
  ContentCard,
  HeroContainer,
  PageHeading,
  ProseText,
  Section,
  SectionHeader,
} from "@/components/ui/containers";
import { getLocaleCookie, getT } from "@/features/core/i18n/server";
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
  const locale = await getLocaleCookie();
  const caller = await api();
  const posts = await caller.blogPosts.publicList().catch(() => []);

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
        <Container>
          {posts.length === 0 ? (
            <div className="text-center">
              <ProseText>{t("publicPages.blogPage.noPosts")}</ProseText>
              <LinkButton href="/contact" variant="outline" className="mt-4">
                {t("publicPages.blogPage.getInTouch")}
              </LinkButton>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {posts.map((post) => {
                const readingTime = Math.max(
                  1,
                  Math.ceil(post.content.split(/\s+/).length / 200),
                );
                const title =
                  locale === "ar" ? (post.titleAr ?? post.title) : post.title;
                const excerpt =
                  locale === "ar"
                    ? (post.excerptAr ?? post.excerpt)
                    : post.excerpt;
                return (
                  <ContentCard key={post.id} className="group relative p-0">
                    <Link href={`/blog/${post.slug}`} className="block">
                      {post.coverImageUrl && (
                        <div className="relative aspect-video overflow-hidden rounded-t-xl">
                          <Image
                            src={post.coverImageUrl}
                            alt={title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          {post.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <CardHeading className="mb-2 transition-colors group-hover:text-primary">
                          {title}
                        </CardHeading>
                        <ProseText size="sm">{excerpt}</ProseText>
                        <div className="text-muted-foreground mt-4 flex items-center justify-between text-xs">
                          <span>
                            {post.publishedAt &&
                              new Date(post.publishedAt).toLocaleDateString(
                                locale === "ar" ? "ar-EG" : undefined,
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                          </span>
                          <span>
                            {t("publicPages.blogPage.readingTime", {
                              n: readingTime.toString(),
                            })}
                          </span>
                        </div>
                        <p className="text-primary mt-3 text-sm font-medium">
                          {t("publicPages.blogPage.readMore")}
                        </p>
                      </div>
                    </Link>
                  </ContentCard>
                );
              })}
            </div>
          )}
        </Container>
      </Section>

      <Section variant="cta">
        <Container size="narrow" className="text-center">
          <SectionHeader
            heading={t("publicPages.blogPage.ctaHeading")}
            subheading={t("publicPages.blogPage.ctaDescription")}
          />
          <LinkButton href="/contact" size="lg">
            {t("publicPages.blogPage.ctaButton")}
          </LinkButton>
        </Container>
      </Section>
    </>
  );
}
