import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    // Public by design: the Turnstile site key is rendered into the page.
    // Inlined at build time, so it must be set before `next build`.
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
    // Gateling's LinkedIn company page, e.g. https://www.linkedin.com/company/gateling-solutions/
    // Unset hides the LinkedIn link everywhere on the site.
    NEXT_PUBLIC_LINKEDIN_COMPANY_URL: z.string().url().optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_LINKEDIN_COMPANY_URL:
      process.env.NEXT_PUBLIC_LINKEDIN_COMPANY_URL,
  },
  emptyStringAsUndefined: true,
});
