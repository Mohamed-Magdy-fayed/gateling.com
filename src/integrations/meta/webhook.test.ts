import { describe, expect, it, vi } from "vitest";

import {
  createMetaWebhookHandler,
  handleMetaVerification,
  hashMetaPayload,
  MAX_META_WEBHOOK_BODY_BYTES,
  META_SIGNATURE_HEADER,
  signMetaWebhook,
  verifyMetaSignature,
} from "./webhook";

const APP_SECRET = "meta_app_secret_test";
const VERIFY_TOKEN = "verify-token-at-least-16";

const body = JSON.stringify({
  object: "whatsapp_business_account",
  entry: [
    {
      id: "123",
      changes: [
        {
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            messages: [
              {
                from: "201000000000",
                id: "wamid.TEST",
                timestamp: "1762400000",
                type: "text",
                text: { body: "Hello" },
              },
            ],
          },
        },
      ],
    },
  ],
});

function post(payload: string, headers: Record<string, string> = {}): Request {
  return new Request("https://gateling.com/api/webhooks/meta", {
    method: "POST",
    body: payload,
    headers: { "content-type": "application/json", ...headers },
  });
}

function verifyUrl(params: Record<string, string>): URL {
  const url = new URL("https://gateling.com/api/webhooks/meta");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

describe("verifyMetaSignature", () => {
  it("accepts a signature made with the app secret", () => {
    const header = signMetaWebhook(APP_SECRET, body);
    expect(verifyMetaSignature({ appSecret: APP_SECRET, header, body })).toBe(
      true,
    );
  });

  it("accepts an uppercase hex digest", () => {
    const header = signMetaWebhook(APP_SECRET, body)
      .toUpperCase()
      .replace("SHA256=", "sha256=");
    expect(verifyMetaSignature({ appSecret: APP_SECRET, header, body })).toBe(
      true,
    );
  });

  it("rejects a signature made with another secret", () => {
    const header = signMetaWebhook("other_secret", body);
    expect(verifyMetaSignature({ appSecret: APP_SECRET, header, body })).toBe(
      false,
    );
  });

  it("rejects a tampered body", () => {
    const header = signMetaWebhook(APP_SECRET, body);
    expect(
      verifyMetaSignature({
        appSecret: APP_SECRET,
        header,
        body: body.replace("Hello", "Hacked"),
      }),
    ).toBe(false);
  });

  it.each([
    null,
    undefined,
    "",
    "sha1=abc",
    "sha256=",
    "sha256=not-hex",
    `sha256=${"a".repeat(63)}`,
  ])("rejects a malformed header (%s)", (header) => {
    expect(verifyMetaSignature({ appSecret: APP_SECRET, header, body })).toBe(
      false,
    );
  });
});

describe("handleMetaVerification", () => {
  it("echoes the challenge when the token matches", async () => {
    const response = handleMetaVerification(
      verifyUrl({
        "hub.mode": "subscribe",
        "hub.verify_token": VERIFY_TOKEN,
        "hub.challenge": "1158201444",
      }),
      VERIFY_TOKEN,
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("1158201444");
  });

  it("refuses a wrong token", () => {
    const response = handleMetaVerification(
      verifyUrl({
        "hub.mode": "subscribe",
        "hub.verify_token": "wrong-token-wrong-token",
        "hub.challenge": "1158201444",
      }),
      VERIFY_TOKEN,
    );
    expect(response.status).toBe(403);
  });

  it("refuses a mode other than subscribe", () => {
    const response = handleMetaVerification(
      verifyUrl({
        "hub.mode": "unsubscribe",
        "hub.verify_token": VERIFY_TOKEN,
        "hub.challenge": "1158201444",
      }),
      VERIFY_TOKEN,
    );
    expect(response.status).toBe(403);
  });

  it("refuses a challenge that is not a plain token (no reflected markup)", () => {
    const response = handleMetaVerification(
      verifyUrl({
        "hub.mode": "subscribe",
        "hub.verify_token": VERIFY_TOKEN,
        "hub.challenge": "<script>alert(1)</script>",
      }),
      VERIFY_TOKEN,
    );
    expect(response.status).toBe(403);
  });

  it("answers 503 when no verify token is configured", () => {
    const response = handleMetaVerification(
      verifyUrl({
        "hub.mode": "subscribe",
        "hub.verify_token": VERIFY_TOKEN,
        "hub.challenge": "1158201444",
      }),
      undefined,
    );
    expect(response.status).toBe(503);
  });
});

describe("createMetaWebhookHandler", () => {
  it("hands a verified delivery over with its object and body hash", async () => {
    const onDelivery = vi.fn();
    const handler = createMetaWebhookHandler({
      appSecret: APP_SECRET,
      onDelivery,
    });

    const response = await handler(
      post(body, {
        [META_SIGNATURE_HEADER]: signMetaWebhook(APP_SECRET, body),
      }),
    );

    expect(response.status).toBe(200);
    expect(onDelivery).toHaveBeenCalledOnce();
    expect(onDelivery).toHaveBeenCalledWith({
      object: "whatsapp_business_account",
      payload: JSON.parse(body),
      payloadHash: hashMetaPayload(body),
    });
  });

  it("gives identical retries the same hash, so storage can dedupe them", () => {
    expect(hashMetaPayload(body)).toBe(hashMetaPayload(body));
    expect(hashMetaPayload(body)).not.toBe(hashMetaPayload(`${body} `));
  });

  it("answers 401 and stores nothing for an unsigned request", async () => {
    const onDelivery = vi.fn();
    const handler = createMetaWebhookHandler({
      appSecret: APP_SECRET,
      onDelivery,
    });

    const response = await handler(post(body));

    expect(response.status).toBe(401);
    expect(onDelivery).not.toHaveBeenCalled();
  });

  it("answers 401 for a wrongly signed request", async () => {
    const onDelivery = vi.fn();
    const handler = createMetaWebhookHandler({
      appSecret: APP_SECRET,
      onDelivery,
    });

    const response = await handler(
      post(body, {
        [META_SIGNATURE_HEADER]: signMetaWebhook("other_secret", body),
      }),
    );

    expect(response.status).toBe(401);
    expect(onDelivery).not.toHaveBeenCalled();
  });

  it("answers 503 when the app secret is not configured", async () => {
    const onDelivery = vi.fn();
    const handler = createMetaWebhookHandler({
      appSecret: undefined,
      onDelivery,
    });

    const response = await handler(
      post(body, {
        [META_SIGNATURE_HEADER]: signMetaWebhook(APP_SECRET, body),
      }),
    );

    expect(response.status).toBe(503);
    expect(onDelivery).not.toHaveBeenCalled();
  });

  it("answers 413 for an oversized body", async () => {
    const onDelivery = vi.fn();
    const handler = createMetaWebhookHandler({
      appSecret: APP_SECRET,
      onDelivery,
    });
    const huge = "x".repeat(MAX_META_WEBHOOK_BODY_BYTES + 1);

    const response = await handler(
      post(huge, {
        [META_SIGNATURE_HEADER]: signMetaWebhook(APP_SECRET, huge),
      }),
    );

    expect(response.status).toBe(413);
    expect(onDelivery).not.toHaveBeenCalled();
  });

  it.each(["not json", "42", "null"])(
    "answers 400 for a signed body that is not a JSON object (%s)",
    async (payload) => {
      const onDelivery = vi.fn();
      const handler = createMetaWebhookHandler({
        appSecret: APP_SECRET,
        onDelivery,
      });

      const response = await handler(
        post(payload, {
          [META_SIGNATURE_HEADER]: signMetaWebhook(APP_SECRET, payload),
        }),
      );

      expect(response.status).toBe(400);
      expect(onDelivery).not.toHaveBeenCalled();
    },
  );

  it("answers 500 when storing fails, so Meta retries", async () => {
    const handler = createMetaWebhookHandler({
      appSecret: APP_SECRET,
      onDelivery: () => {
        throw new Error("db down");
      },
    });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await handler(
      post(body, {
        [META_SIGNATURE_HEADER]: signMetaWebhook(APP_SECRET, body),
      }),
    );

    expect(response.status).toBe(500);
    spy.mockRestore();
  });

  it("never logs the payload when storing fails", async () => {
    // Shaped like drizzle's DrizzleQueryError: params (the payload) in the message.
    const dbError = new Error(`Failed query: insert ... params: ${body}`, {
      cause: Object.assign(new Error("boom"), { code: "22P05" }),
    });
    const handler = createMetaWebhookHandler({
      appSecret: APP_SECRET,
      onDelivery: () => {
        throw dbError;
      },
    });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await handler(
      post(body, {
        [META_SIGNATURE_HEADER]: signMetaWebhook(APP_SECRET, body),
      }),
    );

    const logged = JSON.stringify(spy.mock.calls);
    expect(logged).not.toContain("201000000000");
    expect(logged).not.toContain("Hello");
    expect(logged).toContain("22P05");
    spy.mockRestore();
  });

  it("replaces NUL escapes Postgres jsonb rejects, keeping the raw-body hash", async () => {
    const withNul = JSON.stringify({ object: "page", text: "a\u0000b" });
    expect(withNul).toContain("\\u0000");
    const onDelivery = vi.fn();
    const handler = createMetaWebhookHandler({
      appSecret: APP_SECRET,
      onDelivery,
    });

    const response = await handler(
      post(withNul, {
        [META_SIGNATURE_HEADER]: signMetaWebhook(APP_SECRET, withNul),
      }),
    );

    expect(response.status).toBe(200);
    expect(onDelivery).toHaveBeenCalledWith({
      object: "page",
      payload: { object: "page", text: "a�b" },
      payloadHash: hashMetaPayload(withNul),
    });
  });
});
