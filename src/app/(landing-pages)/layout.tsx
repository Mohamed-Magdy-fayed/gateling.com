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
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <PublicHeader />
      <main id="site-scroll" className="flex-1 overflow-y-auto overflow-x-clip">
        {children}
        <PublicFooter />
        <WhatsAppFloatButton />
      </main>
      <PublicLandingMobileTabBar />
    </div>
  );
}
