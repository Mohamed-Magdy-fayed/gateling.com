import type { Metadata } from "next";

import { getCurrentUser } from "@/features/core/auth/nextjs/currentUser";
import { getT } from "@/features/core/i18n/server";
import { HydrateClient, prefetch, trpc } from "@/integrations/trpc/server";
import { buildMetadata } from "@/lib/seo";

import { ContactPageContent } from "./_components/contact-page-content";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return buildMetadata({
    title: t("publicPages.contactPage.metaTitle"),
    description: t("publicPages.contactPage.metaDescription"),
    path: "/contact",
  });
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; reschedule?: string }>;
}) {
  const { t } = await getT();
  const [user] = await Promise.all([
    getCurrentUser(),
    prefetch(trpc.bookings.getAvailability.queryOptions()),
  ]);
  const { tab, reschedule } = await searchParams;
  const initialTab = tab === "message" ? "message" : "book";

  const faqItems = ([1, 2, 3, 4] as const).map((i) => ({
    q: t(`publicPages.contact.faq.questions.q${i}.question`),
    a: t(`publicPages.contact.faq.questions.q${i}.answer`),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HydrateClient>
        <ContactPageContent
          isSignedIn={user != null}
          initialTab={initialTab}
          rescheduleId={user != null ? (reschedule ?? null) : null}
        />
      </HydrateClient>
    </>
  );
}
