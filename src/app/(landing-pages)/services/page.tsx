import {
  Bot,
  CheckCircle2,
  Code,
  Compass,
  Cpu,
  Globe,
  Hammer,
  Laptop,
  Layers,
  LayoutDashboard,
  type LucideProps,
  Map as MapIcon,
  PenTool,
  RefreshCw,
  Rocket,
  Router,
  Settings,
  Wrench,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import type { ComponentType } from "react";

import { LinkButton } from "@/components/general/link-button";
import {
  CardHeading,
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

const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  Bot,
  Code,
  Cpu,
  Globe,
  LayoutDashboard,
  Map: MapIcon,
  RefreshCw,
  Settings,
  Zap,
};

function ServiceIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name] ?? Zap;
  return <Icon className="text-primary h-10 w-10" />;
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("publicPages.servicesPage.metaTitle"),
    description: t("publicPages.servicesPage.metaDescription"),
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

  return (
    <>
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
            {services.map((service) => (
              <ContentCard key={service.id}>
                <div className="mb-4">
                  <ServiceIcon name={service.icon} />
                </div>
                <CardHeading className="mb-3">{service.title}</CardHeading>
                <ProseText size="sm" className="mb-5">
                  {service.shortDescription}
                </ProseText>
                <ul className="space-y-2">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="text-primary h-4 w-4 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </ContentCard>
            ))}
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
