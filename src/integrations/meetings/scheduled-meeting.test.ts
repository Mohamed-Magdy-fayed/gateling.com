import { describe, expect, it } from "vitest";

import { createMeetingsClient, type Meeting } from "./client";
import {
  cancelScheduledMeeting,
  ensureScheduledMeeting,
  mintHostJoinLink,
  scheduledMeetingIdempotencyKey,
} from "./scheduled-meeting";

type Recorded = {
  method: string;
  path: string;
  headers: Headers;
  body: unknown;
};

/** A fake Meetings API: scripted responses per call, every request recorded. */
function fakeApi(responses: Array<{ status: number; json?: unknown }>) {
  const calls: Recorded[] = [];
  const queue = [...responses];
  const fetchImpl: typeof fetch = async (input, init) => {
    const next = queue.shift();
    if (!next) throw new Error("fake api: no scripted response left");
    calls.push({
      method: init?.method ?? "GET",
      path: new URL(String(input)).pathname,
      headers: new Headers(init?.headers),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    return new Response(
      next.status === 204 ? null : JSON.stringify(next.json ?? {}),
      { status: next.status, headers: { "content-type": "application/json" } },
    );
  };
  const client = createMeetingsClient({
    baseUrl: "https://meetings.test/",
    apiKey: "gm_live_test",
    fetch: fetchImpl,
  });
  return { client, calls };
}

const meeting: Meeting = {
  id: "m1",
  code: "abc-defg-hij",
  title: "Call",
  status: "scheduled",
  externalRef: "booking:1",
  scheduledAt: "2026-10-01T10:00:00.000Z",
  durationMinutes: 30,
  timezone: "Africa/Cairo",
  startedAt: null,
  endedAt: null,
  settings: {
    waitingRoom: true,
    muteOnEntry: false,
    allowGuests: true,
    allowScreenShare: true,
    locked: false,
  },
  hasPasscode: false,
  guestUrl: "https://meetings.test/m/abc-defg-hij",
  createdAt: "2026-09-12T00:00:00.000Z",
};

const scheduledAt = new Date("2026-10-01T10:00:00.000Z");
const base = {
  externalRef: "booking:1",
  title: "Call",
  host: { externalId: "site", name: "Site" },
  scheduledAt,
  durationMinutes: 30,
  timezone: "Africa/Cairo",
};

describe("scheduledMeetingIdempotencyKey", () => {
  it("binds the entity to the exact time", () => {
    expect(scheduledMeetingIdempotencyKey("booking:1", scheduledAt)).toBe(
      "booking:1:2026-10-01T10:00:00.000Z",
    );
  });
});

describe("ensureScheduledMeeting", () => {
  it("creates with an idempotency key when there is no existing code", async () => {
    const { client, calls } = fakeApi([{ status: 201, json: { meeting } }]);

    const result = await ensureScheduledMeeting(client, base);

    expect(result.action).toBe("created");
    expect(result.meeting.code).toBe("abc-defg-hij");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.method).toBe("POST");
    expect(calls[0]?.path).toBe("/api/v1/meetings");
    expect(calls[0]?.headers.get("idempotency-key")).toBe(
      "booking:1:2026-10-01T10:00:00.000Z",
    );
    expect(calls[0]?.headers.get("authorization")).toBe("Bearer gm_live_test");
    expect(calls[0]?.body).toMatchObject({
      externalRef: "booking:1",
      scheduledAt: "2026-10-01T10:00:00.000Z",
      host: { externalId: "site" },
    });
  });

  it("PATCHes the existing meeting instead of creating a second one", async () => {
    const { client, calls } = fakeApi([{ status: 200, json: { meeting } }]);

    const result = await ensureScheduledMeeting(client, {
      ...base,
      existingCode: "abc-defg-hij",
    });

    expect(result.action).toBe("rescheduled");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.method).toBe("PATCH");
    expect(calls[0]?.path).toBe("/api/v1/meetings/abc-defg-hij");
    expect(calls[0]?.body).toEqual({
      title: "Call",
      scheduledAt: "2026-10-01T10:00:00.000Z",
      durationMinutes: 30,
      timezone: "Africa/Cairo",
    });
  });

  it("falls through to create when the stored code no longer resolves", async () => {
    const { client, calls } = fakeApi([
      { status: 404, json: { error: { code: "not_found", message: "gone" } } },
      { status: 201, json: { meeting } },
    ]);

    const result = await ensureScheduledMeeting(client, {
      ...base,
      existingCode: "old-code",
    });

    expect(result.action).toBe("created");
    expect(calls.map((c) => c.method)).toEqual(["PATCH", "POST"]);
  });

  it("falls through to create when the old meeting has ended", async () => {
    const { client, calls } = fakeApi([
      {
        status: 412,
        json: { error: { code: "precondition_failed", message: "ended" } },
      },
      { status: 201, json: { meeting } },
    ]);

    await ensureScheduledMeeting(client, { ...base, existingCode: "old" });

    expect(calls.map((c) => c.method)).toEqual(["PATCH", "POST"]);
  });

  it("propagates other API errors from the PATCH", async () => {
    const { client } = fakeApi([
      { status: 401, json: { error: { code: "unauthorized", message: "no" } } },
    ]);

    await expect(
      ensureScheduledMeeting(client, { ...base, existingCode: "x" }),
    ).rejects.toMatchObject({ status: 401, code: "unauthorized" });
  });
});

describe("response validation", () => {
  it("refuses a guest url that is not https", async () => {
    const { client } = fakeApi([
      {
        status: 201,
        json: { meeting: { ...meeting, guestUrl: "javascript:alert(1)" } },
      },
    ]);

    await expect(ensureScheduledMeeting(client, base)).rejects.toMatchObject({
      status: 502,
      code: "invalid_response",
    });
  });

  it("refuses a join link that is not https", async () => {
    const { client } = fakeApi([
      {
        status: 201,
        json: {
          joinLink: {
            url: "http://evil.test/",
            role: "host",
            expiresAt: "x",
            singleUse: true,
          },
        },
      },
    ]);

    await expect(
      mintHostJoinLink(client, "abc", { externalId: "site", name: "Site" }),
    ).rejects.toMatchObject({ code: "invalid_response" });
  });
});

describe("cancelScheduledMeeting", () => {
  it("returns true on delete and false when already gone", async () => {
    const { client } = fakeApi([
      { status: 204 },
      { status: 404, json: { error: { code: "not_found", message: "gone" } } },
    ]);

    expect(await cancelScheduledMeeting(client, "a")).toBe(true);
    expect(await cancelScheduledMeeting(client, "a")).toBe(false);
  });
});

describe("mintHostJoinLink", () => {
  it("requests a host-role link for the given identity", async () => {
    const { client, calls } = fakeApi([
      {
        status: 201,
        json: {
          joinLink: {
            url: "https://meetings.test/sso/join?token=t",
            role: "host",
            expiresAt: "x",
            singleUse: true,
          },
        },
      },
    ]);

    const link = await mintHostJoinLink(
      client,
      "abc",
      { externalId: "site", name: "Site" },
      { returnUrl: "https://app.test/bookings" },
    );

    expect(link.url).toContain("/sso/join");
    expect(calls[0]?.path).toBe("/api/v1/meetings/abc/join-links");
    expect(calls[0]?.body).toEqual({
      user: { externalId: "site", name: "Site" },
      role: "host",
      returnUrl: "https://app.test/bookings",
    });
  });
});
