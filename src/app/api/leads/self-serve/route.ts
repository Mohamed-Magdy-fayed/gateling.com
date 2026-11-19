import { createHash } from "node:crypto";

import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/drizzle";
import { LeadsTable } from "@/drizzle/schema";
import { clientIpFrom } from "@/features/core/auth/core/passwordResetLimits";
import {
  ApiKeyAuthError,
  resolveApiKeyRequest,
} from "@/features/system/api-keys/server/auth";
import {
  isHoneypotFilled,
  SELF_SERVE_SOURCE,
  selfServeLeadSchema,
  toSelfServeLeadRow,
} from "@/features/system/sales/lib/self-serve-lead";
import { redisClient } from "@/integrations/redis";

/**
 * `POST /api/leads/self-serve` — the Atelier system's /try page forwards each
 * signup questionnaire here (server to server). Stored as a sales prospect
 * tagged `source = self-serve`. See docs/self-serve-leads.md.
 *
 * Auth: `Authorization: Bearer <gl_live_… key>` created on gateling.com /settings
 * with the "Self-serve leads" scope. No environment variables.
 */
const WINDOW_SECONDS = 600;
const CALLS_PER_WINDOW = 120;
const PER_PHONE_PER_HOUR = 5;
const MAX_BODY_BYTES = 8_000;

/** Counts one hit in a fixed window; true once over `limit`. Fails open. */
async function overLimit(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const tx = redisClient.multi();
    tx.set(bucket, 0, { ex: windowSeconds, nx: true });
    tx.incr(bucket);
    const [, count] = await tx.exec<[unknown, number]>();
    return count > limit;
  } catch (error) {
    console.error("[self-serve-lead] rate limit unavailable", error);
    return false;
  }
}

const json = (body: Record<string, unknown>, status: number) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request): Promise<Response> {
  const ip = clientIpFrom(request.headers);
  try {
    await resolveApiKeyRequest(request, "leads");
  } catch (error) {
    if (error instanceof ApiKeyAuthError) {
      return json(
        { error: error.status === 429 ? "rate_limited" : "unauthorized" },
        error.status,
      );
    }
    throw error;
  }

  if (
    await overLimit(
      "ratelimit:self-serve:all",
      CALLS_PER_WINDOW,
      WINDOW_SECONDS,
    )
  ) {
    return json({ error: "rate_limited" }, 429);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: "too_large" }, 413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  // A bot gets the same answer as a person, and nothing is stored.
  if (isHoneypotFilled(body)) return json({ ok: true }, 200);

  const parsed = selfServeLeadSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        error: "invalid",
        fields: parsed.error.issues.map((i) => i.path.join(".")),
      },
      400,
    );
  }
  const input = parsed.data;

  const phoneKey = createHash("sha256").update(input.phone).digest("hex");
  if (
    await overLimit(
      `ratelimit:self-serve:phone:${phoneKey}`,
      PER_PHONE_PER_HOUR,
      3600,
    )
  ) {
    return json({ error: "rate_limited" }, 429);
  }

  // The same phone signing up again within a day is one lead, not two.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [existing] = await db
    .select({ id: LeadsTable.id })
    .from(LeadsTable)
    .where(
      and(
        eq(LeadsTable.source, SELF_SERVE_SOURCE),
        eq(LeadsTable.phone, input.phone),
        gt(LeadsTable.createdAt, dayAgo),
      ),
    )
    .limit(1);
  if (existing)
    return json({ ok: true, id: existing.id, duplicate: true }, 200);

  const [lead] = await db
    .insert(LeadsTable)
    .values(toSelfServeLeadRow(input, ip === "unknown" ? null : ip))
    .returning({ id: LeadsTable.id });

  return json({ ok: true, id: lead.id }, 201);
}
