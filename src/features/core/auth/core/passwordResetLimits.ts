/**
 * Brute-force limits for the password-reset flow. Pure so the decisions can
 * be tested at their edges; the Redis and database calls live in
 * `../nextjs/passwordResetRateLimit.ts` and the reset action.
 *
 * A reset code is 6 digits, so two independent limits keep guessing hopeless:
 * - each issued code allows `MAX_RESET_CODE_ATTEMPTS` guesses, then is revoked;
 * - both actions are rate-limited per client IP and per email, which caps how
 *   many fresh codes (and so how many guesses) an attacker can get per hour.
 */

/** Guesses allowed against one issued code before it is revoked. */
export const MAX_RESET_CODE_ATTEMPTS = 5;

/** Metadata key on the `user_tokens` row that counts guesses. */
export const RESET_ATTEMPTS_METADATA_KEY = "attempts";

export const PASSWORD_RESET_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

export type PasswordResetRateLimitAction = "request" | "reset";

/** Fixed-window limits per hour. Generous for a human, fatal for a loop. */
export const PASSWORD_RESET_RATE_LIMITS: Record<
  PasswordResetRateLimitAction,
  { perIp: number; perEmail: number }
> = {
  request: { perIp: 10, perEmail: 3 },
  reset: { perIp: 20, perEmail: 10 },
};

/** Reads the guess counter from a token's metadata; anything odd counts as 0. */
export function readResetAttempts(metadata: unknown): number {
  if (typeof metadata !== "object" || metadata === null) return 0;
  const value = (metadata as Record<string, unknown>)[
    RESET_ATTEMPTS_METADATA_KEY
  ];
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : 0;
}

export type ResetAttemptVerdict = "accept" | "reject" | "reject_and_revoke";

/**
 * Decides a guess. `attemptNumber` is the counter *after* this guess was
 * recorded, so it is counted before the code is checked: parallel guesses
 * each claim their own number and only the first `MAX_RESET_CODE_ATTEMPTS`
 * are ever compared — a right code arriving later is still refused.
 */
export function evaluateResetAttempt(
  attemptNumber: number,
  codeMatches: boolean,
): ResetAttemptVerdict {
  if (attemptNumber > MAX_RESET_CODE_ATTEMPTS) return "reject_and_revoke";
  if (codeMatches) return "accept";
  return attemptNumber >= MAX_RESET_CODE_ATTEMPTS
    ? "reject_and_revoke"
    : "reject";
}

/** True once a fixed-window counter has gone past its limit. */
export function isOverRateLimit(count: number, limit: number): boolean {
  return count > limit;
}

// `clientIpFrom` and `rateLimitSubject` mirror the bot-guard helpers in
// feat/anti-bot-signup-leads (PR #10); fold them into one module once both land.

/** Longest IP string we keep, matching `leads.ipAddress` (varchar 64). */
const MAX_IP_LENGTH = 64;

/**
 * Client IP as Vercel reports it. Vercel overwrites these headers, so they
 * are trustworthy there — off Vercel (or behind another proxy) they are
 * spoofable or collapse to the proxy's address.
 */
export function clientIpFrom(headers: Pick<Headers, "get">): string {
  const ip =
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown";
  return ip.slice(0, MAX_IP_LENGTH);
}

/**
 * The unit a rate limit counts. An IPv6 client typically owns a whole /64,
 * so counting single addresses would let it rotate past the limit for free.
 */
export function rateLimitSubject(ip: string): string {
  if (!ip.includes(":")) return ip;

  const [head = "", tail = ""] = ip.toLowerCase().split("::");
  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail ? tail.split(":") : [];
  const missing = Math.max(0, 8 - headGroups.length - tailGroups.length);
  const groups = ip.includes("::")
    ? [...headGroups, ...Array<string>(missing).fill("0"), ...tailGroups]
    : headGroups;

  return `${groups
    .slice(0, 4)
    .map((g) => g.replace(/^0+(?=.)/, ""))
    .join(":")}::/64`;
}
