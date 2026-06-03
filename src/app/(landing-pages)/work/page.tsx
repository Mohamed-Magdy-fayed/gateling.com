import type { Metadata } from "next";

import { LinkButton } from "@/components/general/link-button";
import { Container, Section } from "@/components/ui/containers";
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
      <Section variant="compact">
        <Container className="text-center">
          <h1 className="text-4xl font-bold md:text-5xl">
            {t("publicPages.workPage.heading")}
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
            {t("publicPages.workPage.heroDescription")}
          </p>
        </Container>
      </Section>

      <Section>
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

          <div className="mt-12 text-center">
            <p className="text-muted-foreground text-lg">
              {t("publicPages.workPage.ctaDescription")}
            </p>
            <LinkButton href="/contact" size="lg" className="mt-4">
              {t("publicPages.workPage.ctaButton")}
            </LinkButton>
          </div>
        </Container>
      </Section>
    </>
  );
}
