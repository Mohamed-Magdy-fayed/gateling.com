import { describe, expect, it, vi } from "vitest";

import { createMeetingsClient, type Meeting } from "@/integrations/meetings";

import {
  bookingExternalRef,
  bookingMeetingLink,
  cancelBookingMeeting,
  provisionBookingMeeting,
  WEBSITE_MEETING_HOST_EXTERNAL_ID,
  websiteMeetingHost,
} from "./meeting";

/** Scripted Meetings API + a db double that records the one update we expect. */
function harness(responses: Array<{ status: number; json?: unknown }>) {
  const calls: Array<{ method: string; path: string; body?: unknown }> = [];
  const queue = [...responses];
  const client = createMeetingsClient({
    baseUrl: "https://meetings.test",
    apiKey: "gm_live_test",
    fetch: async (input, init) => {
      const next = queue.shift();
      if (!next) throw new Error("no scripted response");
      calls.push({
        method: init?.method ?? "GET",
        path: new URL(String(input)).pathname,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });
      return new Response(
        next.status === 204 ? null : JSON.stringify(next.json ?? {}),
        { status: next.status },
      );
    },
  });

  const set = vi.fn(() => ({ where: vi.fn(async () => undefined) }));
  const db = { update: vi.fn(() => ({ set })) };
  return { client, calls, db, set };
}

const meeting: Meeting = {
  id: "m1",
  code: "abc-defg-hij",
  title: "Call with Sara",
  status: "scheduled",
  externalRef: "booking:b1",
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

const booking = {
  id: "b1",
  name: "Sara",
  startsAt: new Date("2026-10-01T10:00:00.000Z"),
  meetingCode: null,
  meetingGuestUrl: null,
};
const settings = { slotMinutes: 30, timezone: "Africa/Cairo" };
const host = websiteMeetingHost("info@gateling.com");

describe("websiteMeetingHost", () => {
  it("is one fixed identity so any staff member can mint a host link", () => {
    expect(host.externalId).toBe(WEBSITE_MEETING_HOST_EXTERNAL_ID);
    expect(host.email).toBe("info@gateling.com");
  });
});

describe("bookingMeetingLink", () => {
  it("prefers the provisioned room and falls back to the static setting", () => {
    expect(
      bookingMeetingLink(
        { meetingGuestUrl: "https://m/x" },
        { meetingLink: "https://static" },
      ),
    ).toBe("https://m/x");
    expect(
      bookingMeetingLink(
        { meetingGuestUrl: null },
        { meetingLink: "https://static" },
      ),
    ).toBe("https://static");
    expect(
      bookingMeetingLink({ meetingGuestUrl: null }, { meetingLink: null }),
    ).toBeNull();
  });
});

describe("provisionBookingMeeting", () => {
  it("creates the room with the booking's slot and persists code + guest url", async () => {
    const { client, calls, db, set } = harness([
      { status: 201, json: { meeting } },
    ]);

    const result = await provisionBookingMeeting(
      db as never,
      client,
      booking,
      settings,
      host,
    );

    expect(result).toEqual({
      code: "abc-defg-hij",
      guestUrl: "https://meetings.test/m/abc-defg-hij",
      action: "created",
    });
    expect(calls[0]?.body).toMatchObject({
      title: "Call with Sara",
      externalRef: bookingExternalRef("b1"),
      scheduledAt: "2026-10-01T10:00:00.000Z",
      durationMinutes: 30,
      timezone: "Africa/Cairo",
      host: { externalId: WEBSITE_MEETING_HOST_EXTERNAL_ID },
      settings: { waitingRoom: true, allowGuests: true },
    });
    expect(calls[0]?.body).not.toHaveProperty("invitees");
    expect(set).toHaveBeenCalledWith({
      meetingCode: "abc-defg-hij",
      meetingGuestUrl: "https://meetings.test/m/abc-defg-hij",
    });
  });

  it("moves an existing room on reschedule and does not rewrite unchanged columns", async () => {
    const { client, calls, db, set } = harness([
      { status: 200, json: { meeting } },
    ]);

    const result = await provisionBookingMeeting(
      db as never,
      client,
      {
        ...booking,
        startsAt: new Date("2026-10-02T10:00:00.000Z"),
        meetingCode: "abc-defg-hij",
        meetingGuestUrl: "https://meetings.test/m/abc-defg-hij",
      },
      settings,
      host,
    );

    expect(result.action).toBe("rescheduled");
    expect(calls[0]?.method).toBe("PATCH");
    expect(calls[0]?.body).toMatchObject({
      scheduledAt: "2026-10-02T10:00:00.000Z",
    });
    expect(set).not.toHaveBeenCalled();
  });
});

describe("cancelBookingMeeting", () => {
  it("is a no-op without a room and tolerates an already-deleted one", async () => {
    const { client, calls } = harness([
      { status: 404, json: { error: { code: "not_found", message: "" } } },
    ]);

    expect(await cancelBookingMeeting(client, { meetingCode: null })).toBe(
      false,
    );
    expect(calls).toHaveLength(0);
    expect(await cancelBookingMeeting(client, { meetingCode: "gone" })).toBe(
      false,
    );
    expect(calls[0]?.method).toBe("DELETE");
  });
});
