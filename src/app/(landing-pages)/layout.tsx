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
    <div className="relative flex min-h-dvh flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 overflow-x-clip pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
        <PublicFooter />
        <WhatsAppFloatButton />
      </main>
      <PublicLandingMobileTabBar />
    </div>
  );
}
