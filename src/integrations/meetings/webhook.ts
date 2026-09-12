import crypto from "node:crypto";

import { z } from "zod";

/**
 * Receiving side of Gateling Meetings' outbound webhooks
 * (https://meetings.gateling.com — `docs/webhooks.md`).
 *
 *   X-Meetings-Signature: t=<unix seconds>,v1=<hex hmac-sha256(secret, `${t}.${rawBody}`)>
 *
 * Verify on the raw body before parsing, reject stale timestamps so a captured
 * delivery cannot be replayed, and deduplicate on `delivery.id` — it is stable
 * across the six delivery attempts.
 */

export const MEETINGS_SIGNATURE_HEADER = "x-meetings-signature";
export const MEETINGS_EVENT_HEADER = "x-meetings-event";
export const MEETINGS_DELIVERY_HEADER = "x-meetings-delivery";

/** Five minutes: generous for clock skew, short for replay. */
export const DEFAULT_TOLERANCE_SECONDS = 5 * 60;

export const meetingsWebhookEventValues = [
  "meeting.started",
  "meeting.ended",
  "participant.joined",
  "participant.left",
] as const;
export type MeetingsWebhookEvent = (typeof meetingsWebhookEventValues)[number];

export const meetingsWebhookMeetingSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  status: z.enum(["scheduled", "live", "ended"]),
  externalRef: z.string().nullable(),
  scheduledAt: z.string().nullable(),
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
});

export const meetingsDeliverySchema = z.object({
  id: z.string().min(1),
  event: z.enum(meetingsWebhookEventValues),
  createdAt: z.string(),
  data: z.looseObject({
    meeting: meetingsWebhookMeetingSchema,
    at: z.string().optional(),
    endedBy: z.enum(["host", "integration", "room"]).optional(),
    participant: z
      .object({
        identity: z.string(),
        name: z.string(),
        role: z.enum(["host", "participant"]),
      })
      .optional(),
  }),
});

export type MeetingsDelivery = z.infer<typeof meetingsDeliverySchema>;

export function computeMeetingsSignature(
  secret: string,
  timestamp: number,
  body: string,
): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

/** Produce a valid header — for tests and for simulating deliveries locally. */
export function signMeetingsWebhook(
  secret: string,
  body: string,
  timestamp = Math.floor(Date.now() / 1000),
): string {
  return `t=${timestamp},v1=${computeMeetingsSignature(secret, timestamp, body)}`;
}

export function parseMeetingsSignature(
  header: string | null | undefined,
): { timestamp: number; signature: string } | null {
  if (!header) return null;
  const parts = new Map(
    header.split(",").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, rest.join("=")] as const;
    }),
  );
  const timestamp = Number(parts.get("t"));
  const signature = parts.get("v1");
  if (!Number.isInteger(timestamp) || !signature) return null;
  return { timestamp, signature };
}

/** Constant-time check of a received delivery. `now` is injectable for tests. */
export function verifyMeetingsSignature({
  secret,
  header,
  body,
  toleranceSeconds = DEFAULT_TOLERANCE_SECONDS,
  now = Math.floor(Date.now() / 1000),
}: {
  secret: string;
  header: string | null | undefined;
  body: string;
  toleranceSeconds?: number;
  now?: number;
}): boolean {
  const parsed = parseMeetingsSignature(header);
  if (!parsed) return false;
  if (Math.abs(now - parsed.timestamp) > toleranceSeconds) return false;

  const expected = computeMeetingsSignature(secret, parsed.timestamp, body);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(parsed.signature, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export type MeetingsWebhookHandlerOptions = {
  /** `MEETINGS_WEBHOOK_SECRET`. When missing the endpoint answers 503 so Meetings keeps retrying rather than dropping events. */
  secret: string | undefined;
  /**
   * Called once per verified delivery. Keep it fast — enqueue to your job
   * queue and return; a slow handler is retried as if it had failed. Throwing
   * answers 500, which makes Meetings retry.
   */
  onDelivery: (delivery: MeetingsDelivery) => Promise<void> | void;
  toleranceSeconds?: number;
};

/**
 * A Next.js route handler (`export const POST = createMeetingsWebhookHandler(…)`)
 * that verifies, parses, hands off, and answers fast.
 */
export function createMeetingsWebhookHandler({
  secret,
  onDelivery,
  toleranceSeconds,
}: MeetingsWebhookHandlerOptions) {
  return async function POST(request: Request): Promise<Response> {
    if (!secret) {
      return Response.json(
        { error: "meetings webhook secret not configured" },
        { status: 503 },
      );
    }

    const body = await request.text();
    const header = request.headers.get(MEETINGS_SIGNATURE_HEADER);
    if (!verifyMeetingsSignature({ secret, header, body, toleranceSeconds })) {
      return Response.json({ error: "invalid signature" }, { status: 401 });
    }

    let json: unknown;
    try {
      json = JSON.parse(body);
    } catch {
      return Response.json({ error: "invalid json" }, { status: 400 });
    }
    const parsed = meetingsDeliverySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "invalid delivery" }, { status: 400 });
    }

    try {
      await onDelivery(parsed.data);
    } catch {
      return Response.json({ error: "handler failed" }, { status: 500 });
    }
    return Response.json({ ok: true });
  };
}
