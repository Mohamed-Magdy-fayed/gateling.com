"use client";

import { H1, Lead } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import { useScrollAnimation } from "@/hooks/use-animation";

export function AboutHeroSection() {
    const { t } = useTranslation();
    const heroAnimation = useScrollAnimation();

    return (
        <section className="py-20 bg-gradient-to-br from-orange-50 to-white dark:from-stone-900 dark:to-stone-800">
            <div
                ref={heroAnimation.elementRef}
                className={`container mx-auto px-4 text-center transition-all duration-1000 ${heroAnimation.isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-10"
                    }`}
            >
                <H1 className="mb-6 max-w-4xl mx-auto">{t("about.hero.title")}</H1>
                <Lead className="mb-8 max-w-2xl mx-auto text-muted-foreground">
                    {t("about.hero.description")}
                </Lead>
            </div>
        </section>
    );
}
