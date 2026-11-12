import type { DiscoveryChannel } from "@/drizzle/schema";

/**
 * Turns whatever was shared or pasted (a profile URL, a post link, a message
 * with a link in it) into a channel guess, a clean URL and a handle. Pure.
 */

const HOST_CHANNEL: [RegExp, DiscoveryChannel][] = [
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|m\.me|messenger\.com)$/i, "facebook"],
  [/(^|\.)(instagram\.com|instagr\.am|ig\.me)$/i, "instagram"],
  [/(^|\.)(wa\.me|whatsapp\.com)$/i, "whatsapp"],
  [/(^|\.)linkedin\.com$/i, "linkedin"],
];

const URL_PATTERN = /https?:\/\/[^\s<>"']+/i;

/** Path segments that are pages of the platform, not a profile. */
const NON_HANDLE = new Set([
  "p",
  "reel",
  "reels",
  "stories",
  "groups",
  "posts",
  "share",
  "watch",
  "photo",
  "photo.php",
  "permalink.php",
  "profile.php",
  "story.php",
  "in",
  "company",
]);

export type ParsedShare = {
  url: string | null;
  channel: DiscoveryChannel | null;
  handle: string | null;
  /** The shared text with the URL removed, trimmed. */
  text: string;
};

export function firstUrl(value: string): string | null {
  const match = value.match(URL_PATTERN);
  if (!match) return null;
  return match[0].replace(/[.,)\]]+$/, "");
}

export function channelForUrl(url: string): DiscoveryChannel | null {
  try {
    const host = new URL(url).hostname;
    for (const [pattern, channel] of HOST_CHANNEL) {
      if (pattern.test(host)) return channel;
    }
    return null;
  } catch {
    return null;
  }
}

export function handleForUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const channel = channelForUrl(url);
    if (channel === "whatsapp") {
      const digits = parsed.pathname.replace(/\D/g, "");
      return digits || null;
    }
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (channel === "linkedin" && segments[0] === "in" && segments[1]) {
      return segments[1];
    }
    if (parsed.pathname.endsWith("profile.php")) {
      return parsed.searchParams.get("id");
    }
    const first = segments[0];
    if (!first || NON_HANDLE.has(first.toLowerCase())) return null;
    return decodeURIComponent(first);
  } catch {
    return null;
  }
}

/** Strips tracking parameters so the same profile shared twice matches. */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|fbclid|igsh|igshid|mibextid|rdid|sfnsn|si$)/i.test(key)) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.hash = "";
    const out = parsed.toString();
    return out.endsWith("/") && parsed.search === "" ? out.slice(0, -1) : out;
  } catch {
    return url;
  }
}

export function parseShare(input: {
  url?: string | null;
  text?: string | null;
  title?: string | null;
}): ParsedShare {
  const text = [input.title, input.text].filter(Boolean).join("\n").trim();
  const raw = input.url?.trim() || firstUrl(text);
  const url = raw ? normalizeUrl(raw) : null;
  return {
    url,
    channel: url ? channelForUrl(url) : null,
    handle: url ? handleForUrl(url) : null,
    text: (raw ? text.replace(raw, "") : text).trim(),
  };
}
