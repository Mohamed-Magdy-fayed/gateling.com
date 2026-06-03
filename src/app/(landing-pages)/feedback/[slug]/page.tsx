import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Container, Section } from "@/components/ui/containers";
import { getCurrentUser } from "@/features/core/auth/nextjs/currentUser";
import { getLocaleCookie, getT } from "@/features/core/i18n/server";
import { api } from "@/integrations/trpc/server";
import feedbackAr from "../_translations/feedback-ar";
import feedbackEn from "../_translations/feedback-en";
import { FeedbackForm } from "./_components/feedback-form";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("publicPages.feedbackPage.metaTitle"),
    description: t("publicPages.feedbackPage.metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function FeedbackPage({ params }: Props) {
  const { slug } = await params;

  const session = await getCurrentUser();
  if (!session) {
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
