import type { Metadata } from "next";

import { LinkButton } from "@/components/general/link-button";
import { Container, Grid, Section, SectionHeader } from "@/components/ui/containers";
import { getT } from "@/features/core/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("publicPages.aboutPage.metaTitle"),
    description: t("publicPages.aboutPage.metaDescription"),
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
      <Section variant="compact">
        <Container size="narrow">
          <h1 className="text-4xl font-bold md:text-5xl">
            {t("publicPages.aboutPage.heroTitle")}
          </h1>
          <p className="text-muted-foreground mt-6 text-lg leading-relaxed">
            {t("publicPages.aboutPage.heroDescription")}
          </p>
        </Container>
      </Section>

      {/* Stats row */}
      <Section variant="compact">
        <Container size="narrow">
          <Grid cols={2} gap="compact">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border bg-muted/30 p-5">
                <p className="text-primary text-lg font-bold">{s.value}</p>
                <p className="text-muted-foreground mt-1 text-sm">{s.label}</p>
              </div>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Story + Mission + Vision */}
      <Section>
        <Container size="narrow">
          <div className="space-y-12">
            <div>
              <h2 className="mb-3 text-2xl font-bold">
                {t("publicPages.aboutPage.storyTitle")}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t("publicPages.aboutPage.storyDescription")}
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-2xl font-bold">
                {t("publicPages.aboutPage.missionTitle")}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t("publicPages.aboutPage.missionDescription")}
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-2xl font-bold">
                {t("publicPages.aboutPage.visionTitle")}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t("publicPages.aboutPage.visionDescription")}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Why choose us */}
      <Section variant="compact">
        <Container size="narrow">
          <h2 className="mb-6 text-2xl font-bold">
            {t("publicPages.aboutPage.whyChooseUsTitle")}
          </h2>
          <ul className="space-y-3">
            {whyItems.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-primary mt-0.5 shrink-0 text-lg">{"✓"}</span>
                <span className="text-muted-foreground leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Values */}
      <Section>
        <Container size="narrow">
          <SectionHeader
            heading={t("publicPages.aboutPage.valuesTitle")}
            subheading={t("publicPages.aboutPage.valuesDescription")}
          />
          <Grid cols={3} gap="compact" className="mt-8">
            {values.map((v) => (
              <div key={v.title} className="rounded-xl border p-5">
                <h3 className="mb-2 font-semibold">{v.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Founder */}
      <Section variant="compact">
        <Container size="narrow">
          <div className="rounded-xl border bg-muted/20 p-8">
            <h2 className="mb-2 text-2xl font-bold">
              {t("publicPages.aboutPage.founderTitle")}
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {t("publicPages.aboutPage.founderDescription")}
            </p>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-bold">
                M
              </div>
              <div>
                <p className="font-semibold">
                  {t("publicPages.aboutPage.founderName")}
                </p>
                <p className="text-muted-foreground text-sm">
                  {t("publicPages.aboutPage.founderRole")}
                </p>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {t("publicPages.aboutPage.founderBio")}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section variant="compact">
        <Container size="narrow">
          <div className="rounded-xl border bg-muted/30 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold">
              {t("publicPages.aboutPage.ctaTitle")}
            </h2>
            <p className="text-muted-foreground mx-auto mb-6 max-w-xl leading-relaxed">
              {t("publicPages.aboutPage.ctaDescription")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <LinkButton href="/contact" size="lg">
                {t("publicPages.aboutPage.ctaPrimary")}
              </LinkButton>
              <LinkButton href="/work" size="lg" variant="outline">
                {t("publicPages.aboutPage.ctaSecondary")}
              </LinkButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
