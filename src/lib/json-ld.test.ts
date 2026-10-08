import { describe, expect, it } from "vitest";

import { serializeJsonLd } from "./json-ld";

describe("serializeJsonLd", () => {
  it("cannot close the surrounding script tag", () => {
    const out = serializeJsonLd({
      headline: "</script><script>alert(1)</script>",
    });
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
  });

  it("round-trips to the same data", () => {
    const data = { name: "A & B <c>", nested: ["x y"] };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });
});
