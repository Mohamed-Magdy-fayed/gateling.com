import { logoTracePath } from "@/components/ui/logo-geometry";
import styles from "./motion.module.css";
import { WORDMARK_VIEWBOX, WordmarkShapes } from "./wordmark";

/*
 * Intro curtain: the logo is drawn on the orange and its pieces fly into
 * place. Then the orange fades away while the word glides down into the
 * hero's background wordmark and hands off to it.
 * Pure SVG + CSS keyframes (see motion.module.css).
 */

// Lead-in starts just past the left edge of the screen.
const A_TRACE = logoTracePath(-300);

export function MotionCurtain() {
  return (
    <div className={styles.curtain} aria-hidden>
      <div className={styles.curtainBg} />
      <svg
        className={styles.curtainSvg}
        aria-hidden="true"
        viewBox={WORDMARK_VIEWBOX}
        preserveAspectRatio="xMidYMid meet"
        direction="ltr"
      >
        <path
          className={styles.curtainTrace}
          d={A_TRACE}
          fill="none"
          stroke="var(--primary-foreground)"
          strokeWidth="28"
          strokeLinejoin="miter"
        />
        <g
          className={styles.curtainLogo}
          fill="var(--primary-foreground)"
          stroke="var(--primary)"
          strokeWidth="2"
        >
          <WordmarkShapes
            aClassName={styles.curtainA}
            hookClassName={styles.curtainHook}
            dotClassName={styles.curtainDot}
            textClassName={styles.curtainText}
          />
        </g>
      </svg>
    </div>
  );
}
