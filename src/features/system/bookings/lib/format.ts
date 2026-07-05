const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes text for safe interpolation into HTML email templates. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/**
 * "Sunday, July 5, 2026, 7:00 PM (Africa/Cairo)" — safe against bad tz input.
 * Only used to build HTML email bodies, so the result is HTML-escaped
 * (timezone is a user-supplied string) — never render this as-is elsewhere.
 */
export function formatBookingTime(
  date: Date,
  timezone: string,
  locale: string = "en",
): string {
  try {
    const formatted = new Intl.DateTimeFormat(
      locale === "ar" ? "ar-EG" : "en",
      {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: timezone,
      },
    ).format(date);
    return escapeHtml(`${formatted} (${timezone})`);
  } catch {
    return `${date.toISOString()} (UTC)`;
  }
}
