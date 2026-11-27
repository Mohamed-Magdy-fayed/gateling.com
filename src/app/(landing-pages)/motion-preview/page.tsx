import type { Metadata } from "next";

import { getT } from "@/features/core/i18n/server";
import { buildMetadata } from "@/lib/seo";
import { NewsletterSection } from "../_components/newsletter-section";
import { TestimonialsSection } from "../_components/testimonials-section";
import { WorkPreviewSection } from "../_components/work-preview-section";
import styles from "./_components/motion.module.css";
import { MotionCapabilities } from "./_components/motion-capabilities";
import { MotionFinalCta } from "./_components/motion-final-cta";
import { MotionHero } from "./_components/motion-hero";
import { MotionProcess } from "./_components/motion-process";
import { MotionReveal } from "./_components/motion-reveal";
import { MotionStatement } from "./_components/motion-statement";

// Design exploration of the homepage with heavy scroll motion. Same copy as `/`.
export const metadata: Metadata = buildMetadata({
  title: "Custom Software Development & Business Automation",
  description:
    "Custom software and business automation for growing businesses in Egypt & MENA.",
  path: "/motion-preview",
  noindex: true,
});

export default async function MotionPreviewPage() {
  const { t } = await getT();
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
      />
    </main>
  );
}
