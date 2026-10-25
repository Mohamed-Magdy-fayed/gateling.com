import {
  type LeadSocialProfiles,
  type SocialPlatform,
  socialPlatformValues,
} from "@/drizzle/schema";

/**
 * The social platforms the Today screen shows for a prospect: one card per
 * platform, filled from researched `socialProfiles`, else from the legacy
 * single platform + handle, else a Google search to go and find it.
 */

export const socialPlatforms = socialPlatformValues;
export type { SocialPlatform };

export type SocialLeadFields = {
  name: string;
  city: string | null;
  area: string | null;
  address: string | null;
  socialPlatform: string | null;
  socialHandle: string | null;
  socialFollowers: number | null;
  socialProfiles: LeadSocialProfiles;
};

export type SocialProfile =
  | {
      platform: SocialPlatform;
      kind: "found";
      /** For display: `@` stripped unless it is a URL. */
      handle: string | null;
      followers: number | null;
      posts: number | null;
      bio: string | null;
      /** Null when the stored value cannot be turned into a safe link. */
      profileUrl: string | null;
      /** ISO time it was researched; null for the legacy CSV/form value. */
      checkedAt: string | null;
    }
  | {
      platform: SocialPlatform;
      kind: "notFound";
      checkedAt: string;
      searchUrl: string;
    }
  | { platform: SocialPlatform; kind: "missing"; searchUrl: string };

const ALIASES: Record<string, SocialPlatform> = {
  instagram: "instagram",
  insta: "instagram",
  ig: "instagram",
  facebook: "facebook",
  fb: "facebook",
  tiktok: "tiktok",
  "tik tok": "tiktok",
  tt: "tiktok",
};

const HOSTS: Record<SocialPlatform, string> = {
  instagram: "instagram.com",
  facebook: "facebook.com",
  tiktok: "tiktok.com",
};

/**
 * Exact hosts a profile link may point at. Not a suffix match: subdomains such
 * as `l.facebook.com` (link shim) and `vm.tiktok.com` (short links) redirect
 * anywhere, so an "Open profile" button must never accept them.
 */
const PROFILE_HOSTS: Record<SocialPlatform, readonly string[]> = {
  instagram: ["instagram.com", "www.instagram.com", "m.instagram.com"],
  facebook: [
    "facebook.com",
    "www.facebook.com",
    "m.facebook.com",
    "web.facebook.com",
  ],
  tiktok: ["tiktok.com", "www.tiktok.com", "m.tiktok.com"],
};

/** Free-text platform (or a profile URL) → one of the known platforms. */
export function normalizePlatform(
  platform: string | null,
  handle: string | null,
): SocialPlatform | null {
  const key = platform?.trim().toLowerCase();
  if (key && ALIASES[key]) return ALIASES[key];
  const url = parseHttpUrl(handle);
  if (!url) return null;
  return platformOfUrl(url);
}

function platformOfUrl(url: URL): SocialPlatform | null {
  const host = url.hostname.toLowerCase();
  return socialPlatforms.find((p) => PROFILE_HOSTS[p].includes(host)) ?? null;
}

export function parseHttpUrl(value: string | null): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

/** True when `url` is an http(s) link on `platform`'s own domain. */
export function isPlatformUrl(platform: SocialPlatform, url: string): boolean {
  const parsed = parseHttpUrl(url);
  return parsed !== null && platformOfUrl(parsed) === platform;
}

export function profileUrl(
  platform: SocialPlatform,
  handle: string,
): string | null {
  const url = parseHttpUrl(handle);
  // A stored URL is only linked when it is on the platform itself.
  if (url) return platformOfUrl(url) === platform ? url.href : null;
  const name = handle.trim().replace(/^@/, "");
  if (!/^[\w.-]+$/.test(name)) return null;
  const path = platform === "tiktok" ? `@${name}` : name;
  return `https://www.${HOSTS[platform]}/${path}`;
}

/** Google search for the business on one platform, narrowed by its address. */
export function googleSearchUrl(
  lead: SocialLeadFields,
  platform: SocialPlatform,
): string {
  const where =
    lead.address?.trim() || [lead.area, lead.city].filter(Boolean).join(" ");
  const q = [lead.name, platform, where].filter(Boolean).join(" ");
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

function displayHandle(handle: string): string {
  return parseHttpUrl(handle) ? handle : handle.replace(/^@/, "");
}

/** One entry per known platform, in display order. */
export function socialProfiles(lead: SocialLeadFields): SocialProfile[] {
  const legacyPlatform = normalizePlatform(
    lead.socialPlatform,
    lead.socialHandle,
  );
  const legacyHandle = lead.socialHandle?.trim();

  return socialPlatforms.map((platform): SocialProfile => {
    const stored = lead.socialProfiles[platform];
    const searchUrl = googleSearchUrl(lead, platform);

    if (stored?.status === "found") {
      return {
        platform,
        kind: "found",
        handle: stored.handle ? displayHandle(stored.handle) : null,
        followers: stored.followers,
        posts: stored.posts,
        bio: stored.bio,
        profileUrl: isPlatformUrl(platform, stored.url) ? stored.url : null,
        checkedAt: stored.checkedAt,
      };
    }
    if (stored?.status === "notFound") {
      return {
        platform,
        kind: "notFound",
        checkedAt: stored.checkedAt,
        searchUrl,
      };
    }
    if (platform === legacyPlatform && legacyHandle) {
      return {
        platform,
        kind: "found",
        handle: displayHandle(legacyHandle),
        followers: lead.socialFollowers,
        posts: null,
        bio: null,
        profileUrl: profileUrl(platform, legacyHandle),
        checkedAt: null,
      };
    }
    return { platform, kind: "missing", searchUrl };
  });
}

/** The ranking follower count after a profile changes: the largest found. */
export function largestFollowers(profiles: LeadSocialProfiles): number | null {
  const counts = socialPlatforms.flatMap((p) => {
    const profile = profiles[p];
    return profile?.status === "found" && profile.followers !== null
      ? [profile.followers]
      : [];
  });
  return counts.length > 0 ? Math.max(...counts) : null;
}
