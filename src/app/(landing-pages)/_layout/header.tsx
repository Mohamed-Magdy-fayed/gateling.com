"use client";

import { LayoutDashboardIcon } from "lucide-react";
import Link from "next/link";
import { LinkButton } from "@/components/general/link-button";
import { GatelingLogoLink } from "@/components/ui/logo";
import { AuthManagerHeaderTrigger } from "@/features/core/auth/nextjs/components/auth-manager-header-trigger";
import { useAuth } from "@/features/core/auth/nextjs/components/auth-provider";
import { ThemeToggle } from "@/features/core/color-theme/client";
import { LanguageToggle, useTranslation } from "@/features/core/i18n/client";
import { useIsScrolled } from "@/hooks/use-scrolled";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const { t } = useTranslation();
  const { isAuthenticated, session } = useAuth();
  const isScrolled = useIsScrolled();

  const nav = [
    { label: t("publicPages.nav.about"), href: "/about" },
    { label: t("publicPages.nav.work"), href: "/work" },
    { label: t("publicPages.nav.services"), href: "/services" },
    { label: t("publicPages.nav.blog"), href: "/blog" },
  ];

  const isAdmin = isAuthenticated && session?.user.role === "admin";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 shrink-0 border-b border-border/60 bg-background/90 backdrop-blur-sm",
        isScrolled && "shadow-sm",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:gap-6 sm:px-6 lg:px-8">
        {/* Logo — all breakpoints; takes remaining space on mobile to push right items */}
        <GatelingLogoLink iconSize={26} className="flex-1 md:flex-none" />

        {/* Desktop nav — centered via flex-1 */}
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-foreground/80 hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile: theme + language toggles */}
        <div className="flex shrink-0 items-center gap-0.5 md:hidden">
          <ThemeToggle />
          <LanguageToggle />
        </div>

        {/* Desktop right: auth + CTA */}
        <div className="hidden items-center gap-2 md:flex">
          <AuthManagerHeaderTrigger />
          {isAdmin ? (
            <LinkButton href="/dashboard" size="sm">
              <LayoutDashboardIcon className="me-2 h-4 w-4" />
              {t("publicPages.nav.dashboard")}
            </LinkButton>
          ) : (
            <LinkButton href="/contact" size="sm">
              {t("publicPages.nav.ctaContact")}
            </LinkButton>
          )}
        </div>
      </div>
    </header>
  );
}
