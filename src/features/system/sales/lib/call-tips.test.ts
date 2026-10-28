import { describe, expect, it } from "vitest";

import { type CallTipInput, callTips } from "./call-tips";

function input(extra: Partial<CallTipInput> = {}): CallTipInput {
  return {
    whatsappName: null,
    rating: null,
    reviewCount: null,
    followers: {},
    locationCount: 0,
    ...extra,
  };
}

describe("callTips", () => {
  it("builds every tip when the facts are on file, in a fixed order", () => {
    expect(
      callTips(
        input({
          whatsappName: " SASHA Bridal ",
          rating: 4.7,
          reviewCount: 286,
          followers: { facebook: 48200, instagram: 21400, tiktok: 9870 },
          locationCount: 2,
        }),
      ),
    ).toEqual([
      { kind: "askFor", name: "SASHA Bridal" },
      { kind: "rating", rating: 4.7, reviews: 286 },
      { kind: "topPlatform", platform: "facebook", followers: 48200 },
      { kind: "locations", count: 2 },
    ]);
  });

  it("returns nothing for an empty record", () => {
    expect(callTips(input())).toEqual([]);
  });

  it("skips a rating without reviews", () => {
    expect(callTips(input({ rating: 5, reviewCount: 0 }))).toEqual([]);
  });

  it("ignores platforms with no or zero followers", () => {
    expect(
      callTips(
        input({ followers: { facebook: null, instagram: 0, tiktok: 12 } }),
      ),
    ).toEqual([{ kind: "topPlatform", platform: "tiktok", followers: 12 }]);
  });

  it("does not ask about locations for a single shop", () => {
    expect(callTips(input({ locationCount: 1 }))).toEqual([]);
  });
});
