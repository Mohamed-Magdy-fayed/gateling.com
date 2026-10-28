"use client";

import { PhoneIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/core/i18n/client";

import { QuickLogPopover } from "../quick-log-popover";
import { WhatsappIcon } from "./platform-icon";

type Props = {
  leadId: string;
  phone: string | null;
  whatsappUrl: string | null;
};

/**
 * Phones only: call, WhatsApp and log stay under the thumb while scrolling.
 * The page adds bottom padding (`pb-24 sm:pb-0`) so it never covers content.
 */
export function MobileActionBar({ leadId, phone, whatsappUrl }: Props) {
  const { t } = useTranslation();

  return (
    <section
      aria-label={t("sales.account.quickActions")}
      className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden"
      data-testid="client-mobile-bar"
    >
      {phone ? (
        <Button
          className="h-11 flex-1 px-4"
          render={(props) => (
            <a href={`tel:${phone}`} {...props}>
              <PhoneIcon aria-hidden="true" />
              <span className="flex flex-col items-start leading-tight">
                <span>{t("sales.callNow")}</span>
                <span className="font-normal text-xs opacity-80" dir="ltr">
                  {phone}
                </span>
              </span>
            </a>
          )}
        />
      ) : (
        <span className="flex-1 text-muted-foreground text-sm">
          {t("sales.account.noPhone")}
        </span>
      )}
      {whatsappUrl && (
        <Button
          variant="outline"
          className="size-11"
          aria-label={t("sales.account.openWhatsappChat")}
          render={(props) => (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              <WhatsappIcon aria-hidden="true" className="size-5" />
            </a>
          )}
        />
      )}
      <QuickLogPopover leadId={leadId} />
    </section>
  );
}
