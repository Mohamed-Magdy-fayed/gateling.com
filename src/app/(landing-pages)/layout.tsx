import { ScrollArea } from "@/components/ui/scroll-area";
import { PublicFooter } from "./_layout/footer";
import { PublicHeader } from "./_layout/header";
import { PublicLandingMobileTabBar } from "./_layout/mobile-tab-bar";
import { WhatsAppFloatButton } from "./_layout/whatsapp-float-button";

export default function LandingPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex relative h-svh flex-col overflow-auto">
        <PublicHeader />
        <ScrollArea
          slot="main"
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden md:overflow-visible"
        >
          {children}
          <PublicFooter />
        </ScrollArea>
        <PublicLandingMobileTabBar />
      </div>
      <WhatsAppFloatButton />
    </>
  );
}
