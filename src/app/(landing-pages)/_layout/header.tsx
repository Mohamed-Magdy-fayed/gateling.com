"use client";

import {
  LayoutDashboardIcon,
  LogInIcon,
  LogOutIcon,
  PhoneIcon,
} from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore, useTransition } from "react";
import { LinkButton } from "@/components/general/link-button";
import { Button } from "@/components/ui/button";
import { GatelingLogoLink } from "@/components/ui/logo";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/features/core/auth/nextjs/components/auth-provider";
import { signOutAction } from "@/features/core/auth/nextjs/actions";
import { ThemeToggle } from "@/features/core/color-theme/client";
import { LanguageToggle, useTranslation } from "@/features/core/i18n/client";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const { t } = useTranslation();
  const { isAuthenticated, session } = useAuth();
  const [isSigningOut, startSignOutTransition] = useTransition();

  const handleSignOut = () => {
    startSignOutTransition(async () => {
      await signOutAction();
    });
  };

  const nav = [
    { label: t("publicPages.nav.about"), href: "/about" },
    { label: t("publicPages.nav.work"), href: "/work" },
    { label: t("publicPages.nav.services"), href: "/services" },
    { label: t("publicPages.nav.blog"), href: "/blog" },
    { label: t("publicPages.nav.contact"), href: "/contact" },
  ];

  const isScrolled = useSyncExternalStore(
    (onScrolledChange) => {
      window.addEventListener("scroll", onScrolledChange);
      return () => window.removeEventListener("scroll", onScrolledChange);
    },
    () => window.scrollY > 10,
    () => false,
  );

  const isAdmin = isAuthenticated && session?.user.role === "admin";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 ease-in-out",
        isScrolled
          ? "border-b bg-background/10 backdrop-blur-md shadow-sm supports-backdrop-filter:bg-background/80"
          : "border-b border-transparent bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60",
      )}
    >
      <div className="mx-auto px-4 md:px-8 lg:px-16 max-w-7xl">
        <div className="flex h-16 gap-4 items-center justify-between">
          <GatelingLogoLink iconSize={26} className="flex-1 md:flex-none" />

          {/* Desktop nav — centered via flex-1 */}
          <nav className="hidden lg:flex items-center space-x-1">
            {nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="relative px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-all duration-200 rounded-md hover:bg-accent/50 group"
              >
                {item.label}
                <span className="absolute inset-x-4 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            {isAuthenticated ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isSigningOut}
                      onClick={handleSignOut}
                      className="hover:translate-y-0.5 hover:text-destructive"
                    >
                      {isSigningOut ? <Spinner /> : <LogOutIcon />}
                    </Button>
                  }
                />
                <TooltipContent>{t("authTranslations.signOut")}</TooltipContent>
              </Tooltip>
            ) : (
              <LinkButton
                href="/sign-in"
                variant="ghost"
                size="icon"
                className="hover:translate-y-0.5 hover:text-secondary"
              >
                <LogInIcon />
              </LinkButton>
            )}
            {isAdmin ? (
              <LinkButton href="/dashboard" className="hover:translate-y-0.5">
                <LayoutDashboardIcon />
                {t("publicPages.nav.dashboard")}
              </LinkButton>
            ) : (
              <LinkButton href="/contact" className="hover:translate-y-0.5">
                <PhoneIcon />
                {t("publicPages.nav.ctaContact")}
              </LinkButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
