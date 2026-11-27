"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useTranslation } from "@/features/core/i18n/client";
import { cn } from "@/lib/utils";
import styles from "./logo.module.css";
import {
  LOGO_A_POINTS,
  LOGO_DOT,
  LOGO_HOOK_POINTS,
  LOGO_VIEWBOX,
  logoTracePath,
} from "./logo-geometry";

const TRACE_PATH = logoTracePath(0);
const TRIGGER_SELECTOR = "a, button, [role='button'], summary";

/**
 * - `hover` (default): plays the draw-in once when the logo, or the link /
 *   button it sits in, is hovered or keyboard-focused.
 * - `loop`: plays forever, for places where the mark should stand out.
 * - `none`: static.
 * Reduced-motion users always get the static mark.
 */
export type LogoAnimation = "hover" | "loop" | "none";

interface GatelingLogoProps {
  size?: number;
  className?: string;
  animate?: LogoAnimation;
}

export function GatelingLogo({
  size = 32,
  className,
  animate = "hover",
}: GatelingLogoProps) {
  const { dir } = useTranslation();
  const label = dir === "rtl" ? "بُوَيْب" : "Gateling Solutions";
  const ref = useRef<SVGSVGElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const svg = ref.current;
    if (!svg || animate !== "hover") return;

    const trigger = svg.closest(TRIGGER_SELECTOR) ?? svg;
    const play = () => setIsPlaying(true);
    const playOnKeyboardFocus = (event: Event) => {
      if (
        event.target instanceof Element &&
        event.target.matches(":focus-visible")
      ) {
        play();
      }
    };

    trigger.addEventListener("pointerenter", play);
    trigger.addEventListener("focusin", playOnKeyboardFocus);
    return () => {
      trigger.removeEventListener("pointerenter", play);
      trigger.removeEventListener("focusin", playOnKeyboardFocus);
    };
  }, [animate]);

  return (
    <svg
      ref={ref}
      role="img"
      aria-label={label}
      viewBox={LOGO_VIEWBOX}
      width={size}
      height={size}
      fill="currentColor"
      data-play={isPlaying ? "" : undefined}
      data-loop={animate === "loop" ? "" : undefined}
      onAnimationEnd={() => setIsPlaying(false)}
      className={cn(styles.logo, "shrink-0 text-primary", className)}
    >
      <title>{label}</title>
      <path
        className={styles.trace}
        d={TRACE_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth="60"
        strokeLinejoin="miter"
      />
      <polygon className={styles.a} points={LOGO_A_POINTS} />
      <polygon className={styles.hook} points={LOGO_HOOK_POINTS} />
      <rect className={styles.dot} {...LOGO_DOT} />
    </svg>
  );
}

interface GatelingLogoLinkProps {
  iconSize?: number;
  className?: string;
  animate?: LogoAnimation;
}

export function GatelingLogoLink({
  iconSize = 26,
  className,
  animate,
}: GatelingLogoLinkProps) {
  const { t } = useTranslation();

  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 font-semibold", className)}
    >
      <GatelingLogo size={iconSize} animate={animate} />
      <span className="text-primary">{t("logoName")}</span>
    </Link>
  );
}
