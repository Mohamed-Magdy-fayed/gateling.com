import type { Metadata } from "next";

import { getT } from "@/features/core/i18n/server";
import { getPublicChatSettings } from "@/features/system/settings/server/public-settings";
import { BUSINESS_WHATSAPP_NUMBER, generateWhatsAppUrl } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";
import styles from "./_components/motion/motion.module.css";
import { MotionCapabilities } from "./_components/motion/motion-capabilities";
import { MotionFinalCta } from "./_components/motion/motion-final-cta";
import { MotionHero } from "./_components/motion/motion-hero";
import { MotionProcess } from "./_components/motion/motion-process";
import { MotionReveal } from "./_components/motion/motion-reveal";
import { MotionStatement } from "./_components/motion/motion-statement";
import { NewsletterSection } from "./_components/newsletter-section";
import { TestimonialsSection } from "./_components/testimonials-section";
import { WorkPreviewSection } from "./_components/work-preview-section";

export const metadata: Metadata = buildMetadata({
  // Shares its primary keyword with the H1 ("custom software"). The previous
  // title — "Software Engineering & Product Design Studio" — was also the
  // /about H1 verbatim, so the two pages competed for the same phrase while
  // neither targeted the term buyers actually search.
  title: "Custom Software Development & Business Automation",
  description:
    "Custom software and business automation for growing businesses in Egypt & MENA. We build platforms that clear manual chaos and put every decision on live data.",
  path: "/",
});

/** Homepage. All motion is pure CSS (see `_components/motion/motion.module.css`). */
export default async function HomePage() {
  const { t } = await getT();
  const { whatsappNumber } = await getPublicChatSettings();
  // Keys below are built from numbered templates (stat1..4, cap1..6), so look them up untyped.
  const s = t as unknown as (key: string) => string;

  const capabilityNumbers = ["01", "02", "03", "04", "05", "06"];

  return (
    <main className={`${styles.page} overflow-x-clip`}>
      <MotionHero
        trust={[
          s("publicPages.hero.trustIndicator1"),
          s("publicPages.hero.trustIndicator2"),
          s("publicPages.hero.trustIndicator3"),
        ]}
        headlinePart1={s("publicPages.hero.headlinePart1")}
        headlinePart2={s("publicPages.hero.headlinePart2")}
        lead={s("publicPages.hero.leadText")}
        ctaContact={s("publicPages.hero.ctaContact")}
        ctaWork={s("publicPages.hero.ctaWork")}
        live={s("publicPages.hero.liveIndicator")}
      />

      <MotionStatement
        heading={s("publicPages.valueProposition.heading")}
        description={s("publicPages.valueProposition.description")}
        benefits={[
          s("publicPages.valueProposition.benefit1Title"),
          s("publicPages.valueProposition.benefit2Title"),
          s("publicPages.valueProposition.benefit3Title"),
          s("publicPages.valueProposition.benefit4Title"),
        ]}
        stats={[1, 2, 3, 4].map((n) => ({
          value: s(`publicPages.valueProposition.stat${n}Value`),
          label: s(`publicPages.valueProposition.stat${n}Label`),
        }))}
      />

      <MotionCapabilities
        eyebrow={s("publicPages.capabilities.eyebrow")}
        heading={s("publicPages.capabilities.heading")}
        items={capabilityNumbers.map((number, i) => ({
          number,
          title: s(`publicPages.capabilities.cap${i + 1}Name`),
          description: s(`publicPages.capabilities.cap${i + 1}Description`),
        }))}
        cta={{
          title: s("publicPages.capabilities.ctaTitle"),
          description: s("publicPages.capabilities.ctaDescription"),
          services: s("publicPages.capabilities.ctaServices"),
          contact: s("publicPages.capabilities.ctaContact"),
        }}
      />

      <MotionProcess
        eyebrow={s("publicPages.process.eyebrow")}
        heading={s("publicPages.process.heading")}
        steps={[1, 2, 3, 4].map((n) => ({
          number: s(`publicPages.process.step${n}Number`),
          title: s(`publicPages.process.step${n}Title`),
          description: s(`publicPages.process.step${n}Description`),
          details: [
            s(`publicPages.process.step${n}Detail1`),
            s(`publicPages.process.step${n}Detail2`),
          ],
        }))}
      />

      <MotionReveal variant="work">
        <WorkPreviewSection />
      </MotionReveal>
      <MotionReveal variant="testimonials">
        <TestimonialsSection />
      </MotionReveal>
      <MotionReveal variant="newsletter">
        <NewsletterSection />
      </MotionReveal>

      <MotionFinalCta
        title={s("publicPages.finalCta.mainCtaTitle")}
        description={s("publicPages.finalCta.mainCtaDescription")}
        primary={s("publicPages.finalCta.ctaButton")}
        secondary={s("publicPages.finalCta.browseButton")}
        perks={[
          s("publicPages.finalCta.urgency1"),
          s("publicPages.finalCta.urgency3"),
          s("publicPages.finalCta.urgency4"),
        ]}
        methodsHeading={s("publicPages.finalCta.contactHeader")}
        methods={[
          {
            icon: "calendar",
            title: s("publicPages.finalCta.method1Title"),
            action: s("publicPages.finalCta.method1Action"),
            href: "/contact",
          },
          {
            icon: "mail",
            title: s("publicPages.finalCta.method2Title"),
            action: s("publicPages.finalCta.method2Action"),
            href: "mailto:info@gateling.com",
          },
          {
            icon: "whatsapp",
            title: s("publicPages.finalCta.method3Title"),
            action: s("publicPages.finalCta.method3Action"),
            href: generateWhatsAppUrl(
              whatsappNumber ?? BUSINESS_WHATSAPP_NUMBER,
              s("publicPages.finalCta.whatsappMessage"),
            ),
          },
        ]}
      />
    </main>
  );
}
