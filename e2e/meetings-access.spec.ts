import { expect, test } from "@playwright/test";

/**
 * The Meetings integration mints host links (which land someone in a room
 * with full host controls) and accepts inbound webhooks. Both must be closed
 * to the public at the transport level — a hidden button is not authorisation.
 */

const NIL_ID = "00000000-0000-0000-0000-000000000000";

const HOST_LINK_PROCEDURES = [
  "bookings.hostJoinLink",
  "sales.demoHostJoinLink",
];

for (const procedure of HOST_LINK_PROCEDURES) {
  test(`signed out, ${procedure} is refused`, async ({ request }) => {
    const response = await request.post(`/api/trpc/${procedure}`, {
      data: { json: { id: NIL_ID } },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error?.json?.data?.code).toBe("UNAUTHORIZED");
  });
}

test("an unsigned webhook delivery is never processed", async ({ request }) => {
  const response = await request.post("/api/meetings-webhook", {
    headers: { "content-type": "application/json" },
    data: {
      id: NIL_ID,
      event: "meeting.ended",
      createdAt: new Date().toISOString(),
      data: {
        meeting: {
          id: NIL_ID,
          code: "aaa-bbbb-ccc",
          title: "x",
          status: "ended",
          externalRef: `booking:${NIL_ID}`,
          scheduledAt: null,
          startedAt: null,
          endedAt: null,
        },
        endedBy: "host",
      },
    },
  });
  // 401 when a secret is configured (bad signature), 503 when it is not — in
  // neither case may the body reach the handler.
  expect([401, 503]).toContain(response.status());
});

test("the webhook endpoint only answers POST", async ({ request }) => {
  const response = await request.get("/api/meetings-webhook");
  expect(response.status()).toBe(405);
});
