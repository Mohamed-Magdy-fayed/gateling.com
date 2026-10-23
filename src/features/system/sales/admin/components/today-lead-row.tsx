"use client";

import { EllipsisIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/features/core/i18n/client";
import { type Channel, primaryActionFor } from "@/features/system/sales/lib/outcomes";
import type { SessionItem } from "@/features/system/sales/lib/today-session";
import { toWhatsAppUrl } from "@/lib/phone";

import { reasonText } from "./today-reason";

type Props = {
  item: SessionItem;
  saving: boolean;
  /** Make this lead Up next. */
  onPromote: () => void;
  /** The contact action fired from the row: promote it and start the call. */
  onStart: (channel: Channel) => void;
  onPark: () => void;
  onSkip?: () => void;
};

/**
 * One compact line in the queue: who, why, and the single action the bucket
 * recommends. Clicking the name promotes the lead to Up next.
 */
export function TodayLeadRow({ item, saving, onPromote, onStart, onPark, onSkip }: Props) {
  const { t } = useTranslation();
  const { lead } = item.row;
  const primary = primaryActionFor(item.bucket, lead);
  const whatsappUrl = toWhatsAppUrl(lead.phone);

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
      <Button
        variant="ghost"
        onClick={onPromote}
        className="h-auto min-w-0 flex-1 flex-col items-start gap-0.5 whitespace-normal py-1.5 text-start"
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-sm">{lead.name}</span>
          {item.isNew && <Badge variant="outline">{t("sales.newMarker")}</Badge>}
        </span>
        <span className="font-normal text-muted-foreground text-xs">
          {reasonText(item.row.reason, t)}
        </span>
      </Button>

      <div className="flex shrink-0 items-center gap-1">
        {primary === "call" && lead.phone && (
          <Button
            variant="outline"
            className="max-sm:min-h-11"
            render={(props) => (
              <a href={`tel:${lead.phone}`} onClick={() => onStart("call")} {...props}>
                {t("sales.primaryAction", { action: "call" })}
              </a>
            )}
          />
        )}
        {primary === "whatsapp" && whatsappUrl && (
          <Button
            variant="outline"
            className="max-sm:min-h-11"
            render={(props) => (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onStart("whatsapp")}
                {...props}
              >
                {t("sales.primaryAction", { action: "whatsapp" })}
              </a>
            )}
          />
        )}
        {primary === "park" && (
          <Button variant="outline" disabled={saving} onClick={onPark} className="max-sm:min-h-11">
            {t("sales.primaryAction", { action: "park" })}
          </Button>
        )}
        {primary === "openLead" && (
          <Button
            variant="outline"
            className="max-sm:min-h-11"
            render={(props) => (
              <Link href={`/sales/leads/${lead.id}`} {...props}>
                {t("sales.primaryAction", { action: "openLead" })}
              </Link>
            )}
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("sales.rowActions")}
                className="max-sm:size-11"
                {...props}
              >
                <EllipsisIcon aria-hidden="true" />
              </Button>
            )}
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href={`/sales/leads/${lead.id}`} />}>
              {t("sales.primaryAction", { action: "openLead" })}
            </DropdownMenuItem>
            {onSkip && (
              <DropdownMenuItem onClick={onSkip}>{t("sales.skipForNow")}</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
