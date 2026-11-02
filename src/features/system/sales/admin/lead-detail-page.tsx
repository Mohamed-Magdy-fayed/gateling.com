"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SocialPlatform } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { callTips } from "@/features/system/sales/lib/call-tips";
import {
  funnelFactsFromActivities,
  funnelPositionFor,
} from "@/features/system/sales/lib/funnel";
import { socialProfiles } from "@/features/system/sales/lib/social-profiles";
import {
  parseYesOutcome,
  yesAnswersFromActivities,
} from "@/features/system/sales/lib/yeses";
import { useTRPC } from "@/integrations/trpc/client";
import { toWhatsAppUrl } from "@/lib/phone";
import { BeforeYouCallCard } from "./components/client-account/before-you-call-card";
import { ClientHero } from "./components/client-account/client-hero";
import { GoogleMapsCard } from "./components/client-account/google-maps-card";
import { MapsListingDialog } from "./components/client-account/maps-listing-dialog";
import { MobileActionBar } from "./components/client-account/mobile-action-bar";
import { ReachStrip } from "./components/client-account/reach-strip";
import { SocialProfileDialog } from "./components/client-account/social-profile-dialog";
import { DemoMeetingCard } from "./components/demo-meeting-card";
import { LeadProgressCard } from "./components/funnel-stage";
import {
  LeadFormDialog,
  leadToFormValues,
} from "./components/lead-form-dialog";
import { QuickLogPopover } from "./components/quick-log-popover";

