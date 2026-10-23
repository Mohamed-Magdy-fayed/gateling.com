"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/features/core/i18n/client";
import type { Channel } from "@/features/system/sales/lib/outcomes";
import type {
  SessionGroup,
  SessionItem,
} from "@/features/system/sales/lib/today-session";

import { BUCKET_COPY } from "./today-reason";
import { TodayLeadRow } from "./today-lead-row";

type Props = {
  groups: SessionGroup[];
  skipped: SessionItem[];
  extra: SessionItem[];
  saving: boolean;
  onPromote: (leadId: string) => void;
  onStart: (leadId: string, channel: Channel) => void;
  onPark: (item: SessionItem) => void;
  onSkip: (leadId: string) => void;
};

/**
 * Everything after Up next, as one list grouped by bucket in priority order.
 * Skipped leads sit at the end; new-queue rows beyond today's goal are listed
 * last as optional.
 */
export function TodayQueue({
  groups,
  skipped,
  extra,
  saving,
  onPromote,
  onStart,
  onPark,
  onSkip,
}: Props) {
  const { t } = useTranslation();
  const visible = groups.filter((g) => g.items.length > 0);

  const rows = (items: SessionItem[], canSkip: boolean) => (
    <ul className="divide-y">
      {items.map((item) => (
        <TodayLeadRow
          key={item.row.lead.id}
          item={item}
          saving={saving}
          onPromote={() => onPromote(item.row.lead.id)}
          onStart={(channel) => {
            onPromote(item.row.lead.id);
            onStart(item.row.lead.id, channel);
          }}
          onPark={() => onPark(item)}
          onSkip={canSkip ? () => onSkip(item.row.lead.id) : undefined}
        />
      ))}
    </ul>
  );

  if (visible.length === 0 && skipped.length === 0 && extra.length === 0) return null;

  return (
    <section aria-labelledby="today-queue-heading" className="flex flex-col gap-4">
      <h2 id="today-queue-heading" className="font-semibold text-base">
        {t("sales.queueTitle")}
      </h2>
      <Card size="sm">
        <CardContent className="flex flex-col divide-y">
        {visible.map((group) => {
          const copy = BUCKET_COPY[group.bucket];
          const capped = group.totalBeforeCap > group.shown;
          return (
            <div key={group.bucket} className="flex flex-col gap-1 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-sm">{t(copy.title)}</h3>
                <Badge variant="secondary">{group.items.length}</Badge>
                {capped && (
                  <Badge variant="outline">
                    {t("sales.capNotice", { shown: group.shown, total: group.totalBeforeCap })}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-xs">{t(copy.hint)}</p>
              {rows(group.items, true)}
            </div>
          );
        })}
        {skipped.length > 0 && (
          <div className="flex flex-col gap-1 py-3">
            <h3 className="font-medium text-sm">{t("sales.queueSkipped")}</h3>
            {rows(skipped, false)}
          </div>
        )}
        {extra.length > 0 && (
          <div className="flex flex-col gap-1 py-3">
            <h3 className="font-medium text-sm">{t("sales.queueExtra")}</h3>
            <p className="text-muted-foreground text-xs">{t("sales.queueExtraHint")}</p>
            {rows(extra, false)}
          </div>
        )}
        </CardContent>
      </Card>
    </section>
  );
}
