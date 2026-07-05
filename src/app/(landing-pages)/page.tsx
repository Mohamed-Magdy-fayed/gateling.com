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
  title: "Gateling Solutions — Software Engineering & Product Design Studio",
  description:
    "We partner with founders and operations leads to build custom platforms that clear the manual chaos, keep teams unified, and base every decision on live data. Egypt & MENA.",
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
