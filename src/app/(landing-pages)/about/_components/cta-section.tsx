import { LinkButton } from "@/components/general/link-button";
import { H2, P } from "@/components/ui/typography";
import { getT } from "@/features/core/i18n/server";

export async function AboutCtaSection() {
    const { t } = await getT();

    return (
        <section className="py-20">
            <div className="container mx-auto px-4 text-center">
                <div className="max-w-3xl mx-auto scroll-reveal">
                    <H2 className="mb-6">{t("about.cta.title")}</H2>
                    <P className="text-muted-foreground mb-8">
                        {t("about.cta.description")}
                    </P>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <LinkButton
                            href="/contact?tab=book#contact-form"
                            size="lg"
                            className="hover:scale-105 transition-transform duration-300"
                        >
                            {t("about.cta.primaryButton")}
                        </LinkButton>
                        <LinkButton
                            href="/work"
                            size="lg"
                            variant="outline"
                            className="hover:scale-105 transition-transform duration-300"
                        >
                            {t("about.cta.secondaryButton")}
                        </LinkButton>
                    </div>
                </div>
            </div>
        </section>
    );
}
