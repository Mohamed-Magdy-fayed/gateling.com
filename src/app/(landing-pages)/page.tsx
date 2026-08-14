import type { Metadata } from "next";

import { canonicalUrl } from "@/lib/json-ld";
import { CapabilitiesSection } from "./_components/capabilities-section";
import { FinalCtaSection } from "./_components/final-cta-section";
import { HeroSection } from "./_components/hero-section";
import { NewsletterSection } from "./_components/newsletter-section";
import { ProcessSection } from "./_components/process-section";
import { TestimonialsSection } from "./_components/testimonials-section";
import { ValuePropositionSection } from "./_components/value-proposition-section";
import { WorkPreviewSection } from "./_components/work-preview-section";

export const metadata: Metadata = {
  // Shares its primary keyword with the H1 in `_components/hero-section.tsx`
  // ("custom software"). The previous title — "Software Engineering & Product
  // Design Studio" — was also the /about H1 verbatim, so the two pages competed
  // for the same phrase while neither targeted the term buyers actually search.
  title: "Custom Software Development & Business Automation",
  description:
    "Custom software and business automation for growing businesses in Egypt & MENA. We build platforms that clear manual chaos and put every decision on live data.",
  alternates: { canonical: canonicalUrl("/") },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ValuePropositionSection />
      <CapabilitiesSection />
      <WorkPreviewSection />
      <ProcessSection />
      <TestimonialsSection />
      <NewsletterSection />
      <FinalCtaSection />
    </>
  );
}
