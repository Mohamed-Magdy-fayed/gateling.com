/** Public-facing paths that do not require authentication. */
export const PUBLIC_SITE_PATHS = [
  "/",
  "/services",
  "/work",
  "/about",
  "/contact",
  "/blog",
  "/privacy",
  "/terms",
] as const;

export const PUBLIC_MOBILE_TABS = [
  { href: "/work", key: "work" },
  { href: "/", key: "home" },
  { href: "/services", key: "services" },
] as const;

export type PublicMobileTabKey = (typeof PUBLIC_MOBILE_TABS)[number]["key"];

/** Returns the active tab index for the tabs array [Work=0, Home=1, Services=2].
 *  Profile (col 1) is not a tab index. More sheet returns 3. */
export function getPublicTabIndex(pathname: string): number {
  if (pathname.startsWith("/work")) return 0;
  if (pathname === "/") return 1;
  if (pathname.startsWith("/services")) return 2;
  // Contact, Blog, About live in the "More" sheet
  if (
    pathname.startsWith("/contact") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/about")
  )
    return 3;
  return -1;
}
