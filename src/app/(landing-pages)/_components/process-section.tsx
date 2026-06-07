import {
  ArrowRightIcon,
  CodeIcon,
  LightbulbIcon,
  MessageSquareIcon,
  RocketIcon,
} from "lucide-react";

import {
  CardHeading,
  Container,
  ContentCard,
  IconBox,
  ProseText,
  Section,
  SectionHeader,
  Stat,
} from "@/components/ui/containers";
import { getT } from "@/features/core/i18n/server";

const STEP_ICONS = [MessageSquareIcon, LightbulbIcon, CodeIcon, RocketIcon];

export async function ProcessSection() {
  const { t } = await getT();

  const steps = [
    {
      number: t("publicPages.process.step1Number"),
      title: t("publicPages.process.step1Title"),
      description: t("publicPages.process.step1Description"),
      details: [
        t("publicPages.process.step1Detail1"),
        t("publicPages.process.step1Detail2"),
      ] as string[],
    },
    {
      number: t("publicPages.process.step2Number"),
      title: t("publicPages.process.step2Title"),
      description: t("publicPages.process.step2Description"),
      details: [
        t("publicPages.process.step2Detail1"),
        t("publicPages.process.step2Detail2"),
      ] as string[],
    },
    {
      number: t("publicPages.process.step3Number"),
      title: t("publicPages.process.step3Title"),
      description: t("publicPages.process.step3Description"),
      details: [
        t("publicPages.process.step3Detail1"),
        t("publicPages.process.step3Detail2"),
      ] as string[],
    },
    {
      number: t("publicPages.process.step4Number"),
      title: t("publicPages.process.step4Title"),
      description: t("publicPages.process.step4Description"),
      details: [
        t("publicPages.process.step4Detail1"),
        t("publicPages.process.step4Detail2"),
      ] as string[],
    },
  ];

  const timeline = [
    {
      value: t("publicPages.process.timeline1Value"),
      label: t("publicPages.process.timeline1Label"),
    },
    {
      value: t("publicPages.process.timeline2Value"),
      label: t("publicPages.process.timeline2Label"),
    },
    {
      value: t("publicPages.process.timeline3Value"),
      label: t("publicPages.process.timeline3Label"),
    },
  ];

  return (
    <Section variant="feature">
      <Container>
        <SectionHeader
          eyebrow={t("publicPages.process.eyebrow")}
          heading={t("publicPages.process.heading")}
          subheading={t("publicPages.process.subheading")}
        />

        {/* Steps */}
        <div className="relative">
          {/* Connector line on desktop */}
          <div className="absolute top-24 hidden h-px w-full bg-border/50 lg:block" />

          <div className="grid gap-8 lg:grid-cols-4">
            {steps.map((step, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <div key={step.number} className="relative">
                  <ContentCard className="relative z-10">
                    {/* Step number badge */}
                    <div className="absolute -top-4 inset-s-6 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </div>

                    <div className="mb-4 pt-4">
                      <IconBox icon={Icon} />
                    </div>

                    <CardHeading className="mb-3">{step.title}</CardHeading>
                    <ProseText size="sm" className="mb-4">
                      {step.description}
                    </ProseText>

                    <ul className="space-y-2">
                      {step.details.map((detail) => (
                        <li
                          key={detail}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </ContentCard>

                  {/* Arrow between steps on mobile */}
                  {i < steps.length - 1 && (
                    <div className="my-6 flex justify-center lg:hidden">
                      <ArrowRightIcon className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline box */}
        <ContentCard className="mt-16 text-center">
          <h3 className="text-primary mb-6 text-xl font-bold">
            {t("publicPages.process.timelineTitle")}
          </h3>
          <div className="mx-auto grid max-w-2xl gap-6 sm:grid-cols-3">
            {timeline.map(({ value, label }) => (
              <Stat key={label} value={value} label={label} />
            ))}
          </div>
          <ProseText size="base" className="mt-6">
            {t("publicPages.process.timelineDescription")}
          </ProseText>
        </ContentCard>
      </Container>
    </Section>
  );
}
