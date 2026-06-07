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

import {
  CardHeading,
  Container,
  ContentCard,
  Grid,
  IconBox,
  ProseText,
  Section,
  SectionHeader,
  Stat,
} from "@/components/ui/containers";
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
    <Section variant="alternate">
      <Container>
        <SectionHeader
          heading={t("publicPages.valueProposition.heading")}
          subheading={t("publicPages.valueProposition.description")}
        />

        {/* 4 main benefit cards */}
        <Grid cols={4} className="mb-16">
          {mainBenefits.map(({ Icon, title, description }) => (
            <ContentCard key={title} className="group">
              <IconBox icon={Icon} className="mb-4" />
              <CardHeading className="mb-2">{title}</CardHeading>
              <ProseText size="sm">{description}</ProseText>
            </ContentCard>
          ))}
        </Grid>

        {/* Partnership section */}
        <ContentCard className="p-8">
          <div className="mb-8 text-center">
            <h3 className="text-primary text-xl font-bold">
              {t("publicPages.valueProposition.partnershipHeader")}
            </h3>
          </div>
          <Grid cols={4} gap="compact">
            {partnerBenefits.map(({ Icon, title, description }) => (
              <div key={title} className="group text-center">
                <IconBox icon={Icon} size="lg" className="mx-auto mb-4" />
                <CardHeading className="mb-2">{title}</CardHeading>
                <ProseText size="sm">{description}</ProseText>
              </div>
            ))}
          </Grid>
        </ContentCard>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
          {stats.map(({ value, label }) => (
            <Stat key={label} value={value} label={label} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
