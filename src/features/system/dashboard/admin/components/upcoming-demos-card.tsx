"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import type { SalesDashboard } from "@/features/system/sales/server/dashboard";

type Props = {
  demos: SalesDashboard["upcomingDemos"];
  /** Business timezone — demo times are shown as the operator books them. */
  timeZone: string;
};

export function UpcomingDemosCard({ demos, timeZone }: Props) {
  const { t, locale } = useTranslation();
  const format = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.demosTitle")}</CardTitle>
        <CardDescription>{t("dashboard.demosDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {demos.length === 0 ? (
          <Muted>{t("dashboard.demosEmpty")}</Muted>
        ) : (
          <ul className="divide-y">
            {demos.map((demo) => (
              <li
                key={demo.leadId}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <div className="flex min-w-0 flex-col">
                  <Link
                    href={`/sales/leads/${demo.leadId}`}
                    className="truncate font-medium text-sm underline-offset-4 hover:underline focus-visible:underline"
                  >
                    {(locale === "ar" && demo.nameAr) || demo.name}
                  </Link>
                  <time
                    dateTime={new Date(demo.scheduledAt).toISOString()}
                    className="text-muted-foreground text-xs"
                  >
                    {format.format(new Date(demo.scheduledAt))}
                  </time>
                </div>
                {demo.meetingUrl ? (
                  <a
                    href={demo.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    {t("dashboard.demoGuestLink")}
                    <ExternalLink aria-hidden />
                  </a>
                ) : (
                  <Badge variant="secondary">
                    {t("dashboard.demoRoomPending")}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
