/**
 * Single source of truth for the company's public identity: the facts that
 * appear in the footer, in the Organization JSON-LD, and in outbound email.
 *
 * Before this file these lived in a module-private `APP_CONFIG` inside
 * `_layout/footer.tsx`, with `info@gateling.com` re-typed in eight other
 * places. Structured data and the rendered footer must agree — `sameAs` is
 * Google's cross-check that the profiles and the site are the same entity, so
 * a footer link that disagrees with the graph is worse than no link.
 *
 * Every URL here was verified to resolve on 2026-08-14. The previous footer
 * values did not: `youtube.com/@mohamedfayed` returned 404, and Facebook and
 * Instagram pointed at the founder's personal accounts while company pages
 * existed. `linkedin.com/company/gateling` and `github.com/gateling` — both
 * suggested in `docs/seo-blueprint.md` — do not exist at all and are
 * deliberately absent.
 */

import { BUSINESS_WHATSAPP_NUMBER } from "@/lib/phone";

/** Profiles belonging to the company itself. Safe for Organization `sameAs`. */
export const COMPANY_SOCIALS = {
  facebook: "https://www.facebook.com/GatelingSolutions/",
  instagram: "https://www.instagram.com/gatelingsolutions/",
  youtube: "https://www.youtube.com/@gatelingsolutions",
} as const;

/**
 * Profiles belonging to the founder personally. These go on the Person node,
 * never on Organization — conflating the two entities is what `sameAs` exists
 * to prevent.
 */
export const FOUNDER_SOCIALS = {
  linkedin: "https://www.linkedin.com/in/mohamed-magdy-fayed/",
} as const;

export const COMPANY = {
  name: "Gateling Solutions",
  email: "info@gateling.com",
  // The phone line and the WhatsApp line are the same number. Defined once in
  // `lib/phone.ts` so a change to one can never leave the other behind.
  phoneDisplay: BUSINESS_WHATSAPP_NUMBER,
  phoneDial: BUSINESS_WHATSAPP_NUMBER,
  /**
   * No street address exists. A remote-first studio should not claim a
   * storefront, and `PostalAddress` is valid with locality + country alone.
   */
  addressLocality: "Cairo",
  addressCountry: "EG",
  ...COMPANY_SOCIALS,
} as const;

/** Ordered for the footer's social row. */
export const COMPANY_SAME_AS: readonly string[] = [
  COMPANY_SOCIALS.facebook,
  COMPANY_SOCIALS.youtube,
  COMPANY_SOCIALS.instagram,
];
