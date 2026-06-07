"use client";

import { LayoutDashboardIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LinkButton } from "@/components/general/link-button";
import { GatelingLogo, GatelingLogoLink } from "@/components/ui/logo";
import { AuthManagerHeaderTrigger } from "@/features/core/auth/nextjs/components/auth-manager-header-trigger";
import { useAuth } from "@/features/core/auth/nextjs/components/auth-provider";
import { ThemeToggle } from "@/features/core/color-theme/client";
import { LanguageToggle, useTranslation } from "@/features/core/i18n/client";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const { t } = useTranslation();
  const { isAuthenticated, session } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    const el = document.getElementById("site-scroll");
    if (!el) return;
    const onScroll = () => setIsScrolled(el.scrollTop > 10);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const nav = [
    { label: t("publicPages.nav.about"), href: "/about" },
    { label: t("publicPages.nav.work"), href: "/work" },
    { label: t("publicPages.nav.services"), href: "/services" },
    { label: t("publicPages.nav.blog"), href: "/blog" },
  ];

  const mobileTitle = useMemo(() => {
    const routes = [
      { href: "/about", label: t("publicPages.nav.about") },
      { href: "/work", label: t("publicPages.nav.work") },
      { href: "/services", label: t("publicPages.nav.services") },
      { href: "/blog", label: t("publicPages.nav.blog") },
      { href: "/contact", label: t("publicPages.footer.navContact") },
    ];
    const match =
      routes.find((r) => r.href === pathname) ??
      routes.find((r) => pathname.startsWith(r.href));
    return match?.label ?? t("landing.tabHome");
  }, [pathname, t]);

  const isAdmin = isAuthenticated && session?.user.role === "admin";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "border-b bg-background/80 shadow-sm backdrop-blur-md"
          : "bg-background/95 backdrop-blur",
      )}
    >
      <div className="container mx-auto flex h-16 items-center px-4 md:px-8">
        {/* Mobile: logo icon + current page title */}
        <Link
          href="/"
          className="flex flex-1 items-center gap-2 truncate md:hidden"
        >
          <GatelingLogo size={22} />
          <span className="truncate text-sm font-semibold">{mobileTitle}</span>
        </Link>

        {/* Mobile: theme + language toggles */}
        <div className="flex shrink-0 items-center gap-0.5 md:hidden">
          <ThemeToggle />
          <LanguageToggle />
        </div>

        {/* Desktop: logo */}
        <GatelingLogoLink iconSize={28} className="hidden md:inline-flex" />

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
