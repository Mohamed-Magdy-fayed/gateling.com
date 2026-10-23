import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import { SalesError, toTRPCError } from "./errors";

describe("toTRPCError", () => {
  it("maps a non-prospect lead to NOT_FOUND, keeping the code and lead id", () => {
    const mapped = toTRPCError(new SalesError("SALES_LEAD_NOT_PROSPECT", "L1"));
    expect(mapped).toBeInstanceOf(TRPCError);
    expect((mapped as TRPCError).code).toBe("NOT_FOUND");
    expect((mapped as TRPCError).message).toContain("L1");
    expect((mapped as TRPCError).cause).toMatchObject({
      appCode: "SALES_LEAD_NOT_PROSPECT",
      leadId: "L1",
    });
  });

  it("maps outreach to a do-not-contact lead to PRECONDITION_FAILED", () => {
    const mapped = toTRPCError(new SalesError("SALES_DO_NOT_CONTACT", "L2"));
    expect((mapped as TRPCError).code).toBe("PRECONDITION_FAILED");
  });

  it("passes other errors through unchanged", () => {
    const original = new Error("boom");
    expect(toTRPCError(original)).toBe(original);
  });
});
