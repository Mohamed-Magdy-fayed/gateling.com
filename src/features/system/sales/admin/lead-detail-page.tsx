"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { H1 } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { toWhatsAppUrl } from "@/lib/phone";

import {
  LeadFormDialog,
  type LeadFormValues,
} from "./components/lead-form-dialog";
import { QuickLogPopover } from "./components/quick-log-popover";

export function SalesLeadDetailPage({ leadId }: { leadId: string }) {
  const trpc = useTRPC();
  const { t, locale } = useTranslation();
  const [editOpen, setEditOpen] = useState(false);

  const { data, isPending } = useQuery(
    trpc.sales.byId.queryOptions({ id: leadId }),
  );

  if (isPending) return <Skeleton className="h-96 w-full" />;
  if (!data) return null;

  const { lead, activities } = data;
  const whatsappUrl = toWhatsAppUrl(lead.phone);
  const dateFormat = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link
            href="/sales/leads"
            className="text-muted-foreground text-xs hover:underline"
          >
            ← {t("sales.backToPipeline")}
          </Link>
          <H1>{lead.name}</H1>
          {lead.nameAr && (
            <p className="text-muted-foreground text-sm">{lead.nameAr}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lead.phone && (
            <Button
              size="sm"
              variant="outline"
              render={(props) => (
                <a href={`tel:${lead.phone}`} {...props}>
                  {t("sales.callNow")}
                </a>
              )}
            />
          )}
          {whatsappUrl && (
            <Button
              size="sm"
              variant="outline"
              render={(props) => (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                >
                  {t("sales.openWhatsapp")}
                </a>
              )}
            />
          )}
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            {t("common.edit")}
          </Button>
          <QuickLogPopover leadId={lead.id} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">{t("sales.details")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Row label={t("sales.fieldStatus")}>
              <Badge variant="secondary">
                {t("sales.statuses", { status: lead.pipelineStatus })}
              </Badge>
            </Row>
            <Row label={t("sales.columnCity")}>
              {[lead.city, lead.area].filter(Boolean).join(" · ") || "—"}
            </Row>
            <Row label={t("sales.fieldAddress")}>{lead.address ?? "—"}</Row>
            <Row label={t("sales.fieldPhone")}>
              <span className="font-mono text-xs">{lead.phone ?? "—"}</span>
            </Row>
            <Row label={t("sales.fieldPhoneSecondary")}>
              <span className="font-mono text-xs">
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
            <Row label={t("sales.fieldWhatsappProfileName")}>
              {lead.whatsappProfileName ?? "—"}
            </Row>
            <Row label={t("sales.fieldTier")}>{lead.tier ?? "—"}</Row>
            <Row label={t("sales.fieldSocialFollowers")}>
              {lead.socialFollowers != null
                ? new Intl.NumberFormat(locale).format(lead.socialFollowers)
                : "—"}
            </Row>
            <Row label={t("sales.fieldBranchCount")}>
              {lead.branchCount ?? "—"}
            </Row>
            <Row label={t("sales.fieldBusinessType")}>
              {lead.businessType ?? "—"}
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

        <Card className="lg:col-span-2">
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
                  <p className="text-sm">{activity.outcome}</p>
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

      <LeadFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={toFormValues(lead)}
      />
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

type LeadRecord = {
  id: string;
  name: string;
  nameAr: string | null;
  city: string | null;
  area: string | null;
  address: string | null;
  phone: string | null;
  phoneSecondary: string | null;
  whatsappStatus: LeadFormValues["whatsappStatus"];
  whatsappProfileName: string | null;
  tier: "A" | "B" | "C" | null;
  socialPlatform: string | null;
  socialHandle: string | null;
  socialFollowers: number | null;
  branchCount: number | null;
  businessType: string | null;
  sourceUrl: string | null;
  pipelineStatus: LeadFormValues["pipelineStatus"];
  doNotContact: boolean;
  notes: string | null;
};

function toFormValues(lead: LeadRecord): LeadFormValues {
  return {
    id: lead.id,
    name: lead.name,
    nameAr: lead.nameAr ?? "",
    city: lead.city ?? "",
    area: lead.area ?? "",
    address: lead.address ?? "",
    phone: lead.phone ?? "",
    phoneSecondary: lead.phoneSecondary ?? "",
    whatsappStatus: lead.whatsappStatus,
    whatsappProfileName: lead.whatsappProfileName ?? "",
    tier: lead.tier ?? "none",
    socialPlatform: lead.socialPlatform ?? "",
    socialHandle: lead.socialHandle ?? "",
    socialFollowers:
      lead.socialFollowers != null ? String(lead.socialFollowers) : "",
    branchCount: lead.branchCount != null ? String(lead.branchCount) : "",
    businessType: lead.businessType ?? "",
    sourceUrl: lead.sourceUrl ?? "",
    pipelineStatus: lead.pipelineStatus,
    doNotContact: lead.doNotContact,
    notes: lead.notes ?? "",
  };
}
