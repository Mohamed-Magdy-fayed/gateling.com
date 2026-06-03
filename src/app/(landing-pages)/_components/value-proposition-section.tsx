import {
  AwardIcon,
  ClockIcon,
  HeadphonesIcon,
  ShieldIcon,
  SmartphoneIcon,
  TrendingUpIcon,
  UserIcon,
  ZapIcon,
} from "lucide-react";

import { Container, Grid, Section, SectionHeader } from "@/components/ui/containers";
import { getT } from "@/features/core/i18n/server";

export async function ValuePropositionSection() {
  const { t } = await getT();

  const mainBenefits = [
    {
      Icon: ZapIcon,
      title: t("publicPages.valueProposition.benefit1Title"),
      description: t("publicPages.valueProposition.benefit1Description"),
    },
    {
      Icon: SmartphoneIcon,
      title: t("publicPages.valueProposition.benefit2Title"),
      description: t("publicPages.valueProposition.benefit2Description"),
    },
    {
      Icon: UserIcon,
      title: t("publicPages.valueProposition.benefit3Title"),
      description: t("publicPages.valueProposition.benefit3Description"),
    },
    {
      Icon: ShieldIcon,
      title: t("publicPages.valueProposition.benefit4Title"),
      description: t("publicPages.valueProposition.benefit4Description"),
    },
  ];

  const partnerBenefits = [
    {
      Icon: ClockIcon,
      title: t("publicPages.valueProposition.partner1Title"),
      description: t("publicPages.valueProposition.partner1Description"),
    },
    {
      Icon: HeadphonesIcon,
      title: t("publicPages.valueProposition.partner2Title"),
      description: t("publicPages.valueProposition.partner2Description"),
    },
    {
      Icon: TrendingUpIcon,
      title: t("publicPages.valueProposition.partner3Title"),
      description: t("publicPages.valueProposition.partner3Description"),
    },
    {
      Icon: AwardIcon,
      title: t("publicPages.valueProposition.partner4Title"),
      description: t("publicPages.valueProposition.partner4Description"),
    },
  ];

  const stats = [
    {
      value: t("publicPages.valueProposition.stat1Value"),
      label: t("publicPages.valueProposition.stat1Label"),
    },
    {
      value: t("publicPages.valueProposition.stat2Value"),
      label: t("publicPages.valueProposition.stat2Label"),
    },
    {
      value: t("publicPages.valueProposition.stat3Value"),
      label: t("publicPages.valueProposition.stat3Label"),
    },
    {
      value: t("publicPages.valueProposition.stat4Value"),
      label: t("publicPages.valueProposition.stat4Label"),
    },
  ];

  return (
    <Section variant="muted">
      <Container>
        <SectionHeader
          heading={t("publicPages.valueProposition.heading")}
          subheading={t("publicPages.valueProposition.description")}
        />

        {/* 4 main benefit cards */}
        <Grid cols={4} className="mb-16">
          {mainBenefits.map(({ Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-xl border border-border/50 bg-background p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-bold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </Grid>

        {/* Partnership section */}
        <div className="rounded-2xl border border-border/50 bg-background p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h3 className="text-xl font-bold text-primary">
              {t("publicPages.valueProposition.partnershipHeader")}
            </h3>
          </div>
          <Grid cols={4} gap="compact">
            {partnerBenefits.map(({ Icon, title, description }) => (
              <div key={title} className="group text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-base font-bold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </Grid>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <p className="mb-2 text-3xl font-bold text-primary">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
