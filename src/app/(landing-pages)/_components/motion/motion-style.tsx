import type { CSSProperties } from "react";

/** Typed inline CSS custom properties, e.g. `cssVars({ "--i": 2 })`. */
export function cssVars(vars: Record<`--${string}`, string | number>) {
  return vars as CSSProperties;
}
