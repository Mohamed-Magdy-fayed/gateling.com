import { CheckCircle } from "lucide-react";
import { H2, H3, P } from "@/components/ui/typography";
import { getT } from "@/features/core/i18n/server";

export async function AboutStorySection() {
    const { t } = await getT();

    const reasons = [
        t("about.whyChooseUs.exceptionalSupport"),
        t("about.whyChooseUs.scalableSolutions"),
        t("about.whyChooseUs.userCentricInterface"),
        t("about.whyChooseUs.comprehensiveToolset"),
        t("about.whyChooseUs.costReduction"),
    ];

    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16 scroll-reveal">
                        <H2 className="mb-6">{t("about.story.title")}</H2>
                        <P className="text-muted-foreground text-lg leading-relaxed">
                            {t("about.story.description")}
                        </P>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center scroll-reveal">
                        <div>
                            <H3 className="mb-4">{t("about.mission.title")}</H3>
                            <P className="text-muted-foreground mb-6">
                                {t("about.mission.description")}
                            </P>
                            <H3 className="mb-4">{t("about.vision.title")}</H3>
                            <P className="text-muted-foreground">
                                {t("about.vision.description")}
                            </P>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <H3 className="mb-4">{t("about.whyChooseUs.title")}</H3>
                            <ul className="space-y-3">
                                {reasons.map((reason) => (
                                    <li key={reason} className="flex items-start group gap-2">
                                        <CheckCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm">{reason}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
