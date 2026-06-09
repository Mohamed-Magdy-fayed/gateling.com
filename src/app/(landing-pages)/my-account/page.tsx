import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LinkButton } from "@/components/general/link-button";
import { Badge } from "@/components/ui/badge";
import {
  CardHeading,
  Container,
  ContentCard,
  HeroContainer,
  PageHeading,
  ProseText,
  Section,
  SectionHeader,
} from "@/components/ui/containers";
import type { LeadStatus } from "@/drizzle/schema";
import { getCurrentUser } from "@/features/core/auth/nextjs/currentUser";
import { getLocaleCookie, getT } from "@/features/core/i18n/server";
import { api } from "@/integrations/trpc/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("publicPages.myAccountPage.metaTitle"),
    description: t("publicPages.myAccountPage.metaDescription"),
  };
}

const statusBadgeVariant: Record<
  LeadStatus,
  "secondary" | "outline" | "default" | "destructive"
> = {
  new: "secondary",
  contacted: "outline",
  qualified: "default",
  closed: "destructive",
};

export default async function MyAccountPage() {
  const user = await getCurrentUser({ redirectIfNotFound: true });

  if (user.role !== "customer") {
    redirect("/dashboard");
  }

  const { t } = await getT();
  const locale = await getLocaleCookie();
  const caller = await api();
  const leads = await caller.leads.myLeads().catch(() => []);

  const heading = user.name
    ? t("publicPages.myAccountPage.headingWithName", { name: user.name })
    : t("publicPages.myAccountPage.heading");

  function formatStatus(status: LeadStatus) {
    const map: Record<LeadStatus, string> = {
      new: t("publicPages.myAccountPage.statusNew"),
      contacted: t("publicPages.myAccountPage.statusContacted"),
      qualified: t("publicPages.myAccountPage.statusQualified"),
      closed: t("publicPages.myAccountPage.statusClosed"),
    };
    return map[status];
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString(locale === "ar" ? "ar-EG" : undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <>
      <HeroContainer>
        <Container size="narrow" className="text-center">
          <PageHeading>{heading}</PageHeading>
          <ProseText size="lg" className="mt-3">
            {t("publicPages.myAccountPage.subheading")}
          </ProseText>
          {user.email && (
            <ProseText size="sm" className="mt-1 text-muted-foreground">
              {user.email}
            </ProseText>
          )}
        </Container>
      </HeroContainer>

      <Section variant="alternate">
        <Container>
          <SectionHeader
            eyebrow={t("publicPages.myAccountPage.inquiriesSectionEyebrow")}
            heading={t("publicPages.myAccountPage.inquiriesSectionHeading")}
            subheading={t(
              "publicPages.myAccountPage.inquiriesSectionSubheading",
            )}
          />

          {leads.length === 0 ? (
            <ContentCard className="mt-8 flex flex-col items-center gap-4 p-10 text-center">
              <CardHeading>
                {t("publicPages.myAccountPage.noInquiriesHeading")}
              </CardHeading>
              <ProseText>
                {t("publicPages.myAccountPage.noInquiriesText")}
              </ProseText>
              <LinkButton href="/contact" className="mt-2">
                {t("publicPages.myAccountPage.noInquiriesButton")}
              </LinkButton>
            </ContentCard>
          ) : (
            <div className="mt-8 flex flex-col gap-4">
              {leads.map((lead) => {
                const messagePreview =
                  lead.message.length > 120
                    ? `${lead.message.slice(0, 120)}…`
                    : lead.message;

                return (
                  <ContentCard key={lead.id} className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        {lead.company && (
                          <p className="text-sm font-medium">
                            <span className="text-muted-foreground">
                              {t("publicPages.myAccountPage.companyLabel")}:{" "}
                            </span>
                            {lead.company}
                          </p>
                        )}
                        <p className="text-muted-foreground text-xs">
                          {t("publicPages.myAccountPage.submittedOn")}{" "}
                          {formatDate(lead.createdAt)}
                        </p>
                      </div>
                      <Badge variant={statusBadgeVariant[lead.status]}>
                        {formatStatus(lead.status)}
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                        {t("publicPages.myAccountPage.messageLabel")}
                      </p>
                      <ProseText size="sm">{messagePreview}</ProseText>
                    </div>
                  </ContentCard>
                );
              })}
            </div>
          )}
        </Container>
      </Section>

      <Section variant="cta">
        <Container size="narrow" className="text-center">
          <SectionHeader
            heading={t("publicPages.myAccountPage.ctaHeading")}
            subheading={t("publicPages.myAccountPage.ctaSubheading")}
          />
          <LinkButton href="/contact" size="lg">
            {t("publicPages.myAccountPage.ctaButton")}
          </LinkButton>
        </Container>
      </Section>
    </>
  );
}
