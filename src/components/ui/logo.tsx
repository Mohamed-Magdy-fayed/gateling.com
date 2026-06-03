"use client";

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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={isRtl ? "بُوَيْب" : "Gateling Solutions"}
      className={cn("shrink-0", className)}
    >
      <rect width="100" height="100" rx="22" fill="currentColor" />
      {isRtl ? (
        <>
          {/* ب lettermark: asymmetric arc (right side higher = tooth) + dot */}
          <path
            d="M80 30 C84 52 66 73 50 73 C34 73 16 58 16 40"
            stroke="white"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
          />
          {/* ب dot */}
          <circle cx="50" cy="87" r="5.5" fill="white" />
        </>
      ) : (
        /* G lettermark: arc + horizontal bar */
        <path
          d="M62 29A24 24 0 1 0 74 50L56 50"
          stroke="white"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
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
