"use client";

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

/**
 * Outbound attempts per day, oldest at the start edge, so the axis reads in
 * the page's direction in both languages. Bars carry their own label for
 * screen readers; the visible axis shows the day of the month only.
 */
export function DailyTouchesCard({
  touches,
}: {
  touches: SalesDashboard["touches"];
}) {
  const { t, locale } = useTranslation();
  const max = Math.max(1, ...touches.map((day) => day.count));
  const total = touches.reduce((sum, day) => sum + day.count, 0);
  const average = touches.length
    ? Math.round((total / touches.length) * 10) / 10
    : 0;

  // Keys are calendar dates; format them as such, without a timezone shift.
  const asDate = (key: string) => new Date(`${key}T00:00:00Z`);
  const dayOfMonth = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    timeZone: "UTC",
  });
  const fullDate = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.touchesTitle")}</CardTitle>
        <CardDescription>{t("dashboard.touchesDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ol className="flex h-36 items-end gap-1">
          {touches.map(({ day, count }) => {
            const label = t("dashboard.touchesBar", {
              date: fullDate.format(asDate(day)),
              count,
            });
            return (
              <li
                key={day}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                title={label}
              >
                <span className="sr-only">{label}</span>
                <div
                  aria-hidden
                  className={
                    count > 0
                      ? "w-full rounded-t-sm bg-primary"
                      : "w-full rounded-t-sm bg-muted"
                  }
                  style={{ height: `${Math.max(4, (count / max) * 100)}%` }}
                />
                <span
                  aria-hidden
                  className="text-[10px] text-muted-foreground tabular-nums"
                >
                  {dayOfMonth.format(asDate(day))}
                </span>
              </li>
            );
          })}
        </ol>
        <Muted>{t("dashboard.touchesAverage", { avg: average })}</Muted>
      </CardContent>
    </Card>
  );
}
