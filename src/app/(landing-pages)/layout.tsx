import { getPublicChatSettings } from "@/features/system/settings/server/public-settings";
import { HydrateClient } from "@/integrations/trpc/server";
import { AttributionCapture } from "./_layout/attribution-capture";
import { PublicFooter } from "./_layout/footer";
import { PublicHeader } from "./_layout/header";
import { PublicLandingMobileTabBar } from "./_layout/mobile-tab-bar";
import { WhatsAppFloatButton } from "./_layout/whatsapp-float-button";

export default async function LandingPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { whatsappNumber } = await getPublicChatSettings();

  return (
    <HydrateClient>
      <AttributionCapture />
      <PublicHeader />
      {children}
      <PublicFooter />
      <PublicLandingMobileTabBar />
      <WhatsAppFloatButton whatsappNumber={whatsappNumber} />
    </HydrateClient>
  );
}
