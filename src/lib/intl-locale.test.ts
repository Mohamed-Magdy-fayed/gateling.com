import { describe, expect, it } from "vitest";

import { withLatinDigits } from "./intl-locale";

const ARABIC_INDIC = /[٠-٩]/;

describe("withLatinDigits", () => {
  it("adds the latn numbering system to Arabic locales", () => {
    expect(withLatinDigits("ar")).toBe("ar-u-nu-latn");
    expect(withLatinDigits("ar-EG")).toBe("ar-EG-u-nu-latn");
  });

  it("leaves other locales, undefined and already-extended tags alone", () => {
    expect(withLatinDigits("en")).toBe("en");
    expect(withLatinDigits("en-US")).toBe("en-US");
    expect(withLatinDigits(undefined)).toBeUndefined();
    expect(withLatinDigits("ar-u-nu-latn")).toBe("ar-u-nu-latn");
  });

  it("makes Arabic numbers and dates format with 0-9", () => {
    const number = new Intl.NumberFormat(withLatinDigits("ar-EG")).format(1234);
    // "ar-EG" defaults to Arabic-Indic digits (١٬٢٣٤); that was the bug.
    const date = new Intl.DateTimeFormat(withLatinDigits("ar-EG"), {
      dateStyle: "medium",
    }).format(new Date(Date.UTC(2026, 10, 27)));

    expect(number).not.toMatch(ARABIC_INDIC);
    expect(number).toMatch(/1.?234/);
    expect(date).not.toMatch(ARABIC_INDIC);
    expect(date).toMatch(/2026/);
  });
});
