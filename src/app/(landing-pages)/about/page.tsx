"use client";

import { AboutCtaSection } from "./_components/cta-section";
import { AboutFounderSection } from "./_components/founder-section";
import { AboutHeroSection } from "./_components/hero-section";
import { AboutStatsSection } from "./_components/stats-section";
import { AboutStorySection } from "./_components/story-section";
import { AboutValuesSection } from "./_components/values-section";

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
