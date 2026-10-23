import { describe, expect, it, vi } from "vitest";

vi.mock("@/drizzle", () => ({ db: {} }));
vi.mock("@/integrations/email", () => ({ sendMail: vi.fn() }));

import { functions } from "./index";

function triggerEvents(): string[] {
  return functions.flatMap((fn) =>
    (fn.opts.triggers ?? []).flatMap((trigger) =>
      "event" in trigger && typeof trigger.event === "string"
        ? [trigger.event]
        : [],
    ),
  );
}

describe("registered Inngest functions", () => {
  // Inngest routes an event to every app in the environment, not just the
  // sender's. Gateling Meetings and Gateling TMS send `user/registered` as
  // `{ userId }` from their own sign-ups; a gateling.com function listening on
  // that name fails schema validation on every one of them, and would look up
  // a foreign user id in this app's database if it didn't.
  it("does not subscribe to user/registered, which only sibling apps send", () => {
    expect(triggerEvents()).not.toContain("user/registered");
  });
});
