import "server-only";

import { headers } from "next/headers";

import { env } from "@/env/server";
import { redisClient } from "@/integrations/redis";

import {
  type BotGuardAction,
  type BotGuardFields,
  clientIpFrom,
  evaluateFormSignals,
  isCloudflareTestKey,
  isTurnstileResultValid,
  RATE_LIMIT_WINDOW_SECONDS,
  RATE_LIMITS,
  rateLimitSubject,
  type TurnstileVerifyResponse,
} from "../lib/rules";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_TIMEOUT_MS = 5000;

export type BotGuardRejection = "verification_failed" | "rate_limited";

export type BotGuardResult =
  | { ok: true; ip: string }
  | { ok: false; reason: BotGuardRejection };

/** i18n key for each rejection, for callers that surface the message. */
export const BOT_GUARD_MESSAGE_KEYS = {
  verification_failed: "common.botGuard.verificationFailed",
  rate_limited: "common.botGuard.tooManyRequests",
} as const satisfies Record<BotGuardRejection, string>;

/**
 * Runs every public-form check in cheapest-first order: form signals, then
 * the per-IP rate limit, then Turnstile. Callers reject the request when this
 * returns `ok: false` and must not reveal which check tripped — a bot that
 * learns "honeypot" stops filling the honeypot.
 */
export async function checkHumanSubmission(
  action: BotGuardAction,
  fields: BotGuardFields,
): Promise<BotGuardResult> {
  const ip = clientIpFrom(await headers());

  const signals = evaluateFormSignals(fields, Date.now());
  if (signals !== "ok") {
    console.warn("[bot-guard] rejected form signals", { action, signals });
    return { ok: false, reason: "verification_failed" };
  }

  if (await isRateLimited(action, ip)) {
    console.warn("[bot-guard] rate limited", { action });
    return { ok: false, reason: "rate_limited" };
  }

  if (!(await passesTurnstile(action, fields.botToken, ip))) {
    return { ok: false, reason: "verification_failed" };
  }

  return { ok: true, ip };
}

async function isRateLimited(
  action: BotGuardAction,
  ip: string,
): Promise<boolean> {
  const bucket = `ratelimit:form:${action}:${rateLimitSubject(ip)}`;
  try {
    // One round trip, and the expiry is set together with the key: a
    // separate INCR then EXPIRE can leave a key that never expires (and an
    // address locked out for good) if the second call fails.
    const tx = redisClient.multi();
    tx.set(bucket, 0, { ex: RATE_LIMIT_WINDOW_SECONDS, nx: true });
    tx.incr(bucket);
    const [, count] = await tx.exec<[unknown, number]>();
    return count > RATE_LIMITS[action];
  } catch (error) {
    // Fail open: a Redis outage must not take the contact form down with it.
    // Turnstile and the form signals still apply.
    console.error("[bot-guard] rate limit unavailable", error);
    return false;
  }
}

/**
 * On production a token must have been issued on our own domain (apex or
 * www). Preview deployments live on per-branch hosts, so they are not pinned.
 */
function productionHostnames(): string[] | undefined {
  if (process.env.VERCEL_ENV !== "production") return undefined;
  const host = new URL(env.BASE_URL).hostname.replace(/^www\./, "");
  return [host, `www.${host}`];
}

async function passesTurnstile(
  action: BotGuardAction,
  token: string | undefined,
  ip: string,
): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY;
  // Unconfigured only outside Vercel — `env/server.ts` refuses to boot a
  // production or preview deployment without the key.
  if (!secret) return true;
  if (!token) {
    console.warn("[bot-guard] missing Turnstile token", { action });
    return false;
  }

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip !== "unknown") body.set("remoteip", ip);

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(TURNSTILE_TIMEOUT_MS),
    });
    const result = (await response.json()) as TurnstileVerifyResponse;

    // Test keys (local/e2e only — production rejects them in env/server.ts)
    // return no meaningful action or hostname, so only `success` counts.
    const valid = isCloudflareTestKey(secret)
      ? result.success
      : isTurnstileResultValid(result, {
          action,
          hostnames: productionHostnames(),
        });

    if (!valid) {
      console.warn("[bot-guard] Turnstile rejected", {
        action,
        errors: result["error-codes"],
        tokenAction: result.action,
      });
      return false;
    }
    return true;
  } catch (error) {
    // Fail closed: if Cloudflare cannot vouch for the request, it is not let
    // through. Humans retry; the widget re-issues a token.
    console.error("[bot-guard] Turnstile verification unavailable", error);
    return false;
  }
}
