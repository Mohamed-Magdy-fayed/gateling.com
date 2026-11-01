import { describe, expect, it } from "vitest";

import { rolesPermissions } from "@/features/core/auth/core/permissions";

import { assertAdmin, assertSalesStaff, leadFieldViolation } from "./access";

describe("sales access", () => {
  it("lets admins and operators work the pipeline", () => {
    expect(() => assertSalesStaff("admin")).not.toThrow();
    expect(() => assertSalesStaff("employee")).not.toThrow();
  });

  it("refuses customers and anonymous callers", () => {
    expect(() => assertSalesStaff("customer")).toThrow();
    expect(() => assertSalesStaff(undefined)).toThrow();
  });

  it("keeps export and bulk actions admin-only", () => {
    expect(() => assertAdmin("admin")).not.toThrow();
    expect(() => assertAdmin("employee")).toThrow();
  });

  it("opens the sales screen to employees", () => {
    const view = rolesPermissions.employee.screens?.view;
    expect(typeof view).toBe("function");
    if (typeof view !== "function") return;
    const user = { id: "u1", role: "employee" as const };
    expect(view(user, { screenKey: "sales" })).toBe(true);
    expect(view(user, { screenKey: "users" })).toBe(false);
  });
});

describe("leadFieldViolation", () => {
  const blocked = { doNotContact: true, ownerId: "admin-1" };
  const open = { doNotContact: false, ownerId: null };

  it("lets only an admin lift a do-not-contact block", () => {
    expect(
      leadFieldViolation("employee", "op-1", { doNotContact: false }, blocked),
    ).toBe("do_not_contact_admin_only");
    expect(
      leadFieldViolation("admin", "a-1", { doNotContact: false }, blocked),
    ).toBeNull();
  });

  it("lets an operator set do-not-contact and resend the current value", () => {
    expect(
      leadFieldViolation("employee", "op-1", { doNotContact: true }, open),
    ).toBeNull();
    expect(
      leadFieldViolation("employee", "op-1", { doNotContact: true }, blocked),
    ).toBeNull();
    expect(
      leadFieldViolation("employee", "op-1", { doNotContact: false }, open),
    ).toBeNull();
  });

  it("lets an operator assign a lead only to themselves or nobody", () => {
    expect(
      leadFieldViolation("employee", "op-1", { ownerId: "op-2" }, open),
    ).toBe("owner_admin_only");
    expect(
      leadFieldViolation("employee", "op-1", { ownerId: "op-2" }, null),
    ).toBe("owner_admin_only");
    expect(
      leadFieldViolation("employee", "op-1", { ownerId: "op-1" }, null),
    ).toBeNull();
    expect(
      leadFieldViolation("employee", "op-1", { ownerId: null }, blocked),
    ).toBeNull();
    // Re-sending the current owner is not a change.
    expect(
      leadFieldViolation("employee", "op-1", { ownerId: "admin-1" }, blocked),
    ).toBeNull();
    expect(
      leadFieldViolation("admin", "a-1", { ownerId: "op-2" }, open),
    ).toBeNull();
  });
});
