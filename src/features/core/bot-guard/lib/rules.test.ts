import { describe, expect, it } from "vitest";

import { signUpSchema } from "@/features/core/auth/schemas";

import {
  botGuardFieldsSchema,
  clientIpFrom,
  evaluateFormSignals,
  isCloudflareTestKey,
  isTurnstileResultValid,
  MIN_FILL_MS,
  rateLimitSubject,
  splitBotGuardFields,
} from "./rules";

const NOW = 1_800_000_000_000;

describe("evaluateFormSignals", () => {
  it("passes a human-paced submit with an empty honeypot", () => {
    expect(
      evaluateFormSignals({ website: "", formStartedAt: NOW - 8000 }, NOW),
    ).toBe("ok");
  });

  it("rejects a filled honeypot, even when whitespace-padded", () => {
    expect(
      evaluateFormSignals({ website: " x ", formStartedAt: NOW - 8000 }, NOW),
    ).toBe("honeypot");
  });

  it("rejects a submit faster than MIN_FILL_MS, and accepts it at the boundary", () => {
    expect(
      evaluateFormSignals({ formStartedAt: NOW - (MIN_FILL_MS - 1) }, NOW),
    ).toBe("too_fast");
    expect(evaluateFormSignals({ formStartedAt: NOW - MIN_FILL_MS }, NOW)).toBe(
      "ok",
    );
  });

  it("treats a missing timestamp as a scripted post", () => {
    expect(evaluateFormSignals({}, NOW)).toBe("too_fast");
  });
});

describe("isTurnstileResultValid", () => {
  const signup = { action: "signup" as const };

  it("requires success and a matching action", () => {
    expect(
      isTurnstileResultValid({ success: true, action: "signup" }, signup),
    ).toBe(true);
    expect(
      isTurnstileResultValid({ success: false, action: "signup" }, signup),
    ).toBe(false);
    // A newsletter token must not unlock sign-up.
    expect(
      isTurnstileResultValid({ success: true, action: "newsletter" }, signup),
    ).toBe(false);
  });

  it("rejects a token that carries no action", () => {
    expect(isTurnstileResultValid({ success: true }, signup)).toBe(false);
  });

  it("pins the hostname when an allowlist is given", () => {
    const pinned = {
      ...signup,
      hostnames: ["gateling.com", "www.gateling.com"],
    };
    const result = { success: true, action: "signup" };
    expect(
      isTurnstileResultValid(
        { ...result, hostname: "www.gateling.com" },
        pinned,
      ),
    ).toBe(true);
    expect(
      isTurnstileResultValid({ ...result, hostname: "evil.example" }, pinned),
    ).toBe(false);
    expect(isTurnstileResultValid(result, pinned)).toBe(false);
  });
});

describe("isCloudflareTestKey", () => {
  it("matches the published 1x/2x/3x test keys only", () => {
    expect(isCloudflareTestKey("1x0000000000000000000000000000000AA")).toBe(
      true,
    );
    expect(isCloudflareTestKey("3x00000000000000000000FF")).toBe(true);
    expect(isCloudflareTestKey("0x4AAAAAAABkMYinukE8nzY")).toBe(false);
  });
});

describe("rateLimitSubject", () => {
  it("keeps IPv4 addresses as-is", () => {
    expect(rateLimitSubject("1.2.3.4")).toBe("1.2.3.4");
  });

  it("groups IPv6 addresses by their /64", () => {
    const a = rateLimitSubject("2001:db8:85a3:12:aaaa::1");
    const b = rateLimitSubject("2001:0db8:85a3:0012:ffff:1:2:3");
    expect(a).toBe("2001:db8:85a3:12::/64");
    expect(b).toBe(a);
    expect(rateLimitSubject("2001:db8::1")).toBe("2001:db8:0:0::/64");
    expect(rateLimitSubject("2001:db9::1")).not.toBe(
      rateLimitSubject("2001:db8::1"),
    );
  });
});

describe("splitBotGuardFields", () => {
  it("separates guard fields from the payload the router stores", () => {
    const { guard, data } = splitBotGuardFields({
      email: "a@b.co",
      botToken: "tok",
      website: "",
      formStartedAt: 1,
    });
    expect(data).toEqual({ email: "a@b.co" });
    expect(guard).toEqual({ botToken: "tok", website: "", formStartedAt: 1 });
  });
});

describe("botGuardFieldsSchema", () => {
  it("bounds the honeypot and token sizes", () => {
    expect(
      botGuardFieldsSchema.safeParse({ website: "x".repeat(257) }).success,
    ).toBe(false);
    expect(
      botGuardFieldsSchema.safeParse({ botToken: "x".repeat(2049) }).success,
    ).toBe(false);
  });
});

describe("clientIpFrom", () => {
  it("prefers the first forwarded address, then x-real-ip", () => {
    const h = (entries: Record<string, string>) => new Headers(entries);
    expect(clientIpFrom(h({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe(
      "1.2.3.4",
    );
    expect(clientIpFrom(h({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIpFrom(h({}))).toBe("unknown");
  });

  it("prefers Vercel's own header and caps the length to the column size", () => {
    const h = (entries: Record<string, string>) => new Headers(entries);
    expect(
      clientIpFrom(
        h({
          "x-vercel-forwarded-for": "9.9.9.9",
          "x-forwarded-for": "1.1.1.1",
        }),
      ),
    ).toBe("9.9.9.9");
    expect(
      clientIpFrom(h({ "x-forwarded-for": "x".repeat(200) })),
    ).toHaveLength(64);
  });
});

describe("signUpSchema name", () => {
  const base = {
    email: "sara@example.com",
    password: "Passw0rd!",
    phone: "+201015824280",
  };
  it("trims and bounds the name", () => {
    expect(signUpSchema.safeParse({ ...base, name: "   " }).success).toBe(
      false,
    );
    expect(
      signUpSchema.safeParse({ ...base, name: "x".repeat(101) }).success,
    ).toBe(false);
    expect(signUpSchema.safeParse({ ...base, name: " سارة " }).success).toBe(
      true,
    );
  });
});

describe("signUpSchema phone", () => {
  const base = {
    name: "Sara",
    email: "sara@example.com",
    password: "Passw0rd!",
  };
  const phoneOk = (phone: string) =>
    signUpSchema.safeParse({ ...base, phone }).success;

  it("accepts real E.164 numbers from the phone input", () => {
    expect(phoneOk("+201015824280")).toBe(true);
    expect(phoneOk("+966501234567")).toBe(true);
  });

  // `MobileNumberInput` strips the `+` before it reaches the form, so this is
  // the shape every real sign-up submits.
  it("accepts the phone input's stored shape: digits without the plus", () => {
    expect(phoneOk("201123451235")).toBe(true);
    expect(phoneOk("201015824280")).toBe(true);
  });

  it("stores digits only, matching existing users.phone rows", () => {
    const parsed = signUpSchema.safeParse({ ...base, phone: " +201123451235 " });
    expect(parsed.success && parsed.data.phone).toBe("201123451235");
  });

  it("rejects non-digit input that only looks like a number", () => {
    expect(phoneOk("20112345123x")).toBe(false);
    expect(phoneOk("++201123451235")).toBe(false);
  });

  it("rejects the bot pattern: 12 digits, no plus, not a real number", () => {
    expect(phoneOk("203063367281")).toBe(false);
    expect(phoneOk("+203063367281")).toBe(false);
    expect(phoneOk("")).toBe(false);
  });
});
