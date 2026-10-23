"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/features/core/i18n/client";

type Props = {
  done: number;
  left: number;
  ratio: number;
  conversations: number;
};

/**
 * "N of M done" plus a bar, with conversations as a secondary chip so parks
 * and status changes cannot fill the headline alone. No transition: when a
 * lead becomes due again the bar dips, and a dip should not animate.
 */
export function TodayProgress({ done, left, ratio, conversations }: Props) {
  const { t } = useTranslation();
  const percent = Math.round(ratio * 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-sm">
          {t("sales.progressDone", { done, total: done + left })}
        </p>
        <Badge variant="secondary">{t("sales.conversationsToday", { count: conversations })}</Badge>
      </div>
      <div
        role="progressbar"
        aria-label={t("sales.progressLabel")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
