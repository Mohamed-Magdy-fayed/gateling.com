import { MessageCircleIcon } from "lucide-react";
import Link from "next/link";
import { getT } from "@/features/core/i18n/server";
import { generateWhatsAppUrl } from "@/lib/phone";

export async function WhatsAppFloatButton() {
  const { t } = await getT();
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
      className="fixed bottom-20 inset-e-4 z-50 h-14 w-14 items-center justify-center rounded-full bg-secondary text-accent-foreground shadow-lg duration-500 transition-transform hover:scale-110 active:scale-95 flex"
    >
      <MessageCircleIcon className="size-8" />
    </Link>
  );
}
