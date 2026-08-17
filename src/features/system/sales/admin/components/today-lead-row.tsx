"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/core/i18n/client";
import type { TodayRow } from "@/features/system/sales/lib/today-rules";
import { useTRPC } from "@/integrations/trpc/client";
import { toWhatsAppUrl } from "@/lib/phone";

import { QuickLogPopover } from "./quick-log-popover";

/**
 * Everything needed to make the call is on the row — name, where they are,
 * the numbers, WhatsApp status, size, why they surfaced, how cold they are,
 * and an opening angle. Clicking through to a detail page before dialling is
 * exactly the friction that sends people back to a spreadsheet.
 */

type Props = {
  row: TodayRow;
  /** Auto-park rows get a one-click Park instead of only a log control. */
  showPark?: boolean;
};

export function TodayLeadRow({ row, showPark = false }: Props) {
  const { lead, reason, daysSinceLastContact, openingAngle } = row;
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const park = useMutation(
    trpc.sales.park.mutationOptions({
      onSuccess: async () => {
        toast.success(t("sales.parked"));
        await queryClient.invalidateQueries();
      },
      onError: () => toast.error(t("sales.parkFailed")),
    }),
  );

  const whatsappUrl = toWhatsAppUrl(lead.phone);

  return (
    <div className="flex flex-col gap-3 border-b p-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/sales/leads/${lead.id}`}
            className="font-medium text-sm hover:underline"
          >
            {lead.name}
          </Link>
          {lead.nameAr && (
            <span className="text-muted-foreground text-xs">{lead.nameAr}</span>
          )}
          {lead.tier && <Badge variant="secondary">{lead.tier}</Badge>}
          {lead.socialFollowers != null && (
            <span className="text-muted-foreground text-xs">
              {new Intl.NumberFormat().format(lead.socialFollowers)}
            </span>
          )}
        </div>

        <p className="text-muted-foreground text-xs">
          {[lead.city, lead.area].filter(Boolean).join(" · ")}
        </p>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {lead.phone ? (
            <a href={`tel:${lead.phone}`} className="font-mono hover:underline">
              {lead.phone}
            </a>
          ) : (
            <span className="text-muted-foreground">{t("sales.noPhone")}</span>
          )}
          {lead.phoneSecondary && (
            <a
              href={`tel:${lead.phoneSecondary}`}
              className="font-mono text-muted-foreground hover:underline"
            >
              {lead.phoneSecondary}
            </a>
          )}
          <Badge
            variant={
              lead.whatsappStatus === "confirmed" ? "default" : "outline"
            }
          >
            {t("sales.whatsappStatuses", { status: lead.whatsappStatus })}
          </Badge>
          {/* The public WA display name is how you confirm you are messaging
              the business and not a stranger who owns the number. */}
          {lead.whatsappProfileName && (
            <span className="text-muted-foreground">
              {lead.whatsappProfileName}
            </span>
          )}
        </div>

        <p className="text-xs">
          <span className="text-muted-foreground">{reasonText(reason, t)}</span>
          {daysSinceLastContact !== null && (
            <span className="text-muted-foreground">
              {" · "}
              {t("sales.daysSinceContact", { days: daysSinceLastContact })}
            </span>
          )}
        </p>

        {openingAngle && (
          <p className="line-clamp-2 text-muted-foreground text-xs italic">
            {openingAngle}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
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
        {showPark && (
          <Button
            size="sm"
            variant="outline"
            disabled={park.isPending}
            onClick={() => park.mutate({ leadId: lead.id })}
          >
            {t("sales.park")}
          </Button>
        )}
        <QuickLogPopover leadId={lead.id} />
      </div>
    </div>
  );
}

type Translate = ReturnType<typeof useTranslation>["t"];

/** Turns the rules module's structured reason into a sentence. */
function reasonText(reason: TodayRow["reason"], t: Translate): string {
  switch (reason.kind) {
    case "rescue":
      return reason.daysSinceContact === null
        ? t("sales.reasonRescueNeverContacted")
        : t("sales.reasonRescue", { days: reason.daysSinceContact });
    case "overdue":
      return reason.daysOverdue <= 0
        ? t("sales.reasonOverdueToday")
        : t("sales.reasonOverdue", { days: reason.daysOverdue });
    case "followUp":
      return t("sales.reasonFollowUp", {
        days: reason.daysSinceContact ?? 0,
        count: reason.followUpCount,
      });
    case "newQueue":
      return t("sales.reasonNewQueue");
    case "autoPark":
      return t("sales.reasonAutoPark", { count: reason.followUpCount });
  }
}
