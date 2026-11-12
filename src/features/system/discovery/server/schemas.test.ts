import { describe, expect, it } from "vitest";
import { z } from "zod";

import * as schemas from "./schemas";

/**
 * These schemas double as MCP tool input schemas, which the SDK publishes as
 * JSON Schema on `tools/list`. A type JSON Schema cannot express (e.g. a Zod
 * Date) breaks the whole tool list, so every exported schema must convert.
 */
describe("discovery schemas", () => {
  it("all convert to JSON Schema (MCP tools/list)", () => {
    const failures: string[] = [];
    for (const [name, value] of Object.entries(schemas)) {
      if (!(value instanceof z.ZodType)) continue;
      try {
        z.toJSONSchema(value, { io: "input" });
      } catch (error) {
        failures.push(`${name}: ${(error as Error).message}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("a touchpoint needs exactly one of contactId or newContact", () => {
    const base = {
      studyId: "00000000-0000-4000-8000-000000000001",
      channel: "facebook",
    };
    expect(schemas.logTouchpointSchema.safeParse(base).success).toBe(false);
    expect(
      schemas.logTouchpointSchema.safeParse({
        ...base,
        newContact: { displayName: "Shop" },
      }).success,
    ).toBe(true);
  });

  it("refuses non-http links", () => {
    expect(
      schemas.logTouchpointSchema.safeParse({
        studyId: "00000000-0000-4000-8000-000000000001",
        channel: "facebook",
        newContact: { displayName: "Shop" },
        url: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });
});
