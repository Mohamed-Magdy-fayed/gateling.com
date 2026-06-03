import type { ScreenKey } from "@/features/system/registry";

/** Primary destinations shown in the staff mobile bottom bar.
 *  Rule: most-visited pages. Profile occupies col 1, these fill cols 2-4, More is col 5. */
export const SYSTEM_MOBILE_PRIMARY_SCREEN_KEYS = [
  "leads",
  "dashboard",
  "work",
] as const satisfies readonly ScreenKey[];
