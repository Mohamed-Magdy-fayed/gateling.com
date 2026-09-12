import { describe, expect, it } from "vitest";

import { isCurrentDemoActivity, leadDemoExternalRef } from "./meeting";

describe("leadDemoExternalRef", () => {
  it("is one ref per lead so a later demo moves the same room", () => {
    expect(leadDemoExternalRef("abc")).toBe("lead:abc:demo");
  });
});

describe("isCurrentDemoActivity", () => {
  it("lets only the latest demo_scheduled activity own the room's time", () => {
    expect(isCurrentDemoActivity("a2", "a2")).toBe(true);
    // A retried run for the earlier log must stand down.
    expect(isCurrentDemoActivity("a1", "a2")).toBe(false);
    expect(isCurrentDemoActivity("a1", null)).toBe(false);
    expect(isCurrentDemoActivity("a1", undefined)).toBe(false);
  });
});
