"use client";

import { ChevronsUpDownIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { User } from "@/drizzle/schema";
import { useNavRender } from "@/features/core/app-shell/hooks/useNavRender";
import { hasPermission } from "@/features/core/auth/core/permissions";
import { AuthManager } from "@/features/core/auth/nextjs/components/auth-manager";
import { BranchManager } from "@/features/core/auth/nextjs/components/branch-manager";
import { useTranslation } from "@/features/core/i18n/client";
import { SYSTEM_NAV_ITEMS } from "../lib/nav";

type AppSidebarProps = {
  user: User;
};

function userInitials(user: User): string {
  const name = user.name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    const initials = `${first}${last}`.toUpperCase();
    if (initials) return initials;
  }
  return user.email.slice(0, 2).toUpperCase();
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname() ?? "/";
  const { dir } = useTranslation();

  const visibleNav = useMemo(
    () =>
      SYSTEM_NAV_ITEMS.filter((item) =>
        hasPermission(user, "screens", "view", { screenKey: item.screenKey }),
      ),
    [user],
  );

  const display = user.name?.trim() || user.email;
  const initials = userInitials(user);

  const { renderSidebarItems, renderDropdownMenuForItem } = useNavRender();

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      side={dir === "rtl" ? "right" : "left"}
      dir={dir}
    >
      <SidebarHeader>
        <BranchManager variant="sidebar" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Sidebar (Collapsible) */}
              {!user &&
                Array.from({ length: SYSTEM_NAV_ITEMS.length }).map((item) => (
                  <SidebarMenuSkeleton key={`${item}`} />
                ))}
              <div className="group-data-[collapsible=icon]:hidden space-y-1">
                {renderSidebarItems(visibleNav, pathname)}
              </div>
              {/* Dropdown (Collapsed/rail) */}
              <div className="hidden group-data-[collapsible=icon]:block">
                {visibleNav
                  .filter((navLink) => navLink.screenKey !== "general")
                  .map((item) => renderDropdownMenuForItem(item, pathname))}
              </div>
            </SidebarMenu>
            {/* <SidebarMenu>
              {visibleNav.map(({ href, translationKey, Icon }) => {
                const active =
                  pathname === href || pathname.startsWith(`${href}/`);
                const label = t(navLabelKey(translationKey));
                const hasChildren = visibleNav.some(
                  (navItem) => navItem.children,
                );

                if (hasChildren) (

                )

                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={label}
                      render={<Link href={href} />}
                    >
                      <Icon aria-hidden />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu> */}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <AuthManager
              trigger={
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-medium">{display}</span>
                    <span className="truncate text-xs text-sidebar-foreground/70">
                      {user.email}
                    </span>
                  </div>
                  <ChevronsUpDownIcon className="ms-auto size-4" aria-hidden />
                </SidebarMenuButton>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
