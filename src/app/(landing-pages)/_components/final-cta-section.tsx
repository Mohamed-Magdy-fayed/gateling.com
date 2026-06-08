import {
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  MailIcon,
  MessageCircleIcon,
} from "lucide-react";
import { AnchorButton, LinkButton } from "@/components/general/link-button";
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
import { generateWhatsAppUrl } from "@/lib/phone";

export async function FinalCtaSection() {
  const { t } = await getT();

  const whatsappUrl = generateWhatsAppUrl(
    "+201000000000",
    t("publicPages.finalCta.whatsappMessage"),
  );

  const urgencyFactors = [
    t("publicPages.finalCta.urgency1"),
    t("publicPages.finalCta.urgency2"),
    t("publicPages.finalCta.urgency3"),
    t("publicPages.finalCta.urgency4"),
  ] as string[];

  const contactMethods = [
    {
      Icon: CalendarIcon,
      title: t("publicPages.finalCta.method1Title"),
      description: t("publicPages.finalCta.method1Description"),
      action: t("publicPages.finalCta.method1Action"),
      href: "/contact",
      external: false,
    },
    {
      Icon: MailIcon,
      title: t("publicPages.finalCta.method2Title"),
      description: t("publicPages.finalCta.method2Description"),
      action: t("publicPages.finalCta.method2Action"),
      value: t("publicPages.finalCta.method2Value"),
      href: "mailto:info@gateling.com",
      external: true,
    },
    {
      Icon: MessageCircleIcon,
      title: t("publicPages.finalCta.method3Title"),
      description: t("publicPages.finalCta.method3Description"),
      action: t("publicPages.finalCta.method3Action"),
      value: t("publicPages.finalCta.method3Value"),
      href: whatsappUrl,
      external: true,
    },
  ];

  return (
    <Section variant="cta" className="relative overflow-hidden">
      {/* Background blurs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <SectionHeader
            heading={t("publicPages.finalCta.mainCtaTitle")}
            subheading={t("publicPages.finalCta.mainCtaDescription")}
          />

          {/* CTA buttons */}
          <div className="-mt-4 mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <LinkButton
              href="/contact"
              size="lg"
              className="min-w-[200px] px-8 py-6 text-lg"
            >
              {t("publicPages.finalCta.ctaButton")}
              <ArrowRightIcon className="ms-2 h-5 w-5 rtl:-scale-x-100" />
            </LinkButton>
            <LinkButton
              href="/work"
              variant="outline"
              size="lg"
              className="min-w-[200px] px-8 py-6 text-lg"
            >
              {t("publicPages.finalCta.browseButton")}
            </LinkButton>
          </div>

          {/* Urgency factors */}
          <div className="mb-12 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            {urgencyFactors.map((factor) => (
              <div key={factor} className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-primary" />
                <span>{factor}</span>
              </div>
            ))}
          </div>

          {/* Contact method cards */}
          <ContentCard className="p-8 backdrop-blur">
            <h3 className="text-primary mb-6 text-xl font-bold">
              {t("publicPages.finalCta.contactHeader")}
            </h3>

            <Grid cols={3}>
              {contactMethods.map(
                ({
                  Icon,
                  title,
                  description,
                  action,
                  value,
                  href,
                  external,
                }) => (
                  <div key={title} className="group text-center">
                    <IconBox icon={Icon} size="lg" className="mx-auto mb-4" />
                    <CardHeading className="mb-2">{title}</CardHeading>
                    <ProseText size="sm" className="mb-3">
                      {description}
                    </ProseText>
                    {value && (
                      <p className="mb-3 text-sm font-medium">{value}</p>
                    )}
                    {external ? (
                      <AnchorButton
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outline"
                        size="sm"
                      >
                        {action}
                      </AnchorButton>
                    ) : (
                      <LinkButton href={href} variant="outline" size="sm">
                        {action}
                      </LinkButton>
                    )}
                  </div>
                ),
              )}
            </Grid>
          </ContentCard>

          {/* Final reassurance */}
          <div className="mt-12">
            <ProseText size="base">
              {t("publicPages.finalCta.reassurance1")}
            </ProseText>
            <ProseText size="sm" className="mt-2">
              {t("publicPages.finalCta.reassurance2")}
            </ProseText>
          </div>
        </div>
      </Container>
    </Section>
  );
}
