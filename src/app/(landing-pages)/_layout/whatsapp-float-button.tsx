"use client";

import { MessageCircleIcon } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/features/core/i18n/client";
import { trackPixelEvent } from "@/lib/meta-pixel";
import { generateWhatsAppUrl } from "@/lib/phone";

export function WhatsAppFloatButton() {
  const { t } = useTranslation();
  const url = generateWhatsAppUrl(
    "+201123862218",
    t("publicPages.finalCta.whatsappMessage"),
  );

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("publicPages.finalCta.ctaWhatsApp")}
      onClick={() => trackPixelEvent("Contact", { content_name: "WhatsApp" })}
      className="fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom)+1rem)] md:bottom-6 inset-e-4 z-50 h-14 w-14 items-center justify-center rounded-full bg-secondary text-accent-foreground shadow-lg duration-500 transition-transform hover:scale-110 active:scale-95 flex"
    >
      <MessageCircleIcon className="size-8" />
    </Link>
  );
}
