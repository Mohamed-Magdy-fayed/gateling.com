import { describe, expect, it } from "vitest";

import { channelForUrl, handleForUrl, normalizeUrl, parseShare } from "./links";

describe("links", () => {
  it("detects the channel from the host", () => {
    expect(channelForUrl("https://www.facebook.com/someshop")).toBe("facebook");
    expect(channelForUrl("https://m.facebook.com/someshop")).toBe("facebook");
    expect(channelForUrl("https://www.instagram.com/someshop/")).toBe(
      "instagram",
    );
    expect(channelForUrl("https://wa.me/201001234567")).toBe("whatsapp");
    expect(channelForUrl("https://www.linkedin.com/in/someone")).toBe(
      "linkedin",
    );
    expect(channelForUrl("https://example.com")).toBeNull();
    expect(channelForUrl("not a url")).toBeNull();
  });

  it("extracts a handle from a profile URL but not from a post URL", () => {
    expect(handleForUrl("https://www.instagram.com/bridal.house/")).toBe(
      "bridal.house",
    );
    expect(handleForUrl("https://www.instagram.com/p/Cx123/")).toBeNull();
    expect(handleForUrl("https://www.facebook.com/profile.php?id=1000")).toBe(
      "1000",
    );
    expect(handleForUrl("https://wa.me/201001234567")).toBe("201001234567");
    expect(handleForUrl("https://www.linkedin.com/in/jane-doe")).toBe(
      "jane-doe",
    );
  });

  it("strips tracking parameters and trailing slashes", () => {
    expect(
      normalizeUrl(
        "https://www.instagram.com/bridal.house/?igsh=abc&utm_source=x",
      ),
    ).toBe("https://www.instagram.com/bridal.house");
    expect(
      normalizeUrl("https://www.facebook.com/profile.php?id=1000&mibextid=z"),
    ).toBe("https://www.facebook.com/profile.php?id=1000");
  });

  it("parses an Android share where the URL arrives inside the text", () => {
    const parsed = parseShare({
      text: "شوف المحل ده https://www.facebook.com/dress.rent.cairo?mibextid=abc",
    });
    expect(parsed).toEqual({
      url: "https://www.facebook.com/dress.rent.cairo",
      channel: "facebook",
      handle: "dress.rent.cairo",
      text: "شوف المحل ده",
    });
  });

  it("returns only text when nothing was linked", () => {
    expect(parseShare({ text: "  مرحبا  " })).toEqual({
      url: null,
      channel: null,
      handle: null,
      text: "مرحبا",
    });
  });
});
