import type { Metadata } from "next";

import { canonicalUrl } from "@/lib/json-ld";
import { AboutCtaSection } from "./_components/cta-section";
import { AboutFounderSection } from "./_components/founder-section";
import { AboutHeroSection } from "./_components/hero-section";
import { AboutStatsSection } from "./_components/stats-section";
import { AboutStorySection } from "./_components/story-section";
import { AboutValuesSection } from "./_components/values-section";

// Previously in a layout.tsx that existed only to hold this object. Metadata
// belongs on the page it describes — a metadata-only layout is an extra file to
// keep in sync and hides the title from anyone reading the page.
//
// The title is templated (`%s | Gateling Solutions` from the root layout), so it
// must not repeat the brand. It was the bare word "About", which said nothing
// about what the company does.
export const metadata: Metadata = {
    title: "About — Custom Software Specialists in Egypt & MENA",
    description:
        "Learn about Gateling Solutions — meet Mohamed Magdy, Founder & CEO. Discover the story, values, and vision behind our founder-led software engineering studio.",
    alternates: { canonical: canonicalUrl("/about") },
};

export default function AboutPage() {
    return (
        <div className="min-h-screen">
            <AboutHeroSection />
            <AboutStatsSection />
            <AboutStorySection />
            <AboutValuesSection />
            <AboutFounderSection />
            <AboutCtaSection />
        </div>
    );
}
