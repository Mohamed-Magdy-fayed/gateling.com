import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  FileText,
  Inbox,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Settings,
  Star,
  TableOfContentsIcon,
  Users,
} from "lucide-react";

type NavTranslationKey =
  | null
  | "navDashboard"
  | "navContent"
  | "navWork"
  | "navBlogPosts"
  | "navServices"
  | "navTestimonials"
  | "navLeads"
  | "navSubscribers"
  | "navUsers"
  | "navBranches"
  | "navSettings";

type BreadcrumbTranslationKey =
  | null
  | "breadcrumbDashboard"
  | "breadcrumbContent"
  | "breadcrumbWork"
  | "breadcrumbBlogPosts"
  | "breadcrumbServices"
  | "breadcrumbTestimonials"
  | "breadcrumbLeads"
  | "breadcrumbSubscribers"
  | "breadcrumbUsers"
  | "breadcrumbBranches"
  | "breadcrumbSettings";

type SystemScreenRecord = {
  key: string;
  href: `/${string}`;
  pathPrefixes: readonly `/${string}`[];
  Icon: LucideIcon;
  navTranslationKey: NavTranslationKey;
  breadcrumbTranslationKey: BreadcrumbTranslationKey;
  children?: readonly SystemScreenRecord[];
};

export const SYSTEM_SCREEN_DEFINITIONS: SystemScreenRecord[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    pathPrefixes: ["/dashboard"],
    Icon: LayoutDashboard,
    navTranslationKey: "navDashboard",
    breadcrumbTranslationKey: "breadcrumbDashboard",
  },
  {
    key: "content",
    href: "/content",
    pathPrefixes: [
      "/content",
      "/work-mgmt",
      "/blog-posts",
      "/services-mgmt",
      "/testimonials",
    ],
    Icon: TableOfContentsIcon,
    navTranslationKey: "navContent",
    breadcrumbTranslationKey: "breadcrumbContent",
    children: [
      {
        key: "work",
        href: "/work-mgmt",
        pathPrefixes: ["/work-mgmt"],
        Icon: Briefcase,
        navTranslationKey: "navWork",
        breadcrumbTranslationKey: "breadcrumbWork",
      },
      {
        key: "blogPosts",
        href: "/blog-posts",
        pathPrefixes: ["/blog-posts"],
        Icon: FileText,
        navTranslationKey: "navBlogPosts",
        breadcrumbTranslationKey: "breadcrumbBlogPosts",
      },
      {
        key: "services",
        href: "/services-mgmt",
        pathPrefixes: ["/services-mgmt"],
        Icon: Inbox,
        navTranslationKey: "navServices",
        breadcrumbTranslationKey: "breadcrumbServices",
      },
      {
        key: "testimonials",
        href: "/testimonials",
        pathPrefixes: ["/testimonials"],
        Icon: Star,
        navTranslationKey: "navTestimonials",
        breadcrumbTranslationKey: "breadcrumbTestimonials",
      },
    ],
  },
  {
    key: "leads",
    href: "/leads",
    pathPrefixes: ["/leads"],
    Icon: MessageSquare,
    navTranslationKey: "navLeads",
    breadcrumbTranslationKey: "breadcrumbLeads",
  },
  {
    key: "subscribers",
    href: "/subscribers",
    pathPrefixes: ["/subscribers"],
    Icon: Mail,
    navTranslationKey: "navSubscribers",
    breadcrumbTranslationKey: "breadcrumbSubscribers",
  },
  {
    key: "users",
    href: "/users",
    pathPrefixes: ["/users"],
    Icon: Users,
    navTranslationKey: "navUsers",
    breadcrumbTranslationKey: "breadcrumbUsers",
  },
  {
    key: "branches",
    href: "/branches",
    pathPrefixes: ["/branches"],
    Icon: Building2,
    navTranslationKey: "navBranches",
    breadcrumbTranslationKey: "breadcrumbBranches",
  },
  {
    key: "settings",
    href: "/settings",
    pathPrefixes: ["/settings"],
    Icon: Settings,
    navTranslationKey: "navSettings",
    breadcrumbTranslationKey: "breadcrumbSettings",
  },
];

export type ScreenKey = (typeof SYSTEM_SCREEN_DEFINITIONS)[number]["key"];
export type SystemScreenDefinition = (typeof SYSTEM_SCREEN_DEFINITIONS)[number];

export const screenKeys = SYSTEM_SCREEN_DEFINITIONS.map(
  (screen) => screen.key,
) as readonly ScreenKey[];

export type SystemNavItem = {
  href: string;
  translationKey: NavTranslationKey;
  screenKey: ScreenKey;
  Icon: LucideIcon;
  children?: readonly SystemNavItem[];
};

export const SYSTEM_NAV_ITEMS: SystemNavItem[] =
  SYSTEM_SCREEN_DEFINITIONS.flatMap((screen) => [
    {
      href: screen.href,
      translationKey: screen.navTranslationKey,
      screenKey: screen.key,
      Icon: screen.Icon,
      children: screen.children
        ?.filter((child) => child !== null)
        .map((child) => {
          return {
            href: child.href,
            translationKey: child.navTranslationKey,
            screenKey: child.key,
            Icon: child.Icon,
          };
        }),
    },
  ]);

function matchesPathPrefix(
  pathname: string,
  prefixes: readonly `/${string}`[],
): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getScreenDefinition(
  screenKey: ScreenKey,
): SystemScreenDefinition | undefined {
  return SYSTEM_SCREEN_DEFINITIONS.find((screen) => screen.key === screenKey);
}

export function getProtectedScreenDefinitionByPathname(pathname: string) {
  return SYSTEM_SCREEN_DEFINITIONS.find((screen) =>
    matchesPathPrefix(pathname, screen.pathPrefixes),
  );
}
