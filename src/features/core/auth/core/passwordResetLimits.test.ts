import { describe, expect, it } from "vitest";

import {
  clientIpFrom,
  evaluateResetAttempt,
  isOverRateLimit,
  MAX_RESET_CODE_ATTEMPTS,
  PASSWORD_RESET_RATE_LIMITS,
  RESET_ATTEMPTS_METADATA_KEY,
  rateLimitSubject,
  readResetAttempts,
} from "./passwordResetLimits";

describe("readResetAttempts", () => {
  it("reads a positive integer counter", () => {
    expect(readResetAttempts({ [RESET_ATTEMPTS_METADATA_KEY]: 3 })).toBe(3);
  });

  it.each([
    null,
    undefined,
    "3",
    {},
    { [RESET_ATTEMPTS_METADATA_KEY]: "3" },
    { [RESET_ATTEMPTS_METADATA_KEY]: -1 },
    { [RESET_ATTEMPTS_METADATA_KEY]: 1.5 },
  ])("treats %j as zero attempts", (metadata) => {
    expect(readResetAttempts(metadata)).toBe(0);
  });
});

describe("evaluateResetAttempt", () => {
  it("accepts a right code within the cap, including the last allowed guess", () => {
    expect(evaluateResetAttempt(1, true)).toBe("accept");
    expect(evaluateResetAttempt(MAX_RESET_CODE_ATTEMPTS, true)).toBe("accept");
  });

  it("rejects wrong guesses before the cap without revoking", () => {
    for (let n = 1; n < MAX_RESET_CODE_ATTEMPTS; n++) {
      expect(evaluateResetAttempt(n, false)).toBe("reject");
    }
  });

  it("revokes the code on the last allowed wrong guess", () => {
    expect(evaluateResetAttempt(MAX_RESET_CODE_ATTEMPTS, false)).toBe(
      "reject_and_revoke",
    );
  });

  it("refuses even a right code once the cap is passed", () => {
    expect(evaluateResetAttempt(MAX_RESET_CODE_ATTEMPTS + 1, true)).toBe(
      "reject_and_revoke",
    );
  });

  it("lets through at most one success among a burst of parallel guesses", () => {
    // 1,000 parallel guesses, one of them right: each claims its own number.
    const verdicts = Array.from({ length: 1000 }, (_, i) =>
      evaluateResetAttempt(i + 1, i === 999),
    );
    expect(verdicts.filter((v) => v === "accept")).toHaveLength(0);
    expect(verdicts.filter((v) => v === "reject")).toHaveLength(
      MAX_RESET_CODE_ATTEMPTS - 1,
    );
  });
});

describe("isOverRateLimit", () => {
  it("allows up to the limit and blocks the next request", () => {
    const { perEmail } = PASSWORD_RESET_RATE_LIMITS.request;
    expect(isOverRateLimit(perEmail, perEmail)).toBe(false);
    expect(isOverRateLimit(perEmail + 1, perEmail)).toBe(true);
  });

  it("keeps request limits tighter than verify limits", () => {
    const { request, reset } = PASSWORD_RESET_RATE_LIMITS;
    expect(request.perEmail).toBeLessThan(reset.perEmail);
    expect(request.perIp).toBeLessThanOrEqual(reset.perIp);
  });
});

describe("clientIpFrom", () => {
  const headersOf = (values: Record<string, string>) => ({
    get: (name: string) => values[name] ?? null,
  });

  it("prefers Vercel's header and takes the first hop", () => {
    expect(
      clientIpFrom(
        headersOf({
          "x-vercel-forwarded-for": "203.0.113.7, 10.0.0.1",
          "x-forwarded-for": "198.51.100.1",
        }),
      ),
    ).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(clientIpFrom(headersOf({ "x-real-ip": " 198.51.100.2 " }))).toBe(
      "198.51.100.2",
    );
    expect(clientIpFrom(headersOf({}))).toBe("unknown");
  });
});

describe("rateLimitSubject", () => {
  it("keeps IPv4 addresses as they are", () => {
    expect(rateLimitSubject("203.0.113.7")).toBe("203.0.113.7");
  });

  it("buckets IPv6 addresses by /64", () => {
    expect(rateLimitSubject("2001:db8:abcd:12:1:2:3:4")).toBe(
      "2001:db8:abcd:12::/64",
    );
    expect(rateLimitSubject("2001:DB8:abcd:0012::99")).toBe(
      "2001:db8:abcd:12::/64",
    );
    expect(rateLimitSubject("2001:db8::1")).toBe("2001:db8:0:0::/64");
  });
});
