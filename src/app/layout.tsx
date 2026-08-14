import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Open_Sans } from "next/font/google";
import { Suspense } from "react";

import { Providers } from "@/app/_providers";
import { getLocaleCookie } from "@/features/core/i18n/server";
import { cn } from "@/lib/utils";

const openSans = Open_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default:
      "Custom Software Development & Business Automation | Gateling Solutions",
    template: "%s | Gateling Solutions",
  },
  description:
    "We find the most painful points in your business and resolve them with custom software and AI. Serving cafes, schools, retail & events across Egypt and MENA.",
  metadataBase: new URL(process.env.BASE_URL ?? "https://gateling.com"),
  icons: { icon: "/favicon.ico" },
  openGraph: {
    siteName: "Gateling Solutions",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  // No `images` or `icons` entries here on purpose: `src/app/opengraph-image.tsx`
  // and `src/app/icon.tsx` own those tags via Next's file conventions. The
  // previous hardcoded `/og-default.png` and `/icon.png` pointed at files that
  // were never added to `public/`, so every share preview and PNG icon 404'd.
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://gateling.com/#org",
      name: "Gateling Solutions",
      url: "https://gateling.com",
      logo: "favicon.ico",
      email: "info@gateling.com",
    },
    {
      "@type": "WebSite",
      "@id": "https://gateling.com/#website",
      name: "Gateling Solutions",
      url: "https://gateling.com",
      publisher: { "@id": "https://gateling.com/#org" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense>
      <Suspended>{children}</Suspended>
    </Suspense>
  );
}

async function Suspended({ children }: { children: React.ReactNode }) {
  const locale = await getLocaleCookie();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
      className={cn(
        "antialiased font-sans scroll-smooth",
        geistSans.variable,
        geistMono.variable,
        openSans.variable,
      )}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Providers locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
