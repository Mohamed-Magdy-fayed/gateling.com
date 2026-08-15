import type { Metadata } from "next";

import { LinkButton } from "@/components/general/link-button";
import {
  Container,
  Grid,
  HeroContainer,
  PageHeading,
  ProseText,
  Section,
  SectionHeader,
} from "@/components/ui/containers";
import { getT } from "@/features/core/i18n/server";
import { api } from "@/integrations/trpc/server";
import { buildMetadata } from "@/lib/seo";

import { WorkCaseCard } from "../_components/work-case-card";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return buildMetadata({
    title: t("publicPages.workPage.metaTitle"),
    description: t("publicPages.workPage.metaDescription"),
    path: "/work",
  });
}

export default async function WorkPage() {
  const { t } = await getT();
  const caller = await api();
  const cases = await caller.caseStudies.publicList().catch(() => []);

  return (
    <>
      <HeroContainer>
        <Container className="text-center">
          <PageHeading>{t("publicPages.workPage.heading")}</PageHeading>
          <ProseText size="lg" className="mx-auto mt-4 max-w-2xl">
            {t("publicPages.workPage.heroDescription")}
          </ProseText>
        </Container>
      </HeroContainer>

      <Section variant="feature">
        <Container>
          {cases.length === 0 && (
            <ProseText className="text-center">
              {t("publicPages.workPage.noResults")}
            </ProseText>
          )}
          <Grid cols={2} gap="compact">
            {cases.map((cs, index) => (
              <WorkCaseCard
                key={cs.slug}
                cs={cs}
                variant="preview"
                priority={index === 0}
              />
            ))}
          </Grid>
        </Container>
      </Section>

      <Section variant="cta">
        <Container size="narrow" className="text-center">
          <SectionHeader
            heading={t("publicPages.workPage.ctaDescription")}
            className="mb-6"
          />
          <LinkButton href="/contact" size="lg">
            {t("publicPages.workPage.ctaButton")}
          </LinkButton>
        </Container>
      </Section>
    </>
  );
}
