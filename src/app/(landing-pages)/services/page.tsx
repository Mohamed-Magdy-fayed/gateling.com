import {
  ArrowRightIcon,
  Compass,
  Hammer,
  Laptop,
  Layers,
  type LucideProps,
  PenTool,
  Rocket,
  Router,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";

import { LinkButton } from "@/components/general/link-button";
import {
  CardHeading,
  CheckItem,
  Container,
  ContentCard,
  Grid,
  HeroContainer,
  IconBox,
  PageHeading,
  ProseText,
  Section,
  SectionHeader,
} from "@/components/ui/containers";
import { getT } from "@/features/core/i18n/server";
import { api } from "@/integrations/trpc/server";
import { canonicalUrl } from "@/lib/json-ld";
import { ServiceIcon } from "./_service-icon";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("publicPages.servicesPage.metaTitle"),
    description: t("publicPages.servicesPage.metaDescription"),
    alternates: { canonical: canonicalUrl("/services") },
  };
}

export default async function ServicesPage() {
  const { t } = await getT();
  const caller = await api();
  const services = await caller.servicesMgmt.publicList().catch(() => []);

  const toolGroups: {
    Icon: ComponentType<LucideProps>;
    title: string;
    items: string;
  }[] = [
      {
        Icon: Laptop,
        title: t("publicPages.servicesPage.toolGroupInterfaceTitle"),
        items: t("publicPages.servicesPage.toolGroupInterfaceItems"),
      },
      {
        Icon: Layers,
        title: t("publicPages.servicesPage.toolGroupFrontendTitle"),
        items: t("publicPages.servicesPage.toolGroupFrontendItems"),
      },
      {
        Icon: Router,
        title: t("publicPages.servicesPage.toolGroupBackendTitle"),
        items: t("publicPages.servicesPage.toolGroupBackendItems"),
      },
      {
        Icon: Wrench,
        title: t("publicPages.servicesPage.toolGroupDevopsTitle"),
        items: t("publicPages.servicesPage.toolGroupDevopsItems"),
      },
    ];

  const timelineSteps: {
    Icon: ComponentType<LucideProps>;
    title: string;
    description: string;
  }[] = [
      {
        Icon: Compass,
        title: t("publicPages.servicesPage.timelineStep1Title"),
        description: t("publicPages.servicesPage.timelineStep1Description"),
      },
      {
        Icon: PenTool,
        title: t("publicPages.servicesPage.timelineStep2Title"),
        description: t("publicPages.servicesPage.timelineStep2Description"),
      },
      {
        Icon: Hammer,
        title: t("publicPages.servicesPage.timelineStep3Title"),
        description: t("publicPages.servicesPage.timelineStep3Description"),
      },
      {
        Icon: Rocket,
        title: t("publicPages.servicesPage.timelineStep4Title"),
        description: t("publicPages.servicesPage.timelineStep4Description"),
      },
    ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": services.map((service) => ({
      "@type": "Service",
      name: service.title,
      description: service.shortDescription,
      provider: { "@id": "https://gateling.com/#org" },
      // Each entry points at its own detail page, not the hub — otherwise
      // every Service in the graph claims the same URL.
      url: canonicalUrl(`/services/${service.slug}`),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroContainer>
        <Container className="text-center">
          <PageHeading>{t("publicPages.servicesPage.heading")}</PageHeading>
          <ProseText size="lg" className="mx-auto mt-4 max-w-2xl">
            {t("publicPages.servicesPage.heroDescription")}
          </ProseText>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/contact">
              {t("publicPages.servicesPage.heroPrimary")}
            </LinkButton>
            <LinkButton href="/work" variant="outline">
              {t("publicPages.servicesPage.heroSecondary")}
            </LinkButton>
          </div>
        </Container>
      </HeroContainer>

      <Section variant="alternate">
        <Container size="narrow" className="text-center">
          <SectionHeader
            heading={t("publicPages.servicesPage.introTitle")}
            subheading={t("publicPages.servicesPage.introDescription")}
            className="mb-0"
          />
        </Container>
      </Section>

      <Section variant="feature">
        <Container>
          <SectionHeader
            heading={t("publicPages.servicesPage.servicesGridTitle")}
            subheading={t("publicPages.servicesPage.servicesGridDescription")}
          />
          <Grid cols={2} className="mt-8">
            {services.map((service, index) => {
              const featuredImageUrl =
                service.media?.find((m) => m.isFeatured)?.url ??
                service.coverImageUrl;
              return (
                // The whole card is the link to the detail page. Before Phase 1
                // these cards were the only representation of a service and led
                // nowhere, so /services was a dead end for both readers and
                // crawlers.
                <Link
                  key={service.id}
                  href={`/services/${service.slug}`}
                  className="group block"
                >
                  <ContentCard className="flex h-full flex-col overflow-hidden p-0">
                    {featuredImageUrl ? (
                      <div className="relative aspect-video w-full overflow-hidden">
                        <Image
                          src={featuredImageUrl}
                          alt={service.title}
                          fill
                          priority={index === 0}
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    ) : (
                      <div className="px-6 pt-6">
                        <ServiceIcon name={service.icon} />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      <CardHeading className="group-hover:text-primary mb-3 transition-colors">
                        {service.title}
                      </CardHeading>
                      <ProseText size="sm" className="mb-5">
                        {service.shortDescription}
                      </ProseText>
                      <div className="space-y-2">
                        {service.features.map((f) => (
                          <CheckItem key={f}>{f}</CheckItem>
                        ))}
                      </div>
                      <span className="text-primary mt-5 inline-flex items-center gap-1.5 text-sm font-medium">
                        {t("publicPages.servicesPage.cardCta")}
                        <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                      </span>
                    </div>
                  </ContentCard>
                </Link>
              );
            })}
          </Grid>
        </Container>
      </Section>

      <Section variant="alternate">
        <Container>
          <SectionHeader
            heading={t("publicPages.servicesPage.toolsetTitle")}
            subheading={t("publicPages.servicesPage.toolsetDescription")}
          />
          <Grid cols={2} className="mt-8">
            {toolGroups.map(({ Icon, title, items }) => (
              <ContentCard key={title} className="group">
                <IconBox icon={Icon} className="mb-4" />
                <CardHeading className="mb-2">{title}</CardHeading>
                <ProseText size="sm">{items}</ProseText>
              </ContentCard>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section variant="feature">
        <Container>
          <SectionHeader
            heading={t("publicPages.servicesPage.timelineTitle")}
            subheading={t("publicPages.servicesPage.timelineDescription")}
          />
          <Grid cols={2} className="mt-8">
            {timelineSteps.map(({ Icon, title, description }) => (
              <ContentCard key={title} className="group relative">
                <div className="pointer-events-none absolute inset-0 rounded-xl border border-dashed opacity-40" />
                <IconBox icon={Icon} size="sm" className="mb-4" />
                <CardHeading className="mb-2">{title}</CardHeading>
                <ProseText size="sm">{description}</ProseText>
              </ContentCard>
            ))}
          </Grid>
        </Container>
      </Section>

      <Section variant="cta">
        <Container size="narrow" className="text-center">
          <SectionHeader
            heading={t("publicPages.servicesPage.ctaHeading")}
            subheading={t("publicPages.servicesPage.ctaDescription")}
          />
          <LinkButton href="/contact" size="lg">
            {t("publicPages.servicesPage.ctaButton")}
          </LinkButton>
        </Container>
      </Section>
    </>
  );
}
