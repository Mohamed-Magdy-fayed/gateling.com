import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { LinkButton } from "@/components/general/link-button";
import { Container, Section } from "@/components/ui/containers";
import { H1, Lead } from "@/components/ui/typography";
import { getCurrentUser } from "@/features/core/auth/nextjs/currentUser";
import { getLocaleCookie, getT } from "@/features/core/i18n/server";
import { api } from "@/integrations/trpc/server";
import { buildMetadata } from "@/lib/seo";
import feedbackAr from "../_translations/feedback-ar";
import feedbackEn from "../_translations/feedback-en";
import { FeedbackForm } from "./_components/feedback-form";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ linkExpired?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return buildMetadata({
    title: t("publicPages.feedbackPage.metaTitle"),
    description: t("publicPages.feedbackPage.metaDescription"),
    path: "/feedback",
    noindex: true,
  });
}

export default async function FeedbackPage({ params, searchParams }: Props) {
  const { slug } = await params;

  const session = await getCurrentUser();
  if (!session) {
    // The client reached this page via an expired magic link — these accounts
    // have no usable password, so a sign-in redirect would be a dead end.
    const { linkExpired } = await searchParams;
    if (linkExpired) {
      const { t } = await getT();
      return (
        <Section>
          <Container className="max-w-md space-y-5 text-center">
            <H1>{t("publicPages.feedbackPage.linkExpiredTitle")}</H1>
            <Lead>{t("publicPages.feedbackPage.linkExpiredMessage")}</Lead>
            <LinkButton href="/contact" size="lg">
              {t("publicPages.feedbackPage.linkExpiredCta")}
            </LinkButton>
          </Container>
        </Section>
      );
    }
    redirect(`/sign-in?returnTo=/feedback/${slug}`);
  }

  const locale = await getLocaleCookie();
  const featureMap =
    locale === "ar" ? feedbackAr.projectFeatures : feedbackEn.projectFeatures;
  const projectFeatures =
    (featureMap as Record<string, readonly string[]>)[slug] ?? [];

  const caller = await api();
  let data: Awaited<ReturnType<typeof caller.clientFeedback.getForCaseStudy>>;
  try {
    data = await caller.clientFeedback.getForCaseStudy({ slug });
  } catch {
    notFound();
  }

  return (
    <Section>
      <Container className="max-w-2xl">
        <FeedbackForm
          caseStudy={data.caseStudy}
          testimonial={data.testimonial}
          user={data.user}
          projectFeatures={projectFeatures}
        />
      </Container>
    </Section>
  );
}
