import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Open_Sans } from "next/font/google";
import { Suspense } from "react";

import { Providers } from "@/app/_providers";
import { getLocaleCookie } from "@/features/core/i18n/server";
import { COMPANY, COMPANY_SAME_AS } from "@/lib/company";
import { absoluteUrl } from "@/lib/json-ld";
import { FOUNDER_ID, ORG_ID, ORG_REF, WEBSITE_ID } from "@/lib/seo";
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
  // Via `absoluteUrl` so the trailing slash some environments set on BASE_URL
  // is stripped in exactly one place — reading `process.env` directly here
  // produced `https://gateling.com//og.png` for relative OG images.
  metadataBase: new URL(absoluteUrl("/")),
  icons: { icon: "/favicon.ico" },
  openGraph: {
    siteName: "Gateling Solutions",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  // No `images` entry here on purpose: `src/app/opengraph-image.tsx` owns the
  // default OG tags via Next's file convention. The previous hardcoded
  // `/og-default.png` and `/icon.png` pointed at files that were never added to
  // `public/`, so every share preview and PNG icon 404'd. `icons` above points
  // at the real `public/favicon.ico`; the generated `src/app/icon.tsx` that
  // once owned it was removed in favour of that file.
};

/**
 * Site-wide entity graph. Every page's structured data references the
 * Organization by `@id` rather than redeclaring it.
 *
 * `logo` was `"favicon.ico"` — a *relative* URL, which structured-data
 * consumers resolve against the current page, so on `/blog/<slug>` it asked for
 * `/blog/favicon.ico` and 404'd. Google's organization-logo guidance also wants
 * an absolute URL and a raster image rather than an `.ico`.
 *
 * The founder is referenced here and defined in full on `/about`, so the Person
 * exists once with its own biography and profile links.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: COMPANY.name,
      url: absoluteUrl("/"),
      logo: absoluteUrl("/logo.png"),
      email: COMPANY.email,
      telephone: COMPANY.phoneDial,
      address: {
        "@type": "PostalAddress",
        addressLocality: COMPANY.addressLocality,
        addressCountry: COMPANY.addressCountry,
      },
      areaServed: [
        { "@type": "Country", name: "Egypt" },
        { "@type": "Place", name: "Middle East and North Africa" },
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        email: COMPANY.email,
        telephone: COMPANY.phoneDial,
        availableLanguage: ["en", "ar"],
      },
      founder: { "@id": FOUNDER_ID },
      sameAs: COMPANY_SAME_AS,
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: COMPANY.name,
      url: absoluteUrl("/"),
      publisher: ORG_REF,
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
