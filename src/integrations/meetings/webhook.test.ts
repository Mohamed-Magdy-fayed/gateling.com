import { describe, expect, it, vi } from "vitest";

import {
  createMeetingsWebhookHandler,
  MEETINGS_SIGNATURE_HEADER,
  signMeetingsWebhook,
  verifyMeetingsSignature,
} from "./webhook";

const SECRET = "whsec_test";
const NOW = 1_800_000_000;

const delivery = {
  id: "59c6c396-adfc-4d99-8ba4-d941b46998ed",
  event: "meeting.ended",
  createdAt: "2026-09-12T07:23:22.306Z",
  data: {
    meeting: {
      id: "m1",
      code: "dsf-wxgm-kqk",
      title: "Call",
      status: "ended",
      externalRef: "booking:1",
      scheduledAt: "2026-09-12T10:00:00.000Z",
      startedAt: "2026-09-12T07:19:43.285Z",
      endedAt: "2026-09-12T07:23:22.000Z",
    },
    endedBy: "host",
  },
};
const body = JSON.stringify(delivery);

describe("verifyMeetingsSignature", () => {
  it("accepts a fresh, correctly signed body", () => {
    const header = signMeetingsWebhook(SECRET, body, NOW);
    expect(
      verifyMeetingsSignature({ secret: SECRET, header, body, now: NOW + 30 }),
    ).toBe(true);
  });

  it("rejects a tampered body", () => {
    const header = signMeetingsWebhook(SECRET, body, NOW);
    expect(
      verifyMeetingsSignature({
        secret: SECRET,
        header,
        body: body.replace("booking:1", "booking:2"),
        now: NOW,
      }),
    ).toBe(false);
  });

  it("rejects the wrong secret", () => {
    const header = signMeetingsWebhook("other", body, NOW);
    expect(
      verifyMeetingsSignature({ secret: SECRET, header, body, now: NOW }),
    ).toBe(false);
  });

  it("rejects a stale timestamp (replay)", () => {
    const header = signMeetingsWebhook(SECRET, body, NOW);
    expect(
      verifyMeetingsSignature({
        secret: SECRET,
        header,
        body,
        now: NOW + 10 * 60,
      }),
    ).toBe(false);
  });

  it("rejects missing or malformed headers", () => {
    expect(
      verifyMeetingsSignature({ secret: SECRET, header: null, body }),
    ).toBe(false);
    expect(
      verifyMeetingsSignature({ secret: SECRET, header: "t=abc,v1=", body }),
    ).toBe(false);
  });
});

describe("createMeetingsWebhookHandler", () => {
  function post(headers: Record<string, string>, rawBody = body) {
    return new Request("https://app.test/api/meetings-webhook", {
      method: "POST",
      headers,
      body: rawBody,
    });
  }

  it("verifies, parses, hands off and answers 200", async () => {
    const onDelivery = vi.fn();
    const handler = createMeetingsWebhookHandler({
      secret: SECRET,
      onDelivery,
    });

    const response = await handler(
      post({ [MEETINGS_SIGNATURE_HEADER]: signMeetingsWebhook(SECRET, body) }),
    );

    expect(response.status).toBe(200);
    expect(onDelivery).toHaveBeenCalledTimes(1);
    expect(onDelivery.mock.calls[0]?.[0]).toMatchObject({
      id: delivery.id,
      event: "meeting.ended",
      data: { meeting: { code: "dsf-wxgm-kqk" }, endedBy: "host" },
    });
  });

  it("answers 401 on a bad signature without calling the handler", async () => {
    const onDelivery = vi.fn();
    const handler = createMeetingsWebhookHandler({
      secret: SECRET,
      onDelivery,
    });

    const response = await handler(
      post({ [MEETINGS_SIGNATURE_HEADER]: signMeetingsWebhook("nope", body) }),
    );

    expect(response.status).toBe(401);
    expect(onDelivery).not.toHaveBeenCalled();
  });

  it("answers 400 on a signed but malformed delivery", async () => {
    const onDelivery = vi.fn();
    const handler = createMeetingsWebhookHandler({
      secret: SECRET,
      onDelivery,
    });
    const bad = JSON.stringify({ id: "x", event: "unknown.event" });

    const response = await handler(
      post(
        { [MEETINGS_SIGNATURE_HEADER]: signMeetingsWebhook(SECRET, bad) },
        bad,
      ),
    );

    expect(response.status).toBe(400);
    expect(onDelivery).not.toHaveBeenCalled();
  });

  it("answers 500 when the handler throws so Meetings retries", async () => {
    const handler = createMeetingsWebhookHandler({
      secret: SECRET,
      onDelivery: async () => {
        throw new Error("queue down");
      },
    });

    const response = await handler(
      post({ [MEETINGS_SIGNATURE_HEADER]: signMeetingsWebhook(SECRET, body) }),
    );

    expect(response.status).toBe(500);
  });

  it("answers 503 when no secret is configured", async () => {
    const handler = createMeetingsWebhookHandler({
      secret: undefined,
      onDelivery: vi.fn(),
    });

    const response = await handler(post({}));

    expect(response.status).toBe(503);
  });
});
