import type { ReactNode } from "react";

import styles from "./motion.module.css";

const VARIANTS = {
  /** Case cards dealt from a fanned deck. */
  work: styles.workIn,
  /** Quote cards drop in and swing on a hook; stats panel flips up. */
  testimonials: styles.testiIn,
  /** An iris opens on the panel; the form slides out like a letter. */
  newsletter: styles.newsIn,
};

/**
 * Gives an existing (server-rendered) section its own scroll-triggered
 * entrance, styled from this wrapper. Pure CSS.
 */
export function MotionReveal({
  variant,
  children,
}: {
  variant: keyof typeof VARIANTS;
  children: ReactNode;
}) {
  return <div className={VARIANTS[variant]}>{children}</div>;
}
