import type { ScreenKey, SystemNavItem } from "@/features/system/registry";

/**
 * Primary destinations in the staff mobile bottom bar: the most-visited
 * *pages* (leaf screens, never a section parent like "content" or "sales").
 * Profile occupies col 1, these fill cols 2-4, More is col 5.
 */
export const SYSTEM_MOBILE_PRIMARY_SCREEN_KEYS = [
  "dashboard",
  "salesToday",
  "discovery",
] as const satisfies readonly ScreenKey[];

/**
 * A section with children is a group, not a page: its parent link only
 * duplicates one child. On mobile we list the actual pages, so a parent is
 * replaced by its children. Pure, so it is unit-tested.
 */
export function flattenToPages(
  items: readonly SystemNavItem[],
  canView: (screenKey: SystemNavItem["screenKey"]) => boolean,
): SystemNavItem[] {
  return items.flatMap((item) => {
    if (!canView(item.screenKey)) return [];
    const children = (item.children ?? []).filter((child) =>
      canView(child.screenKey),
    );
    return children.length > 0
      ? children.map((child) => ({ ...child, children: undefined }))
      : [item];
  });
}
