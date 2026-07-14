import { hasPermission } from "@/features/core/auth/core/permissions";
import type { PartialUser } from "@/features/core/auth/types";
import { SYSTEM_NAV_ITEMS } from "@/features/system/registry";

const EMPLOYEE_HOME_HREF = "/leads";

export function isSafeReturnTo(returnTo: string | undefined): returnTo is string {
  if (!returnTo) return false;
  if (!returnTo.startsWith("/")) return false;
  if (returnTo.startsWith("//") || returnTo.startsWith("/\\")) return false;
  return true;
}

export function getPostAuthRedirect(user: PartialUser, returnTo?: string) {
  if (user.role === "customer") {
    if (isSafeReturnTo(returnTo)) return returnTo;
    return "/my-account";
  }

  if (
    user.role === "employee" &&
    hasPermission(user, "screens", "view", { screenKey: "leads" })
  ) {
    return EMPLOYEE_HOME_HREF;
  }

  return (
    SYSTEM_NAV_ITEMS.find((item) =>
      hasPermission(user, "screens", "view", {
        screenKey: item.screenKey,
      }),
    )?.href ?? "/dashboard"
  );
}
