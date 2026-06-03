import { ArrowRightIcon, CheckCircleIcon, StarIcon } from "lucide-react";

import { LinkButton } from "@/components/general/link-button";
import { Container, HeroContainer } from "@/components/ui/containers";
import { getT } from "@/features/core/i18n/server";

export async function HeroSection() {
  const { t } = await getT();

  const trustIndicators = [
    t("publicPages.hero.trustIndicator1"),
    t("publicPages.hero.trustIndicator2"),
    t("publicPages.hero.trustIndicator3"),
  ] as string[];

  const benefits = [
    t("publicPages.hero.benefit1"),
    t("publicPages.hero.benefit2"),
    t("publicPages.hero.benefit3"),
    t("publicPages.hero.benefit4"),
  ] as string[];

  return (
    <HeroContainer>
      <Container size="wide">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-8">
            {/* Trust indicators */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {trustIndicators.map((indicator) => (
                <div key={indicator} className="flex items-center gap-2">
                  <StarIcon className="h-4 w-4 fill-primary text-primary" />
                  <span>{indicator}</span>
                </div>
              ))}
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
                <span className="text-primary">
                  {t("publicPages.hero.headlinePart1")}
                </span>
                <span className="block">
                  {t("publicPages.hero.headlinePart2")}
                </span>
              </h1>
              <p className="max-w-xl text-lg text-foreground/80">
                {t("publicPages.hero.leadText")}
              </p>
            </div>

            {/* Benefits list */}
            <div className="space-y-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-2">
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-foreground/80">{benefit}</p>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-4 pt-2 sm:flex-row">
              <LinkButton href="/contact" size="lg" className="px-8 text-lg">
                {t("publicPages.hero.ctaContact")}
                <ArrowRightIcon className="ms-2 h-5 w-5 rtl:-scale-x-100" />
              </LinkButton>
              <LinkButton
                href="/work"
                variant="outline"
                size="lg"
                className="px-8 text-lg"
              >
                {t("publicPages.hero.ctaWork")}
              </LinkButton>
            </div>

            {/* Social proof */}
            <div className="border-t border-border/50 pt-8">
              <p className="mb-4 text-sm text-muted-foreground">
                {t("publicPages.hero.socialProof")}
              </p>
              <div className="flex items-center gap-6 opacity-50">
                <div className="h-8 w-20 rounded bg-muted" />
                <div className="h-8 w-20 rounded bg-muted" />
                <div className="h-8 w-20 rounded bg-muted" />
                <div className="h-8 w-20 rounded bg-muted" />
              </div>
            </div>
          </div>

          {/* Right column — visual */}
          <div className="relative hidden lg:block">
            <div className="relative rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 p-8 shadow-2xl">
              <div className="aspect-4/3 rounded-lg border border-border/50 bg-background p-6 shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-3/4 rounded bg-primary/20" />
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-5/6 rounded bg-muted" />
                    <div className="mt-4 h-8 w-1/3 rounded bg-primary" />
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <div className="h-16 rounded bg-muted" />
                    <div className="h-16 rounded bg-muted" />
                    <div className="h-16 rounded bg-muted" />
                  </div>
                </div>
              </div>

              {/* Floating check badge */}
              <div className="-inset-e-4 absolute -top-4 rounded-full bg-primary p-3 text-primary-foreground shadow-lg">
                <CheckCircleIcon className="h-6 w-6" />
              </div>

              {/* Live indicator */}
              <div className="-inset-s-4 absolute -bottom-4 rounded-lg border border-border bg-background p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  <span className="text-xs font-medium">
                    {t("publicPages.hero.liveIndicator")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </HeroContainer>
  );
}