export function SalesLeadDetailPage({ leadId }: { leadId: string }) {
  const trpc = useTRPC();
  const { t, locale } = useTranslation();
  const [editOpen, setEditOpen] = useState(false);
  const [mapsOpen, setMapsOpen] = useState(false);
  const [socialTarget, setSocialTarget] = useState<SocialPlatform | null>(null);

  const { data, isPending } = useQuery(
    trpc.sales.byId.queryOptions({ id: leadId }),
  );

  if (isPending) return <LeadDetailSkeleton />;
  if (!data) return null;

  const { lead, activities } = data;
  const whatsappNumber = lead.whatsappPhone ?? lead.phone;
  const whatsappUrl = toWhatsAppUrl(whatsappNumber);
  const profiles = socialProfiles(lead);
  const followers = Object.fromEntries(
    profiles.map((p) => [p.platform, p.kind === "found" ? p.followers : null]),
  ) as Record<SocialPlatform, number | null>;
  const facebook = profiles.find((p) => p.platform === "facebook");
  const tips = callTips({
    whatsappName: lead.whatsappProfileName,
    rating: lead.mapsRating,
    reviewCount: lead.mapsReviewCount,
    followers,
  });
  const funnelPosition = funnelPositionFor({
    ...lead,
    ...funnelFactsFromActivities(activities),
  });
  const dateFormat = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex flex-col gap-6 pb-24 sm:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/sales/leads"
          className="inline-flex min-h-11 items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground focus-visible:underline"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4 rtl:rotate-180" />
          {t("sales.backToPipeline")}
        </Link>
        <div className="flex items-center gap-2">
          <Button size="lg" variant="outline" onClick={() => setEditOpen(true)}>
            <PencilIcon aria-hidden="true" />
            {t("common.edit")}
          </Button>
          <span className="hidden sm:inline-flex">
            <QuickLogPopover
              leadId={lead.id}
              triggerVariant="outline"
              triggerSize="lg"
            />
          </span>
        </div>
      </div>

      <ClientHero
        name={lead.name}
        nameAr={lead.nameAr}
        avatarUrl={facebook?.kind === "found" ? facebook.avatarUrl : null}
        status={lead.pipelineStatus}
        tier={lead.tier}
        category={lead.mapsCategory ?? lead.businessType}
        city={lead.city}
        phone={lead.phone}
        whatsappUrl={whatsappUrl}
      >
        <ReachStrip
          maps={{
            rating: lead.mapsRating,
            reviewCount: lead.mapsReviewCount,
            category: lead.mapsCategory,
            address: lead.address,
          }}
          profiles={profiles}
          whatsapp={{
            name: lead.whatsappProfileName,
            number: whatsappNumber,
            isBusiness: lead.whatsappIsBusiness,
            chatUrl: whatsappUrl,
          }}
          onEditMaps={() => setMapsOpen(true)}
          onEditSocial={(profile) => setSocialTarget(profile.platform)}
          onEditWhatsapp={() => setEditOpen(true)}
        />
      </ClientHero>

      <LeadProgressCard
        leadId={lead.id}
        position={funnelPosition}
        yesAnswers={yesAnswersFromActivities(activities)}
      />

      {/* Record layout: the timeline in the main column, everything you
          glance at in a side column. On phones the side column comes first,
          so the call tips sit above the history. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <aside className="flex flex-col gap-4 lg:col-start-3 lg:row-start-1">
          <BeforeYouCallCard tips={tips} />
          <DemoMeetingCard
            leadId={lead.id}
            meetingUrl={lead.demoMeetingUrl}
            isPending={
              lead.pipelineStatus === "demo_scheduled" &&
              !lead.demoMeetingUrl &&
              lead.nextActionAt != null &&
              lead.nextActionAt.getTime() > Date.now()
            }
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("sales.details")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <Row label={t("sales.fieldPhoneSecondary")}>
                <span className="font-mono text-xs" dir="ltr">
                  {lead.phoneSecondary ?? "—"}
                </span>
              </Row>
              <Row label={t("sales.fieldWhatsappStatus")}>
                <Badge
                  variant={
                    lead.whatsappStatus === "confirmed" ? "default" : "outline"
                  }
                >
                  {t("sales.whatsappStatuses", { status: lead.whatsappStatus })}
                </Badge>
              </Row>
              <Row label={t("sales.columnLastContacted")}>
                {lead.lastContactedAt
                  ? dateFormat.format(lead.lastContactedAt)
                  : t("sales.neverContacted")}
              </Row>
              <Row label={t("sales.columnNextAction")}>
                {lead.nextActionAt ? dateFormat.format(lead.nextActionAt) : "—"}
              </Row>
              <Row label={t("sales.columnFollowUps")}>{lead.followUpCount}</Row>
              {lead.sourceUrl && (
                <Row label={t("sales.sourceLink")}>
                  <a
                    href={lead.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-xs hover:underline"
                    dir="ltr"
                  >
                    {lead.sourceUrl}
                  </a>
                </Row>
              )}
              {lead.notes && (
                <Row label={t("sales.fieldNotes")}>
                  <span className="whitespace-pre-line text-xs">
                    {lead.notes}
                  </span>
                </Row>
              )}
            </CardContent>
          </Card>
          <GoogleMapsCard
            name={lead.name}
            address={lead.address}
            onEdit={() => setMapsOpen(true)}
          />
        </aside>

        <Card className="lg:col-span-2 lg:col-start-1 lg:row-start-1">
          <CardHeader className="gap-1">
            <CardTitle className="text-base">{t("sales.timeline")}</CardTitle>
            <p className="text-muted-foreground text-xs">
              {t("sales.timelineAppendOnly")}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-0 p-0">
            {activities.length === 0 && (
              <p className="p-6 text-muted-foreground text-sm">
                {t("sales.timelineEmpty")}
              </p>
            )}
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex flex-col gap-1 border-b p-4 last:border-b-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {t("sales.activityTypes", { type: activity.type })}
                  </Badge>
                  {activity.channel && (
                    <span className="text-muted-foreground text-xs">
                      {t("sales.channels", { channel: activity.channel })}
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {dateFormat.format(activity.occurredAt)}
                  </span>
                </div>
                {activity.outcome && (
                  <p className="text-sm">
                    {timelineOutcome(activity.type, activity.outcome, t)}
                  </p>
                )}
                {activity.notes && (
                  <p className="whitespace-pre-line text-muted-foreground text-xs">
                    {activity.notes}
                  </p>
                )}
                {activity.nextActionAt && (
                  <p className="text-muted-foreground text-xs">
                    {t("sales.activityNextAction")}:{" "}
                    {dateFormat.format(activity.nextActionAt)}
                    {activity.nextActionDoneAt && " ✓"}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <MobileActionBar
        leadId={lead.id}
        phone={lead.phone}
        whatsappUrl={whatsappUrl}
      />

      <LeadFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={leadToFormValues(lead)}
      />
      <MapsListingDialog
        open={mapsOpen}
        onOpenChange={setMapsOpen}
        leadId={lead.id}
        listing={lead}
      />
      {socialTarget && (
        <SocialProfileDialog
          open
          onOpenChange={(open) => !open && setSocialTarget(null)}
          leadId={lead.id}
          leadName={lead.name}
          platform={socialTarget}
          stored={lead.socialProfiles[socialTarget]}
        />
      )}
    </div>
  );
}

/** An outcome as the timeline shows it: yes ticks in words, the rest as typed. */
function timelineOutcome(
  type: string,
  outcome: string,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  const tick = parseYesOutcome(type, outcome);
  if (!tick) return outcome;
  const step = t("sales.yeses.stepShort", { step: tick.step });
  if (tick.answer === "yes") return t("sales.yeses.timelineYes", { step });
  if (tick.answer === "no") return t("sales.yeses.timelineNo", { step });
  return t("sales.yeses.timelineClear", { step });
}

/** Mirrors the loaded layout so nothing jumps when the data lands. */
function LeadDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" data-testid="lead-detail-loading">
      <Skeleton className="h-11 w-48" />
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-64 w-full" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-2" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span>{children}</span>
    </div>
  );
}
