import crypto from "node:crypto";

/**
 * Receiving side of Meta webhooks (WhatsApp Cloud API, Messenger, Instagram).
 *
 * GET  — subscription handshake: Meta sends `hub.mode=subscribe`,
 *        `hub.verify_token` and `hub.challenge`; we echo the challenge only
 *        when the token matches ours.
 * POST — event delivery, signed with the app secret:
 *        X-Hub-Signature-256: sha256=<hex hmac-sha256(appSecret, rawBody)>
 *
 * Meta's signature has no timestamp, so replay is handled by deduplicating on
 * a hash of the raw body (retries resend identical bytes).
 */

export const META_SIGNATURE_HEADER = "x-hub-signature-256";

/**
 * Normal deliveries are a few KB; history sync batches are larger. Stays under
 * Vercel's 4.5 MB request cap so an oversized body gets a clean 413.
 */
export const MAX_META_WEBHOOK_BODY_BYTES = 4 * 1024 * 1024;

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

export function computeMetaSignature(appSecret: string, body: string): string {
  return crypto.createHmac("sha256", appSecret).update(body).digest("hex");
}

/** Produce a valid header — for tests and for simulating deliveries locally. */
export function signMetaWebhook(appSecret: string, body: string): string {
  return `sha256=${computeMetaSignature(appSecret, body)}`;
}

/** Constant-time check of the `X-Hub-Signature-256` header against the raw body. */
export function verifyMetaSignature({
  appSecret,
  header,
  body,
}: {
  appSecret: string;
  header: string | null | undefined;
  body: string;
}): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const received = header.slice("sha256=".length);
  if (!/^[0-9a-f]{64}$/i.test(received)) return false;
  return safeEqual(
    computeMetaSignature(appSecret, body),
    received.toLowerCase(),
  );
}

/** The SQLSTATE of a (possibly drizzle-wrapped) Postgres error — safe to log. */
function postgresErrorCode(error: unknown): string | undefined {
  const candidates = [error, error instanceof Error ? error.cause : undefined];
  for (const candidate of candidates) {
    if (
      typeof candidate === "object" &&
      candidate !== null &&
      "code" in candidate &&
      typeof candidate.code === "string"
    ) {
      return candidate.code;
    }
  }
  return undefined;
}

export function hashMetaPayload(body: string): string {
  return crypto.createHash("sha256").update(body).digest("hex");
}

/**
 * Answer Meta's subscription handshake. Returns the challenge as plain text on
 * a match, 403 otherwise, 503 when no token is configured.
 */
export function handleMetaVerification(
  url: URL,
  verifyToken: string | undefined,
): Response {
  if (!verifyToken) return new Response(null, { status: 503 });

  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    return new Response(null, { status: 403 });
  }
  if (!safeEqual(token, verifyToken)) {
    return new Response(null, { status: 403 });
  }
  // Echo only what Meta sends (digits); never reflect arbitrary input.
  if (!/^[0-9A-Za-z_-]{1,128}$/.test(challenge)) {
    return new Response(null, { status: 403 });
  }
  return new Response(challenge, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export type MetaDelivery = {
  /** `whatsapp_business_account`, `page`, `instagram`, … */
  object: string | null;
  payload: unknown;
  payloadHash: string;
};

export type MetaWebhookHandlerOptions = {
  /** `META_APP_SECRET`. Missing → 503 so Meta keeps retrying rather than dropping events. */
  appSecret: string | undefined;
  /**
   * Called once per verified delivery. Keep it fast — persist and return.
   * Throwing answers 500, which makes Meta retry.
   */
  onDelivery: (delivery: MetaDelivery) => Promise<void> | void;
};

/** A Next.js POST route handler that verifies, hands off, and answers fast. */
export function createMetaWebhookHandler({
  appSecret,
  onDelivery,
}: MetaWebhookHandlerOptions) {
  return async function POST(request: Request): Promise<Response> {
    if (!appSecret) return new Response(null, { status: 503 });

    const declared = Number(request.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_META_WEBHOOK_BODY_BYTES) {
      return new Response(null, { status: 413 });
    }

    const body = await request.text();
    if (Buffer.byteLength(body) > MAX_META_WEBHOOK_BODY_BYTES) {
      return new Response(null, { status: 413 });
    }

    const header = request.headers.get(META_SIGNATURE_HEADER);
    if (!verifyMetaSignature({ appSecret, header, body })) {
      // Without this a wrong META_APP_SECRET is invisible: Meta's deliveries
      // just vanish. Shape only — never the body (customer PII).
      console.warn("[meta-webhook] rejected: invalid signature", {
        hasSignature: Boolean(header),
        bytes: Buffer.byteLength(body),
        userAgent: request.headers.get("user-agent")?.slice(0, 80) ?? null,
      });
      return new Response(null, { status: 401 });
    }

    let payload: unknown;
    try {
      // Postgres jsonb rejects the NUL escape, and message text is
      // customer-controlled: without this one message would fail (500) on
      // every retry. Done after the signature check; the hash stays on the
      // raw body, so retries still dedupe.
      payload = JSON.parse(body.replaceAll("\\u0000", "\\uFFFD"));
    } catch {
      return new Response(null, { status: 400 });
    }
    if (typeof payload !== "object" || payload === null) {
      return new Response(null, { status: 400 });
    }

    const object =
      "object" in payload && typeof payload.object === "string"
        ? payload.object.slice(0, 64)
        : null;

    const payloadHash = hashMetaPayload(body);
    try {
      await onDelivery({ object, payload, payloadHash });
    } catch (error) {
      // Never log `error` itself: drizzle's query errors embed the bound
      // params — the whole payload, i.e. customer phone numbers and text.
      console.error("[meta-webhook] failed to store delivery", {
        payloadHash,
        code: postgresErrorCode(error),
      });
      return new Response(null, { status: 500 });
    }
    return new Response(null, { status: 200 });
  };
}
