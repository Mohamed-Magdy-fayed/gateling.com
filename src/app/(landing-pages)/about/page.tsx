import type { Metadata } from "next";

import { LinkButton } from "@/components/general/link-button";
import {
  CardHeading,
  CheckItem,
  Container,
  ContentCard,
  Grid,
  HeroContainer,
  PageHeading,
  ProseText,
  Section,
  SectionHeader,
  SmallHeroContainer,
  StatCard,
} from "@/components/ui/containers";
import { getT } from "@/features/core/i18n/server";
import { canonicalUrl } from "@/lib/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("publicPages.aboutPage.metaTitle"),
    description: t("publicPages.aboutPage.metaDescription"),
    alternates: { canonical: canonicalUrl("/about") },
  };
}

export default async function AboutPage() {
  const { t } = await getT();

  const stats = [
    {
      value: t("publicPages.aboutPage.statsLaunchesValue"),
      label: t("publicPages.aboutPage.statsLaunchesLabel"),
    },
    {
      value: t("publicPages.aboutPage.statsClientsValue"),
      label: t("publicPages.aboutPage.statsClientsLabel"),
    },
    {
      value: t("publicPages.aboutPage.statsDisciplinesValue"),
      label: t("publicPages.aboutPage.statsDisciplinesLabel"),
    },
    {
      value: t("publicPages.aboutPage.statsBuildCycleValue"),
      label: t("publicPages.aboutPage.statsBuildCycleLabel"),
    },
  ];

  const whyItems = [
    t("publicPages.aboutPage.whyUs1"),
    t("publicPages.aboutPage.whyUs2"),
    t("publicPages.aboutPage.whyUs3"),
    t("publicPages.aboutPage.whyUs4"),
    t("publicPages.aboutPage.whyUs5"),
  ];

  const values = [
    {
      title: t("publicPages.aboutPage.value1Title"),
      desc: t("publicPages.aboutPage.value1Description"),
    },
    {
      title: t("publicPages.aboutPage.value2Title"),
      desc: t("publicPages.aboutPage.value2Description"),
    },
    {
      title: t("publicPages.aboutPage.value3Title"),
      desc: t("publicPages.aboutPage.value3Description"),
    },
    {
      title: t("publicPages.aboutPage.value4Title"),
      desc: t("publicPages.aboutPage.value4Description"),
    },
    {
      title: t("publicPages.aboutPage.value5Title"),
      desc: t("publicPages.aboutPage.value5Description"),
    },
  ];

  return (
    <>
      {/* Hero */}
      <SmallHeroContainer>
        <Container size="wide">
          <PageHeading>{t("publicPages.aboutPage.heroTitle")}</PageHeading>
          <ProseText size="lg" className="mt-6">
            {t("publicPages.aboutPage.heroDescription")}
          </ProseText>
        </Container>
      </SmallHeroContainer>

      {/* Stats row */}
      <Section variant="alternate">
        <Container size="narrow">
          <Grid cols={2} gap="compact">
            {stats.map((s) => (
              <StatCard key={s.label} value={s.value} label={s.label} />
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Story + Mission + Vision */}
      <Section variant="feature">
        <Container size="narrow">
          <div className="space-y-12">
            <div>
              <CardHeading className="mb-3 text-2xl">
                {t("publicPages.aboutPage.storyTitle")}
              </CardHeading>
              <ProseText>
                {t("publicPages.aboutPage.storyDescription")}
              </ProseText>
            </div>

            <div>
              <CardHeading className="mb-3 text-2xl">
                {t("publicPages.aboutPage.missionTitle")}
              </CardHeading>
              <ProseText>
                {t("publicPages.aboutPage.missionDescription")}
              </ProseText>
            </div>

            <div>
              <CardHeading className="mb-3 text-2xl">
                {t("publicPages.aboutPage.visionTitle")}
              </CardHeading>
              <ProseText>
                {t("publicPages.aboutPage.visionDescription")}
              </ProseText>
            </div>
          </div>
        </Container>
      </Section>

      {/* Why choose us */}
      <Section variant="alternate">
        <Container size="narrow">
          <CardHeading className="mb-6 text-2xl">
            {t("publicPages.aboutPage.whyChooseUsTitle")}
          </CardHeading>
          <div className="space-y-3">
            {whyItems.map((item) => (
              <CheckItem key={item}>{item}</CheckItem>
            ))}
          </div>
        </Container>
      </Section>

      {/* Values */}
      <Section variant="feature">
        <Container size="narrow">
          <SectionHeader
            heading={t("publicPages.aboutPage.valuesTitle")}
            subheading={t("publicPages.aboutPage.valuesDescription")}
          />
          <Grid cols={3} gap="compact" className="mt-8">
            {values.map((v) => (
              <ContentCard key={v.title}>
                <CardHeading className="mb-2">{v.title}</CardHeading>
                <ProseText size="sm">{v.desc}</ProseText>
              </ContentCard>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Founder */}
      <Section variant="alternate">
        <Container size="narrow">
          <ContentCard className="p-8">
            <CardHeading className="mb-2 text-2xl">
              {t("publicPages.aboutPage.founderTitle")}
            </CardHeading>
            <ProseText className="mb-6">
              {t("publicPages.aboutPage.founderDescription")}
            </ProseText>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-bold">
                M
              </div>
              <div>
                <p className="font-semibold">
                  {t("publicPages.aboutPage.founderName")}
                </p>
                <ProseText size="sm">
                  {t("publicPages.aboutPage.founderRole")}
                </ProseText>
                <ProseText size="sm" className="mt-3">
                  {t("publicPages.aboutPage.founderBio")}
                </ProseText>
              </div>
            </div>
          </ContentCard>
        </Container>
      </Section>

      {/* CTA */}
      <Section variant="cta">
        <Container size="narrow" className="text-center">
          <SectionHeader
            heading={t("publicPages.aboutPage.ctaTitle")}
            subheading={t("publicPages.aboutPage.ctaDescription")}
          />
          <div className="flex flex-wrap justify-center gap-3">
            <LinkButton href="/contact" size="lg">
              {t("publicPages.aboutPage.ctaPrimary")}
            </LinkButton>
            <LinkButton href="/work" size="lg" variant="outline">
              {t("publicPages.aboutPage.ctaSecondary")}
            </LinkButton>
          </div>
        </Container>
      </Section>
    </>
  );
}
