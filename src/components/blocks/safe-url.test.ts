import { describe, expect, it } from "vitest";

import { isSafeHref } from "./safe-url";

describe("isSafeHref", () => {
  it("allows site paths, anchors and http(s) URLs", () => {
    expect(isSafeHref("/contact")).toBe(true);
    expect(isSafeHref("#pricing")).toBe(true);
    expect(isSafeHref("https://meetings.gateling.com")).toBe(true);
  });

  it("rejects script and data schemes", () => {
    expect(isSafeHref("javascript:alert(1)")).toBe(false);
    expect(isSafeHref(" JavaScript:alert(1)")).toBe(false);
    expect(isSafeHref("data:text/html,<script>")).toBe(false);
  });

  it("rejects protocol-relative URLs that leave the site", () => {
    expect(isSafeHref("//evil.example")).toBe(false);
    expect(isSafeHref("/\\evil.example")).toBe(false);
  });

  it("rejects empty values", () => {
    expect(isSafeHref("")).toBe(false);
    expect(isSafeHref(null)).toBe(false);
  });
});
