import "server-only";

import { and, eq, isNull, lt, or } from "drizzle-orm";

import { db } from "@/drizzle";
import { ApiKeysTable, UsersTable } from "@/drizzle/schema";
import { redisClient } from "@/integrations/redis";
import { apiKeyPrefix, isWellFormedApiKey, verifyApiKey } from "./keys";

/** Who an authenticated machine request acts as. */
export type ApiKeyActor = {
  keyId: string;
  keyName: string;
  user: {
    id: string;
    role: "admin";
    email: string;
    name: string | null;
    emailVerifiedAt: string | null;
  };
};

export class ApiKeyAuthError extends Error {
  constructor(
    readonly status: 401 | 403 | 429,
    message: string,
  ) {
    super(message);
    this.name = "ApiKeyAuthError";
  }
}

/** Failed or unauthenticated attempts per IP, per window. */
const AUTH_ATTEMPTS_PER_WINDOW = 30;
/** Authenticated calls per key, per window — generous for an agent writing content. */
const CALLS_PER_KEY_PER_WINDOW = 300;
const RATE_WINDOW_SECONDS = 60;
/** `lastUsedAt` is informational; one write a minute per key is plenty. */
const LAST_USED_WRITE_INTERVAL_MS = 60_000;

/**
 * The whole front door for `/api/mcp`: a per-IP budget of failed attempts
 * (bounds guessing without throttling a working agent), the key itself, the
 * owner still being an active admin, then a per-key budget (bounds a leaked
 * key). Throws `ApiKeyAuthError`; the same 401 whether the key is unknown,
 * wrong or revoked, so probing learns nothing.
 */
export async function resolveApiKeyRequest(
  request: Request,
): Promise<ApiKeyActor> {
  const failureBucket = `ratelimit:apikey-auth:${requestIp(request)}`;
  if (await isOverLimit(failureBucket, AUTH_ATTEMPTS_PER_WINDOW)) {
    throw new ApiKeyAuthError(429, "Too many requests.");
  }
  try {
    return await authenticate(request);
  } catch (error) {
    if (error instanceof ApiKeyAuthError && error.status === 401) {
      await overBudget(failureBucket, AUTH_ATTEMPTS_PER_WINDOW);
    }
    throw error;
  }
}

async function authenticate(request: Request): Promise<ApiKeyActor> {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, key] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !key || !isWellFormedApiKey(key)) {
    throw new ApiKeyAuthError(401, "Missing or malformed API key.");
  }

  const [row] = await db
    .select({
      keyId: ApiKeysTable.id,
      keyName: ApiKeysTable.name,
      keyHash: ApiKeysTable.keyHash,
      revokedAt: ApiKeysTable.revokedAt,
      userId: UsersTable.id,
      role: UsersTable.role,
      email: UsersTable.email,
      name: UsersTable.name,
      emailVerifiedAt: UsersTable.emailVerifiedAt,
      deletedAt: UsersTable.deletedAt,
    })
    .from(ApiKeysTable)
    .innerJoin(UsersTable, eq(UsersTable.id, ApiKeysTable.userId))
    .where(eq(ApiKeysTable.keyPrefix, apiKeyPrefix(key)))
    .limit(1);

  if (!row || row.revokedAt != null || !verifyApiKey(key, row.keyHash)) {
    throw new ApiKeyAuthError(401, "Invalid API key.");
  }
  // The key acts as its owner, so it dies with the owner's admin rights.
  if (row.deletedAt != null || row.role !== "admin") {
    throw new ApiKeyAuthError(403, "The key's owner is no longer an admin.");
  }

  if (
    await overBudget(`ratelimit:apikey:${row.keyId}`, CALLS_PER_KEY_PER_WINDOW)
  ) {
    throw new ApiKeyAuthError(429, "Too many requests.");
  }

  await touchLastUsed(row.keyId);

  return {
    keyId: row.keyId,
    keyName: row.keyName,
    user: {
      id: row.userId,
      role: "admin",
      email: row.email,
      name: row.name,
      emailVerifiedAt: row.emailVerifiedAt?.toISOString() ?? null,
    },
  };
}

function requestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Reads a fixed-window counter without counting this request. */
async function isOverLimit(bucket: string, limit: number): Promise<boolean> {
  try {
    return ((await redisClient.get<number>(bucket)) ?? 0) >= limit;
  } catch (error) {
    console.error("[api-keys] rate limit unavailable", error);
    return false;
  }
}

/** Fixed-window counter; fails open if Redis is down so content work isn't blocked by a cache outage. */
async function overBudget(bucket: string, limit: number): Promise<boolean> {
  try {
    const count = await redisClient.incr(bucket);
    if (count === 1) await redisClient.expire(bucket, RATE_WINDOW_SECONDS);
    return count > limit;
  } catch (error) {
    console.error("[api-keys] rate limit unavailable", error);
    return false;
  }
}

async function touchLastUsed(keyId: string): Promise<void> {
  await db
    .update(ApiKeysTable)
    .set({ lastUsedAt: new Date() })
    .where(
      and(
        eq(ApiKeysTable.id, keyId),
        or(
          isNull(ApiKeysTable.lastUsedAt),
          lt(
            ApiKeysTable.lastUsedAt,
            new Date(Date.now() - LAST_USED_WRITE_INTERVAL_MS),
          ),
        ),
      ),
    );
}
