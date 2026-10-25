import { describe, expect, it } from "vitest";

import {
  googleSearchUrl,
  isPlatformUrl,
  largestFollowers,
  normalizePlatform,
  profileUrl,
  type SocialLeadFields,
  socialProfiles,
} from "./social-profiles";

function lead(extra: Partial<SocialLeadFields> = {}): SocialLeadFields {
  return {
    name: "Atelier Farida",
    city: "Cairo",
    area: "Nasr City",
    address: null,
    socialPlatform: null,
    socialHandle: null,
    socialFollowers: null,
    socialProfiles: {},
    ...extra,
  };
}

function query(url: string): string | null {
  return new URL(url).searchParams.get("q");
}

describe("normalizePlatform", () => {
  it("maps free-text names and abbreviations", () => {
    expect(normalizePlatform("Instagram", null)).toBe("instagram");
    expect(normalizePlatform(" IG ", null)).toBe("instagram");
    expect(normalizePlatform("FB", null)).toBe("facebook");
    expect(normalizePlatform("Tik Tok", null)).toBe("tiktok");
  });

  it("falls back to the handle's host when the platform is blank", () => {
    expect(normalizePlatform(null, "https://www.tiktok.com/@farida")).toBe(
      "tiktok",
    );
    expect(normalizePlatform("", "https://m.facebook.com/farida")).toBe(
      "facebook",
    );
  });

  it("returns null for anything else", () => {
    expect(normalizePlatform("Website", "https://farida.com")).toBeNull();
    expect(normalizePlatform(null, "farida")).toBeNull();
  });
});

describe("profileUrl", () => {
  it("builds platform URLs from a bare or @ handle", () => {
    expect(profileUrl("instagram", "@farida.atelier")).toBe(
      "https://www.instagram.com/farida.atelier",
    );
    expect(profileUrl("tiktok", "farida")).toBe(
      "https://www.tiktok.com/@farida",
    );
  });

  it("keeps an http(s) URL and rejects unsafe or unparseable handles", () => {
    expect(profileUrl("facebook", "https://facebook.com/farida")).toBe(
      "https://facebook.com/farida",
    );
    expect(profileUrl("facebook", "javascript:alert(1)")).toBeNull();
    expect(profileUrl("instagram", "Atelier Farida")).toBeNull();
  });
});

describe("googleSearchUrl", () => {
  it("searches name + platform + address when there is one", () => {
    const url = googleSearchUrl(
      lead({ address: "12 Abbas El-Akkad St" }),
      "tiktok",
    );
    expect(url.startsWith("https://www.google.com/search?q=")).toBe(true);
    expect(query(url)).toBe("Atelier Farida tiktok 12 Abbas El-Akkad St");
  });

  it("falls back to area and city, then to name only", () => {
    expect(query(googleSearchUrl(lead(), "instagram"))).toBe(
      "Atelier Farida instagram Nasr City Cairo",
    );
    expect(
      query(googleSearchUrl(lead({ area: null, city: null }), "facebook")),
    ).toBe("Atelier Farida facebook");
  });
});

describe("socialProfiles", () => {
  it("fills the stored platform and offers a search for the others", () => {
    const profiles = socialProfiles(
      lead({
        socialPlatform: "Instagram",
        socialHandle: "@farida",
        socialFollowers: 12_000,
      }),
    );
    expect(profiles.map((p) => [p.platform, p.kind])).toEqual([
      ["instagram", "found"],
      ["facebook", "missing"],
      ["tiktok", "missing"],
    ]);
    expect(profiles[0]).toMatchObject({
      handle: "farida",
      followers: 12_000,
      profileUrl: "https://www.instagram.com/farida",
    });
  });

  it("treats a platform without a handle as missing", () => {
    const profiles = socialProfiles(lead({ socialPlatform: "TikTok" }));
    expect(profiles.every((p) => p.kind === "missing")).toBe(true);
  });
});

describe("researched profiles", () => {
  const found = {
    status: "found" as const,
    url: "https://www.tiktok.com/@farida",
    handle: "@farida",
    followers: 40_000,
    posts: 120,
    bio: "Bridal & soirée rentals",
    checkedAt: "2026-10-20T10:00:00.000Z",
  };

  it("prefers a researched entry over the legacy pair", () => {
    const [instagram, , tiktok] = socialProfiles(
      lead({
        socialPlatform: "Instagram",
        socialHandle: "@old",
        socialProfiles: {
          instagram: {
            ...found,
            url: "https://instagram.com/new",
            handle: "new",
          },
          tiktok: found,
        },
      }),
    );
    expect(instagram).toMatchObject({ kind: "found", handle: "new" });
    expect(tiktok).toMatchObject({
      kind: "found",
      handle: "farida",
      followers: 40_000,
      posts: 120,
      profileUrl: "https://www.tiktok.com/@farida",
      checkedAt: found.checkedAt,
    });
  });

  it("shows a searched-but-absent platform as notFound with a search link", () => {
    const facebook = socialProfiles(
      lead({
        socialProfiles: {
          facebook: { status: "notFound", checkedAt: found.checkedAt },
        },
      }),
    )[1];
    expect(facebook).toMatchObject({
      kind: "notFound",
      checkedAt: found.checkedAt,
    });
    expect(facebook.kind !== "found" && facebook.searchUrl).toContain(
      "google.com",
    );
  });

  it("drops a stored link that is not on the platform's domain", () => {
    const [instagram] = socialProfiles(
      lead({
        socialProfiles: {
          instagram: { ...found, url: "https://evil.example/instagram.com" },
        },
      }),
    );
    expect(instagram).toMatchObject({ kind: "found", profileUrl: null });
  });
});

describe("isPlatformUrl", () => {
  it("accepts the platform's own hosts only", () => {
    expect(isPlatformUrl("facebook", "https://m.facebook.com/farida")).toBe(
      true,
    );
    expect(isPlatformUrl("instagram", "https://instagram.com.evil.io/x")).toBe(
      false,
    );
    expect(isPlatformUrl("tiktok", "https://www.instagram.com/x")).toBe(false);
  });
});

describe("largestFollowers", () => {
  it("takes the biggest found count and ignores notFound", () => {
    expect(
      largestFollowers({
        instagram: {
          status: "found",
          url: "https://instagram.com/a",
          handle: null,
          followers: 9_000,
          posts: null,
          bio: null,
          checkedAt: "",
        },
        tiktok: {
          status: "found",
          url: "https://tiktok.com/@a",
          handle: null,
          followers: 52_000,
          posts: null,
          bio: null,
          checkedAt: "",
        },
        facebook: { status: "notFound", checkedAt: "" },
      }),
    ).toBe(52_000);
    expect(largestFollowers({})).toBeNull();
  });
});

describe("links never leave the platform", () => {
  it("does not link a legacy handle that is a URL on another site", () => {
    expect(profileUrl("instagram", "https://evil.example/login")).toBeNull();
    const [instagram] = socialProfiles(
      lead({
        socialPlatform: "Instagram",
        socialHandle: "https://evil.example/login",
      }),
    );
    expect(instagram).toMatchObject({ kind: "found", profileUrl: null });
  });

  it("rejects redirecting subdomains (link shim, short links)", () => {
    expect(
      isPlatformUrl(
        "facebook",
        "https://l.facebook.com/l.php?u=https://evil.example",
      ),
    ).toBe(false);
    expect(isPlatformUrl("tiktok", "https://vm.tiktok.com/ZMabc/")).toBe(false);
  });
});
