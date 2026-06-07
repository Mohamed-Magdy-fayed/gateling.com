import {
  BarChart3Icon,
  Code2Icon,
  LayersIcon,
  MonitorIcon,
  Settings2Icon,
  SparklesIcon,
} from "lucide-react";

import { LinkButton } from "@/components/general/link-button";
import {
  CardHeading,
  Container,
  ContentCard,
  Grid,
  IconBox,
  ProseText,
  Section,
  SectionHeader,
} from "@/components/ui/containers";
import { getT } from "@/features/core/i18n/server";

const CAP_ICONS = [
  SparklesIcon,
  MonitorIcon,
  Code2Icon,
  LayersIcon,
  BarChart3Icon,
  Settings2Icon,
];

export async function CapabilitiesSection() {
  const { t } = await getT();

  const capabilities = [
    {
      title: t("publicPages.capabilities.cap1Name"),
      description: t("publicPages.capabilities.cap1Description"),
    },
    {
      title: t("publicPages.capabilities.cap2Name"),
      description: t("publicPages.capabilities.cap2Description"),
    },
    {
      title: t("publicPages.capabilities.cap3Name"),
      description: t("publicPages.capabilities.cap3Description"),
    },
    {
      title: t("publicPages.capabilities.cap4Name"),
      description: t("publicPages.capabilities.cap4Description"),
    },
    {
      title: t("publicPages.capabilities.cap5Name"),
      description: t("publicPages.capabilities.cap5Description"),
    },
    {
      title: t("publicPages.capabilities.cap6Name"),
      description: t("publicPages.capabilities.cap6Description"),
    },
  ];

  return (
    <Section variant="feature">
      <Container>
        <SectionHeader
          eyebrow={t("publicPages.capabilities.eyebrow")}
          heading={t("publicPages.capabilities.heading")}
          subheading={t("publicPages.capabilities.description")}
        />

        <Grid cols={3} className="mb-12">
          {capabilities.map(({ title, description }, i) => {
            const Icon = CAP_ICONS[i];
            return (
              <ContentCard key={title} className="group">
                <IconBox icon={Icon} className="mb-4" />
                <CardHeading className="mb-2">{title}</CardHeading>
                <ProseText size="sm">{description}</ProseText>
              </ContentCard>
            );
          })}
        </Grid>

        <ContentCard className="border-primary/20 bg-linear-to-r from-primary/5 to-primary/10 text-center">
          <CardHeading className="mb-4 text-2xl font-bold">
            {t("publicPages.capabilities.ctaTitle")}
          </CardHeading>
          <ProseText size="base" className="mx-auto mb-6 max-w-2xl">
            {t("publicPages.capabilities.ctaDescription")}
          </ProseText>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <LinkButton href="/services" size="lg">
              {t("publicPages.capabilities.ctaServices")}
            </LinkButton>
            <LinkButton href="/contact" variant="outline" size="lg">
              {t("publicPages.capabilities.ctaContact")}
            </LinkButton>
          </div>
          <ProseText size="sm" className="mt-4">
            {t("publicPages.capabilities.ctaNote")}
          </ProseText>
        </ContentCard>
      </Container>
    </Section>
  );
}
