import { H1, Lead } from "@/components/ui/typography";
import { getT } from "@/features/core/i18n/server";

export async function AboutHeroSection() {
    const { t } = await getT();

    return (
        <section className="py-20 bg-gradient-to-br from-orange-50 to-white dark:from-stone-900 dark:to-stone-800">
            <div className="container mx-auto px-4 text-center scroll-reveal">
                <H1 className="mb-6 max-w-4xl mx-auto">{t("about.hero.title")}</H1>
                <Lead className="mb-8 max-w-2xl mx-auto text-muted-foreground">
                    {t("about.hero.description")}
                </Lead>
            </div>
        </section>
    );
}
