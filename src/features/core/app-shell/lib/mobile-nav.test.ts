import { LayoutDashboard } from "lucide-react";
import { describe, expect, it } from "vitest";

import type { SystemNavItem } from "@/features/system/registry";
import { SYSTEM_NAV_ITEMS } from "@/features/system/registry";

import {
  flattenToPages,
  SYSTEM_MOBILE_PRIMARY_SCREEN_KEYS,
} from "./mobile-nav";

const item = (
  screenKey: string,
  children?: SystemNavItem[],
): SystemNavItem => ({
  href: `/${screenKey}`,
  translationKey: null,
  screenKey,
  Icon: LayoutDashboard,
  children,
});

describe("flattenToPages", () => {
  it("replaces a section parent with its child pages", () => {
    const pages = flattenToPages(
      [
        item("dashboard"),
        item("sales", [item("salesToday"), item("salesLeads")]),
      ],
      () => true,
    );
    expect(pages.map((p) => p.screenKey)).toEqual([
      "dashboard",
      "salesToday",
      "salesLeads",
    ]);
  });

  it("drops screens the user cannot view, parent or child", () => {
    const pages = flattenToPages(
      [item("leads"), item("content", [item("work"), item("blogPosts")])],
      (key) => key !== "leads" && key !== "blogPosts",
    );
    expect(pages.map((p) => p.screenKey)).toEqual(["work"]);
  });

  it("every primary bottom-bar key is a real page in the flattened nav", () => {
    const keys = flattenToPages(SYSTEM_NAV_ITEMS, () => true).map(
      (p) => p.screenKey,
    );
    for (const key of SYSTEM_MOBILE_PRIMARY_SCREEN_KEYS) {
      expect(keys).toContain(key);
    }
  });
});
