"use client";

import {
    GraduationCap,
    Handshake,
    Lightbulb,
    Shield,
    Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { H2, P } from "@/components/ui/typography";
import { useScrollAnimation } from "@/hooks/use-animation";
import { useTranslation } from "@/features/core/i18n/client";

const valuesList = [
    { key: "innovation", Icon: Lightbulb },
    { key: "studentSuccess", Icon: GraduationCap },
    { key: "operationalExcellence", Icon: Target },
    { key: "partnership", Icon: Handshake },
    { key: "integrity", Icon: Shield },
] as const;

export function AboutValuesSection() {
    const { t } = useTranslation();
    const valuesAnimation = useScrollAnimation();

    return (
        <section className="py-20">
            <div className="container mx-auto px-4">
                <div
                    ref={valuesAnimation.elementRef}
                    className={`text-center mb-16 transition-all duration-1000 ${valuesAnimation.isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-10"
                        }`}
                >
                    <H2 className="mb-4">{t("about.values.title")}</H2>
                    <P className="text-muted-foreground max-w-2xl mx-auto">
                        {t("about.values.description")}
                    </P>
                </div>

                <div
                    className={`grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 transition-all duration-1000 delay-300 ${valuesAnimation.isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-10"
                        }`}
                >
                    {valuesList.map(({ key, Icon }) => {
                        return (
                            <Card
                                key={key}
                                className="text-center h-full hover:shadow-lg hover:-translate-y-2 transition-all duration-300 group"
                            >
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30 transition-colors duration-300">
                                        <Icon className="w-6 h-6 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                                    </div>
                                    <CardTitle className="text-lg">
                                        {t(`about.values.${key}.title`)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <P className="text-muted-foreground text-sm">
                                        {t(`about.values.${key}.description`)}
                                    </P>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
