import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { hasPermission } from "@/features/core/auth/core/permissions";
import { useAuth } from "@/features/core/auth/nextjs/components/auth-provider";
import { useTranslation } from "@/features/core/i18n/client";
import type { SystemNavItem } from "@/features/system/registry";
import { cn } from "@/lib/utils";

function navLabelKey(translationKey: SystemNavItem["translationKey"]) {
  return `systemPages.${translationKey ?? "navDashboard"}` as const;
}

export function useNavRender() {
  const { session } = useAuth();
  const { t } = useTranslation();
  const allowedByDefault = ["/redirects"];

  function renderSidebarItems(items: SystemNavItem[], pathname: string) {
    return items
      .filter((navLink) => navLink.screenKey !== "general")
      .filter((l) => {
        if (!session?.user) return false;
        try {
          // `screenKey`, not `href`: `EMPLOYEE_BLOCKED_SCREENS` holds keys like
          // `leads`, so passing `/leads` never matched and every blocked screen
          // still rendered a sidebar link that `src/proxy.ts` then refused.
          return (
            hasPermission(session.user, "screens", "view", {
              screenKey: l?.screenKey,
            }) || !allowedByDefault.some((href) => l?.href?.includes(href))
          );
        } catch (e) {
          console.log(e);
          return false;
        }
      })
      .map((navLink) =>
        navLink.children?.length ? (
          <Collapsible
            className="group"
            key={`${navLink.translationKey} Collapsible`}
            defaultOpen={navLink.children.some(
              (child) => child.href && pathname.includes(child.href),
            )}
          >
            <SidebarMenuItem>
              <CollapsibleTrigger
                className="group"
                aria-activedescendant={
                  navLink.children.some(
                    (child) => child.href && pathname.includes(child.href),
                  )
                    ? "true"
                    : "false"
                }
                render={(props) => (
                  <SidebarMenuButton {...props}>
                    <navLink.Icon />
                    {t(navLabelKey(navLink.translationKey))}
                    <SidebarMenuAction
                      render={(props) => (
                        <ChevronDownIcon
                          size={16}
                          {...props}
                          className={cn(
                            "transition-transform duration-200 rtl:rotate-90 ltr:rotate-270 group-data-panel-open:ltr:rotate-360 group-data-panel-open:rtl:rotate-0 group-data-panel-closed:rotate-0",
                            props.className,
                          )}
                        />
                      )}
                    />
                  </SidebarMenuButton>
                )}
              />
            </SidebarMenuItem>
            <CollapsibleContent
              keepMounted
              className="h-(--collapsible-panel-height) overflow-hidden transition-all [&[hidden]:not([hidden='until-found'])]:hidden data-ending-style:h-0 data-starting-style:h-0"
            >
              <SidebarMenuSub>
                {navLink.children.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.screenKey}>
                    <SidebarMenuSubButton
                      render={(props) =>
                        subItem.href ? (
                          <Link href={subItem.href} {...props}>
                            <subItem.Icon />
                            <span className="text-xs truncate">
                              {t(navLabelKey(subItem.translationKey))}
                            </span>
                          </Link>
                        ) : (
                          <span {...props}>
                            <subItem.Icon />
                            <span className="text-xs truncate">
                              {t(navLabelKey(subItem.translationKey))}
                            </span>
                          </span>
                        )
                      }
                      aria-activedescendant={
                        subItem.href && pathname.includes(subItem.href)
                          ? "true"
                          : "false"
                      }
                      className="aria-activedescendant:bg-accent/60"
                    />
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <SidebarMenuItem key={navLink.screenKey}>
            <SidebarMenuButton
              render={(props) =>
                navLink.href ? (
                  <Link href={navLink.href} {...props}>
                    <navLink.Icon />
                    {t(navLabelKey(navLink.translationKey))}
                  </Link>
                ) : (
                  <span className="flex items-center" {...props}>
                    <navLink.Icon />
                    <span className="truncate">
                      {t(navLabelKey(navLink.translationKey))}
                    </span>
                  </span>
                )
              }
              tooltip={t(navLabelKey(navLink.translationKey))}
              size="sm"
              aria-activedescendant={
                navLink.href && pathname.includes(navLink.href)
                  ? "true"
                  : "false"
              }
              className="aria-activedescendant:bg-accent/60"
            />
          </SidebarMenuItem>
        ),
      );
  }

  function renderDropdownMenuForItem(navLink: SystemNavItem, pathname: string) {
    if (navLink.children?.length) {
      return (
        <DropdownMenu
          key={`${t(navLabelKey(navLink.translationKey))} DropdownMenu`}
        >
          <DropdownMenuTrigger
            render={(props) => (
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="sm"
                  tooltip={t(navLabelKey(navLink.translationKey))}
                  {...props}
                >
                  <navLink.Icon size={20} />
                  <span>{t(navLabelKey(navLink.translationKey))}</span>
                  <SidebarMenuAction
                    render={(props) => (
                      <ChevronDownIcon
                        size={16}
                        className="transition-transform duration-200 group-data-open:ltr:rotate-90 group-data-open:rtl:-rotate-90"
                        {...props}
                      />
                    )}
                    className="transition-transform duration-200 ml-auto"
                  />
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          />
          <DropdownMenuContent side="right">
            <DropdownMenuGroup>
              {navLink.href && (
                <DropdownMenuItem
                  render={(props) => (
                    <Link
                      href={navLink.href}
                      className="font-medium"
                      {...props}
                    >
                      <navLink.Icon size={20} />
                      <span>{navLabelKey(navLink.translationKey)}</span>
                    </Link>
                  )}
                />
              )}
              {navLink.children.map((subItem) => (
                <DropdownMenuItem
                  render={(props) =>
                    subItem.href ? (
                      <Link href={subItem.href} {...props}>
                        <subItem.Icon size={20} />
                        <span>{t(navLabelKey(subItem.translationKey))}</span>
                      </Link>
                    ) : (
                      <span {...props}>
                        {t(navLabelKey(subItem.translationKey))}
                      </span>
                    )
                  }
                  key={subItem.href || t(navLabelKey(subItem.translationKey))}
                  aria-activedescendant={
                    subItem.href && pathname.includes(subItem.href)
                      ? "true"
                      : "false"
                  }
                  className="aria-activedescendant:bg-accent/60"
                />
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    } else {
      return (
        <SidebarMenuItem
          key={`${t(navLabelKey(navLink.translationKey))} SidebarMenuItem`}
        >
          <SidebarMenuButton
            render={(props) =>
              navLink.href ? (
                <Link href={navLink.href} {...props}>
                  <navLink.Icon size={20} />
                  <span>{t(navLabelKey(navLink.translationKey))}</span>
                </Link>
              ) : (
                <span className="flex items-center" {...props}>
                  <navLink.Icon size={20} />
                  <span>{t(navLabelKey(navLink.translationKey))}</span>
                </span>
              )
            }
            tooltip={t(navLabelKey(navLink.translationKey))}
            size="sm"
            aria-activedescendant={
              navLink.href && pathname.includes(navLink.href) ? "true" : "false"
            }
            className="aria-activedescendant:bg-accent/60"
          />
        </SidebarMenuItem>
      );
    }
  }

  return {
    renderSidebarItems,
    renderDropdownMenuForItem,
  };
}
