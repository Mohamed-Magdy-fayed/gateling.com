import { z } from "zod";

/**
 * Cheap, DB-free bot signals for public forms. Pure so the thresholds can be
 * tested at their edges; the network checks (Turnstile, rate limit) live in
 * `../server/guard.ts`.
 *
 * Every public form posts these three fields alongside its own data:
 *
 * - `botToken`      Cloudflare Turnstile token (absent when the site key is
 *                   not configured, e.g. local dev without keys).
 * - `website`       Honeypot. Rendered off-screen and hidden from assistive
 *                   tech; a human never fills it, form-filling bots do.
 * - `formStartedAt` Epoch ms when the form mounted. Client-supplied, so it
 *                   only stops naive scripts — that is all it is for.
 */

export const botGuardActionValues = [
  "signup",
  "contact",
  "newsletter",
] as const;
export type BotGuardAction = (typeof botGuardActionValues)[number];

export const botGuardFieldsSchema = z.object({
  botToken: z.string().max(2048).optional(),
  website: z.string().max(256).optional(),
  formStartedAt: z.number().int().nonnegative().optional(),
});
export type BotGuardFields = z.infer<typeof botGuardFieldsSchema>;

/** Faster than any human can fill even a one-field form. */
export const MIN_FILL_MS = 1500;

/** Fixed-window limits per IP, per form. Generous for humans, fatal for loops. */
export const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
export const RATE_LIMITS: Record<BotGuardAction, number> = {
  signup: 5,
  contact: 5,
  newsletter: 10,
};

export type FormSignalVerdict = "ok" | "honeypot" | "too_fast";

export function evaluateFormSignals(
  fields: BotGuardFields,
  now: number,
): FormSignalVerdict {
  if (fields.website && fields.website.trim() !== "") return "honeypot";
  // A missing timestamp is treated as a scripted post: the real form always
  // sends one.
  if (fields.formStartedAt === undefined) return "too_fast";
  if (now - fields.formStartedAt < MIN_FILL_MS) return "too_fast";
  return "ok";
}

/** Splits a combined payload into the guard fields and the form's own data. */
export function splitBotGuardFields<T extends BotGuardFields>(
  input: T,
): { guard: BotGuardFields; data: Omit<T, keyof BotGuardFields> } {
  const { botToken, website, formStartedAt, ...data } = input;
  return { guard: { botToken, website, formStartedAt }, data };
}

/** Fits `leads.ipAddress` (varchar 64). */
const MAX_IP_LENGTH = 64;

/**
 * Client IP as Vercel reports it. Vercel overwrites these headers, so they
 * are trustworthy there — off Vercel (or behind another proxy such as a
 * Cloudflare-proxied domain) they are spoofable or collapse to the proxy's
 * address, and the per-IP rate limit should be revisited.
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

export type TurnstileVerifyResponse = {
  success: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

/**
 * Cloudflare's published test keys (`1x…`, `2x…`, `3x…`) always pass or
 * always fail. Fine for local runs and e2e; never valid in production.
 */
export function isCloudflareTestKey(key: string): boolean {
  return /^[123]x0{10,}/.test(key);
}

/**
 * A token is only good for the form it was issued on — a token minted on the
 * newsletter box must not unlock sign-up — and, when `hostnames` is given,
 * only on our own site.
 */
export function isTurnstileResultValid(
  result: TurnstileVerifyResponse,
  expected: { action: BotGuardAction; hostnames?: readonly string[] },
): boolean {
  if (!result.success) return false;
  if (result.action !== expected.action) return false;
  if (
    expected.hostnames &&
    !expected.hostnames.includes(result.hostname ?? "")
  ) {
    return false;
  }
  return true;
}
