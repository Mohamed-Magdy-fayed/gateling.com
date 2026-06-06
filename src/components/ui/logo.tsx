"use client";

import Image from "next/image";
import Link from "next/link";

import { useTranslation } from "@/features/core/i18n/client";
import { cn } from "@/lib/utils";

interface GatelingLogoProps {
  size?: number;
  className?: string;
}

export function GatelingLogo({ size = 32, className }: GatelingLogoProps) {
  const { dir } = useTranslation();
  const isRtl = dir === "rtl";

  return (
    <Image
      alt={isRtl ? "بُوَيْب" : "Gateling Solutions"}
      src="/logo.png"
      width={size}
      height={size}
      aria-label={isRtl ? "بُوَيْب" : "Gateling Solutions"}
      className={cn("shrink-0", className)}
    />
  );
}

interface GatelingLogoLinkProps {
  iconSize?: number;
  className?: string;
}

export function GatelingLogoLink({
  iconSize = 26,
  className,
}: GatelingLogoLinkProps) {
  const { t } = useTranslation();

  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 font-semibold", className)}
    >
      <GatelingLogo size={iconSize} className="text-primary" />
      <span className="text-primary">{String(t("logoName"))}</span>
    </Link>
  );
}
