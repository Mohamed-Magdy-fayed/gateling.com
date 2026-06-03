import {
  BarChart3Icon,
  Code2Icon,
  LayersIcon,
  MonitorIcon,
  Settings2Icon,
  SparklesIcon,
} from "lucide-react";

import { LinkButton } from "@/components/general/link-button";
import { Container, Grid, Section, SectionHeader } from "@/components/ui/containers";
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
    <Section>
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
              <div
                key={title}
                className="group rounded-xl border border-border/50 bg-background p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-bold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            );
          })}
        </Grid>

        <div className="rounded-2xl border border-primary/20 bg-linear-to-r from-primary/5 to-primary/10 p-8 text-center">
          <h3 className="mb-4 text-2xl font-bold">
            {t("publicPages.capabilities.ctaTitle")}
          </h3>
          <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
            {t("publicPages.capabilities.ctaDescription")}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <LinkButton href="/services" size="lg">
              {t("publicPages.capabilities.ctaServices")}
            </LinkButton>
            <LinkButton href="/contact" variant="outline" size="lg">
              {t("publicPages.capabilities.ctaContact")}
            </LinkButton>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("publicPages.capabilities.ctaNote")}
          </p>
        </div>
      </Container>
    </Section>
  );
}
