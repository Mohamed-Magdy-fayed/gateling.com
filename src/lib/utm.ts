const UTM_COOKIE_NAME = "gtl_attribution";
const UTM_COOKIE_MAX_AGE_DAYS = 30;

const UTM_PARAM_KEYS = [
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmContent",
] as const;

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  referrer?: string;
};

function readCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function writeCookie(name: string, value: string) {
  const maxAge = UTM_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

/**
 * Captures utm_* query params + referrer on first landing and persists them
 * to a first-party cookie, so attribution survives navigation to the contact
 * form. Only writes once per visitor — later page views without UTM params
 * don't overwrite the original source.
 */
export function captureAttribution(searchParams: URLSearchParams): void {
  if (typeof window === "undefined") return;
  if (readCookie(UTM_COOKIE_NAME)) return;

  const attribution: Attribution = {
    utmSource: searchParams.get("utm_source") ?? undefined,
    utmMedium: searchParams.get("utm_medium") ?? undefined,
    utmCampaign: searchParams.get("utm_campaign") ?? undefined,
    utmContent: searchParams.get("utm_content") ?? undefined,
    referrer: document.referrer || undefined,
  };

  const hasAnyValue = UTM_PARAM_KEYS.some((key) => attribution[key]);
  if (!hasAnyValue && !attribution.referrer) return;

  writeCookie(UTM_COOKIE_NAME, JSON.stringify(attribution));
}

export function readAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  const raw = readCookie(UTM_COOKIE_NAME);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Attribution;
  } catch {
    return {};
  }
}
