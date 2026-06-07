import type { Metadata } from "next";

import { LinkButton } from "@/components/general/link-button";
import {
  Container,
  ContentCard,
  HeroContainer,
  PageHeading,
  ProseText,
  Section,
  SectionHeader,
} from "@/components/ui/containers";
import { getT } from "@/features/core/i18n/server";
import { generateWhatsAppUrl } from "@/lib/phone";

import { ContactForm } from "./_components/contact-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("publicPages.contactPage.metaTitle"),
    description: t("publicPages.contactPage.metaDescription"),
  };
}

export default async function ContactPage() {
  const { t } = await getT();
  const whatsappUrl = generateWhatsAppUrl(
    "+201000000000",
    t("publicPages.contactPage.whatsappMessage"),
  );

  const contactMethods = [
    {
      icon: "📧",
      label: t("publicPages.contactPage.emailLabel"),
      value: t("publicPages.contactPage.emailValue"),
      href: "mailto:info@gateling.com",
    },
    {
      icon: "📞",
      label: t("publicPages.contactPage.phoneLabel"),
      value: t("publicPages.contactPage.phoneValue"),
      href: undefined,
    },
    {
      icon: "💬",
      label: t("publicPages.contactPage.whatsappLabel"),
      value: t("publicPages.contactPage.whatsappValue"),
      href: whatsappUrl,
    },
    {
      icon: "📅",
      label: t("publicPages.contactPage.meetingLabel"),
      value: t("publicPages.contactPage.meetingValue"),
      href: undefined,
    },
  ];

  const faqItems = [
    {
      q: t("publicPages.contactPage.faq1Q"),
      a: t("publicPages.contactPage.faq1A"),
    },
    {
      q: t("publicPages.contactPage.faq2Q"),
      a: t("publicPages.contactPage.faq2A"),
    },
    {
      q: t("publicPages.contactPage.faq3Q"),
      a: t("publicPages.contactPage.faq3A"),
    },
    {
      q: t("publicPages.contactPage.faq4Q"),
      a: t("publicPages.contactPage.faq4A"),
    },
  ];

  return (
    <>
      <HeroContainer>
        <Container size="wide">
          <div className="grid gap-12 md:grid-cols-2">
            {/* Left: heading + contact methods */}
            <div>
              <PageHeading>{t("publicPages.contactPage.heading")}</PageHeading>
              <ProseText size="lg" className="mt-4">
                {t("publicPages.contactPage.subheading")}
              </ProseText>

              <div className="mt-10 space-y-5">
                {contactMethods.map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <span className="mt-0.5 text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      {item.href ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <ProseText size="sm">{item.value}</ProseText>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <ProseText
                size="sm"
                className="mt-8 rounded-lg border bg-muted/30 px-4 py-3"
              >
                {t("publicPages.contactPage.availabilityInfo")}
              </ProseText>
            </div>

            {/* Right: form */}
            <ContactForm />
          </div>
        </Container>
      </HeroContainer>

      {/* FAQ */}
      <Section variant="alternate">
        <Container size="wide">
          <SectionHeader heading={t("publicPages.contactPage.faqTitle")} />
          <div className="mt-6 space-y-4">
            {faqItems.map((item) => (
              <ContentCard key={item.q} className="bg-muted/20 p-0">
                <details className="group px-5 py-4">
                  <summary className="cursor-pointer list-none font-semibold group-open:mb-3">
                    {item.q}
                  </summary>
                  <ProseText size="sm">{item.a}</ProseText>
                </details>
              </ContentCard>
            ))}
          </div>
        </Container>
      </Section>

      <Section variant="cta">
        <Container size="narrow" className="text-center">
          <SectionHeader
            heading={t("publicPages.contactPage.ctaHeading")}
            subheading={t("publicPages.contactPage.ctaSubheading")}
          />
          <LinkButton href="/contact" size="lg">
            {t("publicPages.contactPage.ctaButton")}
          </LinkButton>
        </Container>
      </Section>
    </>
  );
}
