import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BlockRenderer } from "@/components/blocks/block-renderer";
import { LinkButton } from "@/components/general/link-button";
import { MediaSection } from "@/components/general/media-section";
import { Badge } from "@/components/ui/badge";
import {
  Container,
  HeroContainer,
  PageHeading,
  ProseText,
  Section,
  SectionHeader,
} from "@/components/ui/containers";
import { getLocaleCookie, getT } from "@/features/core/i18n/server";
import { api } from "@/integrations/trpc/server";
import { breadcrumbJsonLd, canonicalUrl } from "@/lib/json-ld";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocaleCookie();
  const caller = await api();
  const post = await caller.blogPosts
    .publicGetBySlug({ slug })
    .catch(() => null);
  if (!post) return {};
  const title = locale === "ar" ? (post.titleAr ?? post.title) : post.title;
  const description =
    locale === "ar" ? (post.excerptAr ?? post.excerpt) : post.excerpt;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl(`/blog/${slug}`) },
    openGraph: {
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.authorName],
      ...(() => {
        const img =
          post.media?.find((m) => m.isFeatured)?.url ?? post.coverImageUrl;
        return img ? { images: [{ url: img }] } : {};
      })(),
    },
  };
}

async function BlogDetailContent({ params }: Props) {
  const { slug } = await params;
  const { t } = await getT();
  const locale = await getLocaleCookie();
  const caller = await api();
  const post = await caller.blogPosts
    .publicGetBySlug({ slug })
    .catch(() => null);

  if (!post) notFound();

  const title = locale === "ar" ? (post.titleAr ?? post.title) : post.title;
  const excerpt =
    locale === "ar" ? (post.excerptAr ?? post.excerpt) : post.excerpt;
  const content =
    locale === "ar" ? (post.contentAr ?? post.content) : post.content;
  const authorName =
    locale === "ar" ? (post.authorNameAr ?? post.authorName) : post.authorName;
  const tags =
    locale === "ar" && post.tagsAr?.length ? post.tagsAr : (post.tags ?? []);

  const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: excerpt,
    author: {
      "@type": "Organization",
      name: post.authorName,
    },
    datePublished: post.publishedAt?.toISOString(),
    image:
      post.media?.find((m) => m.isFeatured)?.url ??
      post.coverImageUrl ??
      undefined,
    publisher: {
      "@type": "Organization",
      "@id": "https://gateling.com/#org",
      name: "Gateling Solutions",
    },
  };

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Blog", path: "/blog" },
    { name: title, path: `/blog/${post.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <HeroContainer>
        <Container size="narrow">
          <Link
            href="/blog"
            transitionTypes={["nav-back"]}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5 rtl:-scale-x-100" />
            {t("publicPages.blogDetailPage.backToBlog")}
          </Link>

          <div className="mt-6 space-y-4">
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <PageHeading className="leading-tight">{title}</PageHeading>
            <ProseText size="lg" className="max-w-2xl">
              {excerpt}
            </ProseText>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {post.publishedAt && (
                <span>
                  {t("publicPages.blogDetailPage.publishedOn")}{" "}
                  {new Date(post.publishedAt).toLocaleDateString(
                    locale === "ar" ? "ar-EG" : undefined,
                    { year: "numeric", month: "long", day: "numeric" },
                  )}
                </span>
              )}
              <span>
                {t("publicPages.blogDetailPage.byAuthor", {
                  author: authorName,
                })}
              </span>
              <span>
                {t("publicPages.blogDetailPage.readingTime", {
                  n: readingTime.toString(),
                })}
              </span>
            </div>
          </div>
        </Container>
      </HeroContainer>

      {post.media && post.media.length > 0 ? (
        <div className="border-border/40 border-b py-6">
          <Container>
            <MediaSection items={post.media} />
          </Container>
        </div>
      ) : post.coverImageUrl ? (
        <div className="border-border/40 overflow-hidden border-b">
          <Container>
            <div className="relative aspect-video overflow-hidden rounded-xl">
              <Image
                src={post.coverImageUrl}
                alt={title}
                fill
                priority
                className="object-cover"
              />
            </div>
          </Container>
        </div>
      ) : null}

      <Section variant="feature">
        <Container size="narrow">
          {post.blocks && post.blocks.length > 0 ? (
            <BlockRenderer
              blocks={post.blocks}
              locale={locale === "ar" ? "ar" : "en"}
            />
          ) : (
            // legacy fallback, remove once all posts are migrated to blocks
            <article
              className="blog-prose prose prose-neutral max-w-none dark:prose-invert"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: developer-controlled CMS content, legacy fallback
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </Container>
      </Section>

      <Section variant="cta">
        <Container size="narrow" className="text-center">
          <SectionHeader
            heading={t("publicPages.blogDetailPage.ctaHeading")}
            subheading={t("publicPages.blogDetailPage.ctaDescription")}
          />
          <LinkButton href="/contact" size="lg">
            {t("publicPages.blogDetailPage.ctaButton")}
          </LinkButton>
        </Container>
      </Section>
    </>
  );
}

export default async function BlogDetailPage({ params }: Props) {
  return (
    <Suspense>
      <BlogDetailContent params={params} />
    </Suspense>
  );
}
