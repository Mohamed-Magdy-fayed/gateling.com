import { describe, expect, it } from "vitest";

import {
  isHoneypotFilled,
  selfServeLeadSchema,
  toSelfServeLeadRow,
} from "./self-serve-lead";

const valid = {
  ownerName: " Aalaa ",
  phone: "01012345678",
  atelierName: "Atelier Alkasry",
  city: "Cairo",
  branches: "2",
  dressVolume: "100-300",
  currentTool: "Notebook",
  biggestPain: "Double bookings",
  priceReaction: "fair",
  contactPreference: "call",
  socialLink: "https://instagram.com/atelier",
  demoStepsCompleted: ["add-dress", "book"],
  locale: "ar",
  consent: true,
  website: "",
};

describe("self-serve lead", () => {
  it("accepts a full payload and trims", () => {
    const r = selfServeLeadSchema.parse(valid);
    expect(r.ownerName).toBe("Aalaa");
  });

  it("requires consent and the core fields", () => {
    expect(
      selfServeLeadSchema.safeParse({ ...valid, consent: false }).success,
    ).toBe(false);
    expect(selfServeLeadSchema.safeParse({ ...valid, phone: "" }).success).toBe(
      false,
    );
    expect(
      selfServeLeadSchema.safeParse({ ...valid, atelierName: "" }).success,
    ).toBe(false);
  });

  it("accepts only the known price reactions and safe links", () => {
    for (const v of ["fair", "expensive", "think"])
      expect(
        selfServeLeadSchema.safeParse({ ...valid, priceReaction: v }).success,
      ).toBe(true);
    for (const bad of [
      { priceReaction: "cheap" },
      { contactPreference: "email" },
      { socialLink: "javascript:alert(1)" },
    ])
      expect(selfServeLeadSchema.safeParse({ ...valid, ...bad }).success).toBe(
        false,
      );
  });

  it("detects a filled honeypot", () => {
    expect(isHoneypotFilled({ website: "http://spam" })).toBe(true);
    expect(isHoneypotFilled({ website: "  " })).toBe(false);
    expect(isHoneypotFilled(null)).toBe(false);
  });

  it("maps to a tagged prospect row", () => {
    const row = toSelfServeLeadRow(selfServeLeadSchema.parse(valid), "1.2.3.4");
    expect(row.source).toBe("self-serve");
    expect(row.kind).toBe("prospect");
    expect(row.notes).toContain("Owner: Aalaa");
    expect(row.notes).toContain("Contact preference: call");
    expect(row.notes).toContain("Demo steps completed: add-dress, book");
    expect(row.notes).toContain("Biggest pain: Double bookings");
  });
});
