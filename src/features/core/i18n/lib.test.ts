import { describe, expect, it } from "vitest";

import { createI18n, dt } from "./lib";

const translations = {
  en: {
    plain: dt("{count} of {target} conversations. Decide after {target}.", {}),
    typed: dt("{n:number} sent, {n:number} logged", {}),
    single: dt("Hello {name}", {}),
  },
};

describe("createI18n substitution", () => {
  const { t } = createI18n(translations, "en", "en");

  it("fills every occurrence of a repeated plain placeholder", () => {
    expect(t("plain", { count: "0", target: "10" })).toBe(
      "0 of 10 conversations. Decide after 10.",
    );
  });

  it("fills every occurrence of a repeated typed placeholder", () => {
    expect(t("typed", { n: 3 })).toBe("3 sent, 3 logged");
  });

  it("still fills a single placeholder", () => {
    expect(t("single", { name: "Megz" })).toBe("Hello Megz");
  });
});
