"use client";

import { Users } from "lucide-react";
import { H2, H3, P } from "@/components/ui/typography";
import { useScrollAnimation } from "@/hooks/use-animation";
import { useTranslation } from "@/features/core/i18n/client";

export function AboutFounderSection() {
    const { t } = useTranslation();
    const founderAnimation = useScrollAnimation();

    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <div
                        ref={founderAnimation.elementRef}
                        className={`text-center mb-16 transition-all duration-1000 ${founderAnimation.isVisible
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-10"
                            }`}
                    >
                        <H2 className="mb-4">{t("about.founder.title")}</H2>
                        <P className="text-muted-foreground max-w-2xl mx-auto">
                            {t("about.founder.description")}
                        </P>
                    </div>

                    <div
                        className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-1000 delay-300 ${founderAnimation.isVisible
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-10"
                            }`}
                    >
                        <div className="text-center md:text-left">
                            <div className="w-32 h-32 rounded-full bg-orange-100 dark:bg-orange-900/20 mx-auto md:mx-0 mb-6 flex items-center justify-center hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors duration-300 group">
                                <Users className="w-16 h-16 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <H3 className="text-2xl mb-2">{t("about.founder.name")}</H3>
                            <P className="text-orange-600 dark:text-orange-400 font-medium mb-4">
                                {t("about.founder.role")}
                            </P>
                        </div>
                        <div>
                            <P className="text-muted-foreground leading-relaxed mb-6">
                                {t("about.founder.bio")}
                            </P>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                                <H3 className="text-lg mb-4">{t("about.founder.journey.title")}</H3>
                                <P className="text-muted-foreground text-sm leading-relaxed">
                                    {t("about.founder.journey.description")}
                                </P>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
