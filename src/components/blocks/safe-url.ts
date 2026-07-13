/**
 * Allowlist guard for admin-authored URLs (block `href`/`url`/`videoUrl`
 * fields) before they reach an `<a href>`, `<iframe src>`, or `<video src>`.
 * Blocks `javascript:`/`data:`/`vbscript:` schemes; permits relative paths
 * and http(s) absolute URLs only.
 */
export function isSafeHref(url: string | null | undefined): url is string {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  return /^https?:\/\//i.test(trimmed);
}
