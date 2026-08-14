import type { Metadata } from "next";

import { LinkButton } from "@/components/general/link-button";
import {
  CardHeading,
  Container,
  ContentCard,
  Grid,
  HeroContainer,
  PageHeading,
  ProseText,
  Section,
  SectionHeader,
} from "@/components/ui/containers";
import { getT } from "@/features/core/i18n/server";
import { breadcrumbJsonLd, canonicalUrl } from "@/lib/json-ld";
import { SOLUTION_VERTICALS } from "./_solutions";

const LEAD_SOURCE = "solutions-index";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("publicPages.solutionsIndexPage.metaTitle"),
    description: t("publicPages.solutionsIndexPage.metaDescription"),
    alternates: { canonical: canonicalUrl("/solutions") },
  };
}

export default async function SolutionsIndexPage() {
  const { t } = await getT();

  const verticals = SOLUTION_VERTICALS.map((vertical) => ({
    slug: vertical.slug,
    title: t(vertical.titleKey),
    description: t(vertical.descriptionKey),
  }));

  // ItemList rather than a bare CollectionPage: this hub's job is to tell a
  // crawler which vertical pages exist and in what order, which is exactly
  // what ItemList encodes.
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("publicPages.solutionsIndexPage.metaTitle"),
    itemListElement: verticals.map((vertical, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: vertical.title,
      url: canonicalUrl(`/solutions/${vertical.slug}`),
    })),
  };

  const breadcrumbs = breadcrumbJsonLd([{ name: "Solutions", path: "/solutions" }]);

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <HeroContainer>
        <Container size="narrow" className="text-center">
          <PageHeading>
            {t("publicPages.solutionsIndexPage.heading")}
          </PageHeading>
          <ProseText size="lg" className="mx-auto mt-4 max-w-2xl">
            {t("publicPages.solutionsIndexPage.subheading")}
          </ProseText>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href={`/contact?source=${LEAD_SOURCE}`} size="lg">
              {t("publicPages.solutionsIndexPage.heroPrimary")}
            </LinkButton>
            <LinkButton href="/work" variant="outline" size="lg">
              {t("publicPages.solutionsIndexPage.heroSecondary")}
            </LinkButton>
          </div>
        </Container>
      </HeroContainer>

      <Section variant="feature">
        <Container>
          <SectionHeader
            eyebrow={t("publicPages.solutionsIndexPage.verticalsEyebrow")}
            heading={t("publicPages.solutionsIndexPage.verticalsHeading")}
            subheading={t("publicPages.solutionsIndexPage.verticalsSubheading")}
          />
          <Grid cols={2} className="mt-8">
            {verticals.map((vertical) => (
              <ContentCard key={vertical.slug} className="flex flex-col">
                <CardHeading>{vertical.title}</CardHeading>
                <ProseText size="sm" className="mt-3 flex-1">
                  {vertical.description}
                </ProseText>
                <LinkButton
                  href={`/solutions/${vertical.slug}`}
                  variant="outline"
                  className="mt-5 self-start"
                >
                  {t("publicPages.solutionsIndexPage.verticalCta")}
                </LinkButton>
              </ContentCard>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section variant="alternate">
        <Container size="narrow" className="text-center">
          <SectionHeader
            eyebrow={t("publicPages.solutionsIndexPage.capabilitiesEyebrow")}
            heading={t("publicPages.solutionsIndexPage.capabilitiesHeading")}
            subheading={t(
              "publicPages.solutionsIndexPage.capabilitiesSubheading",
            )}
          />
          <div className="flex flex-wrap justify-center gap-3">
            <LinkButton href="/services">
              {t("publicPages.solutionsIndexPage.capabilitiesCta")}
            </LinkButton>
            <LinkButton href="/work" variant="outline">
              {t("publicPages.solutionsIndexPage.capabilitiesSecondaryCta")}
            </LinkButton>
          </div>
        </Container>
      </Section>

      <Section variant="cta">
        <Container size="narrow" className="text-center">
          <SectionHeader
            heading={t("publicPages.solutionsIndexPage.ctaHeading")}
            subheading={t("publicPages.solutionsIndexPage.ctaSubheading")}
          />
          <LinkButton href={`/contact?source=${LEAD_SOURCE}`} size="lg">
            {t("publicPages.solutionsIndexPage.ctaButton")}
          </LinkButton>
        </Container>
      </Section>
    </>
  );
}
