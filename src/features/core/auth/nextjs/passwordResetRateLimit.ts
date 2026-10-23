import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

import {
  clientIpFrom,
  isOverRateLimit,
  PASSWORD_RESET_RATE_LIMIT_WINDOW_SECONDS,
  PASSWORD_RESET_RATE_LIMITS,
  type PasswordResetRateLimitAction,
  rateLimitSubject,
} from "@/features/core/auth/core/passwordResetLimits";
import { redisClient } from "@/integrations/redis";

/**
 * Counts this request against the per-IP and per-email windows for `action`
 * and returns true when either is exceeded. Callers must not say which one
 * tripped, and must call this before looking the email up so the answer is
 * the same whether or not the account exists.
 *
 * Fails closed: if Redis is down, password reset is unavailable rather than
 * unlimited — the per-code attempt cap alone does not stop an attacker from
 * requesting fresh codes forever.
 */
export async function isPasswordResetRateLimited(
  action: PasswordResetRateLimitAction,
  normalizedEmail: string,
): Promise<boolean> {
  const ip = clientIpFrom(await headers());
  const limits = PASSWORD_RESET_RATE_LIMITS[action];
  // Hashed so Redis never holds an email address.
  const emailKey = createHash("sha256").update(normalizedEmail).digest("hex");
  const ipBucket = `ratelimit:password-reset:${action}:ip:${rateLimitSubject(ip)}`;
  const emailBucket = `ratelimit:password-reset:${action}:email:${emailKey}`;

  try {
    // SET NX EX + INCR in one transaction: the expiry is set together with
    // the key, so a failed second call can never leave a counter that lives
    // forever (and an address locked out for good).
    const tx = redisClient.multi();
    tx.set(ipBucket, 0, {
      ex: PASSWORD_RESET_RATE_LIMIT_WINDOW_SECONDS,
      nx: true,
    });
    tx.incr(ipBucket);
    tx.set(emailBucket, 0, {
      ex: PASSWORD_RESET_RATE_LIMIT_WINDOW_SECONDS,
      nx: true,
    });
    tx.incr(emailBucket);
    const [, ipCount, , emailCount] =
      await tx.exec<[unknown, number, unknown, number]>();

    const limited =
      isOverRateLimit(ipCount, limits.perIp) ||
      isOverRateLimit(emailCount, limits.perEmail);
    if (limited) console.warn("[password-reset] rate limited", { action });
    return limited;
  } catch (error) {
    console.error("[password-reset] rate limit unavailable", error);
    return true;
  }
}
