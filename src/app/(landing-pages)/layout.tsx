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
    <div className="relative flex h-svh flex-col overflow-hidden bg-background md:h-auto md:min-h-screen md:overflow-visible">
      <div className=" flex min-h-0 flex-1 flex-col">
        <PublicHeader />
        <main className="min-h-0 flex-1 overflow-x-clip overflow-y-auto md:overflow-visible">
          {children}
          <PublicFooter />
          <WhatsAppFloatButton />
        </main>
        <PublicLandingMobileTabBar />
      </div>
    </div>
  );
}
