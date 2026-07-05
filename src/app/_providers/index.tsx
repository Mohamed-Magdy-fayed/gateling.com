import { DirectionProvider } from "@base-ui/react";
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAuth, getBranches } from "@/features/core/auth/nextjs/actions";
import { AuthProvider } from "@/features/core/auth/nextjs/components/auth-provider";
import { BranchProvider } from "@/features/core/auth/nextjs/components/branch-provider";
import { TranslationProvider } from "@/features/core/i18n/client";
import { TRPCReactProvider } from "@/integrations/trpc/client";
import { api } from "@/integrations/trpc/server";

type ProvidersProps = PropsWithChildren<{
  locale: string;
}>;

export async function Providers({ children, locale }: ProvidersProps) {
  const authState = await getAuth();
  const branchsState = authState.session?.user.id
    ? await getBranches(authState.session.user.id, {
      includeAllBranches: authState.session.user.role === "admin",
    })
    : null;
  const { facebookPixelId, ga4MeasurementId } = await (
    await api()
  ).settings.getPublicValues();

  return (
    <ThemeProvider
      defaultTheme="system"
      attribute="class"
      enableSystem
      disableTransitionOnChange
    >
      {facebookPixelId && (
        <Script
          id="fb-pixel"
          strategy="beforeInteractive"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: facebook pixel bootstrap
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${facebookPixelId}');fbq('track','PageView');`,
          }}
        />
      )}
      {ga4MeasurementId && (
        <>
          <Script
            id="ga4-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`}
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: GA4 bootstrap
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4MeasurementId}');`,
            }}
          />
        </>
      )}
      <TranslationProvider defaultLocale={locale} fallbackLocale="en">
        <AuthProvider value={authState}>
          <BranchProvider value={branchsState}>
            <TRPCReactProvider>
              <DirectionProvider direction={locale === "ar" ? "rtl" : "ltr"}>
                <TooltipProvider>
                  {children}
                  <Toaster visibleToasts={3} />
                </TooltipProvider>
              </DirectionProvider>
            </TRPCReactProvider>
          </BranchProvider>
        </AuthProvider>
      </TranslationProvider>
    </ThemeProvider>
  );
}
