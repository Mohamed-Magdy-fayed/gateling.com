"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { useTranslation } from "@/features/core/i18n/client";
import { funnelPositionFor } from "@/features/system/sales/lib/funnel";
import { topFollowerPlatform } from "@/features/system/sales/lib/social-profiles";
import type { TodayLeadInput } from "@/features/system/sales/lib/today-rules";

import { PlatformIcon } from "./client-account/platform-icon";
import { FunnelStageLine } from "./funnel-stage";

/**
 * One Today row: a thin link to the lead page, where the work and the log
 * happen. Name, number, the biggest audience and the funnel line — nothing
 * else, so the list stays scannable on a phone.
 */
export function TodayLeadCard({ lead }: { lead: TodayLeadInput }) {
  const { t, locale } = useTranslation();
  const top = topFollowerPlatform(lead);
  const compact = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const position = funnelPositionFor({
    ...lead,
    hasVideoSent: lead.hasVideoSent ?? false,
    lastDemoDoneAt: lead.lastDemoDoneAt ?? null,
  });
  const displayName = locale === "ar" && lead.nameAr ? lead.nameAr : lead.name;

  return (
    <Link
      href={`/sales/leads/${lead.id}`}
      data-testid="today-lead-card"
      className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card
        size="sm"
        className="flex-row items-center gap-3 px-4 text-sm transition-colors group-hover:bg-muted/50"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="truncate font-medium">{displayName}</span>
            {lead.phone && (
              <span
                dir="ltr"
                className="text-muted-foreground text-sm tabular-nums"
              >
                {lead.phone}
              </span>
            )}
            {top && (
              <span className="inline-flex items-center gap-1 text-muted-foreground text-sm">
                <PlatformIcon platform={top.platform} className="size-3.5" />
                {t("sales.todayCardFollowers", {
                  count: compact.format(top.followers),
                })}
              </span>
            )}
          </div>
          <FunnelStageLine position={position} />
        </div>
        <ChevronRightIcon
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
        />
      </Card>
    </Link>
  );
}
