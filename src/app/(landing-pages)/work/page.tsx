import type { Metadata } from "next";

import { LinkButton } from "@/components/general/link-button";
import {
  Container,
  HeroContainer,
  PageHeading,
  ProseText,
  Section,
  SectionHeader,
} from "@/components/ui/containers";
import { getT } from "@/features/core/i18n/server";
import { api } from "@/integrations/trpc/server";

import { WorkCaseCard } from "../_components/work-case-card";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("publicPages.workPage.metaTitle"),
    description: t("publicPages.workPage.metaDescription"),
  };
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
            <p className="text-muted-foreground text-center">
              {t("publicPages.workPage.noResults")}
            </p>
          )}
          <div className="grid gap-6 sm:grid-cols-2">
            {cases.map((cs) => (
              <WorkCaseCard key={cs.slug} cs={cs} variant="preview" />
            ))}
          </div>
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
