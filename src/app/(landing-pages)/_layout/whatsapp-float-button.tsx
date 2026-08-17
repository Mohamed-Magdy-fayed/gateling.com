"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/features/core/i18n/client";
import { trackGaEvent } from "@/lib/ga4";
import { trackPixelEvent } from "@/lib/meta-pixel";
import { BUSINESS_WHATSAPP_NUMBER, generateWhatsAppUrl } from "@/lib/phone";

const buttonClassName =
  "fixed h-12 w-12 rounded-full overflow-visible shadow-lg duration-500 transition-transform hover:scale-110 active:scale-95 flex bottom-4 right-4";

function trackContact() {
  trackPixelEvent("Contact", { content_name: "WhatsApp" });
  trackGaEvent("contact", { method: "whatsapp" });
}

export function WhatsAppFloatButton({
  whatsappNumber,
}: {
  whatsappNumber: string | null;
}) {
  const { t } = useTranslation();

  const url = generateWhatsAppUrl(
    whatsappNumber ?? BUSINESS_WHATSAPP_NUMBER,
    t("publicPages.finalCta.whatsappMessage"),
  );

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("publicPages.finalCta.ctaWhatsApp")}
      onClick={trackContact}
    >
      <Image
        src="/images/whatsapp-color-svgrepo-com.svg"
        alt=""
        width={512}
        height={512}
        className={buttonClassName}
      />
    </Link>
  );
}
