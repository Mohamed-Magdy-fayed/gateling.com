import { TRPCError } from "@trpc/server";

/**
 * The sales pipeline is worked by staff: admins and operators (`employee`).
 * `src/proxy.ts` already blocks the `/sales` routes by screen permission, but a
 * tRPC procedure is reachable directly — the route guard is not the
 * authorisation.
 */
export function assertSalesStaff(role: string | undefined) {
  if (role !== "admin" && role !== "employee") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}

/** Export and bulk status changes stay admin-only. */
export function assertAdmin(role: string | undefined) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
}

export type LeadFieldViolation =
  | "do_not_contact_admin_only"
  | "owner_admin_only";

/**
 * Lead fields an operator may not change. Only an admin may lift a lead's
 * do-not-contact block (it is an opt-out), and an operator may assign a lead
 * only to themselves or nobody. `current` is null on create.
 */
export function leadFieldViolation(
  role: string | undefined,
  userId: string,
  input: { doNotContact?: boolean; ownerId?: string | null },
  current: { doNotContact: boolean; ownerId: string | null } | null,
): LeadFieldViolation | null {
  if (role === "admin") return null;
  if (input.doNotContact === false && current?.doNotContact) {
    return "do_not_contact_admin_only";
  }
  const owner = input.ownerId;
  if (
    owner !== undefined &&
    owner !== null &&
    owner !== userId &&
    owner !== current?.ownerId
  ) {
    return "owner_admin_only";
  }
  return null;
}
