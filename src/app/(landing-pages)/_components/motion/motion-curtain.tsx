import {
  LOGO_A_POINTS,
  LOGO_DOT,
  LOGO_HOOK_POINTS,
  logoTracePath,
} from "@/components/ui/logo-geometry";
import styles from "./motion.module.css";

/*
 * Intro curtain: the logo is drawn on the orange, its pieces fly into place,
 * then it becomes a window onto the site and the view zooms through it.
 * Pure SVG + CSS keyframes (see motion.module.css). Coordinates are the
 * logo's own 1920-unit artwork space (public/logo.png).
 */

const A_POINTS = LOGO_A_POINTS;
const HOOK_POINTS = LOGO_HOOK_POINTS;
const DOT = LOGO_DOT;
// Lead-in starts just past the left edge of the screen.
const A_TRACE = logoTracePath(-300);

function LogoShapes() {
  return (
    <>
      <polygon points={A_POINTS} />
      <polygon points={HOOK_POINTS} />
      <rect {...DOT} />
    </>
  );
}

export function MotionCurtain() {
  return (
    <div className={styles.curtain} aria-hidden>
      <svg
        className={styles.curtainSvg}
        aria-hidden="true"
        viewBox="0 0 7800 1800"
        preserveAspectRatio="xMidYMid meet"
        direction="ltr"
      >
        <defs>
          <mask
            id="curtain-window"
            maskUnits="userSpaceOnUse"
            x="-100000"
            y="-100000"
            width="200000"
            height="200000"
          >
            <rect
              x="-100000"
              y="-100000"
              width="200000"
              height="200000"
              fill="white"
            />
            <g className={styles.curtainHole} fill="black">
              <LogoShapes />
            </g>
          </mask>
        </defs>

        <g className={styles.curtainZoom}>
          <rect
            x="-100000"
            y="-100000"
            width="200000"
            height="200000"
            fill="var(--primary)"
            mask="url(#curtain-window)"
          />

          <g className={styles.curtainLogo} fill="var(--primary-foreground)">
            <path
              className={styles.curtainTrace}
              d={A_TRACE}
              fill="none"
              stroke="var(--primary-foreground)"
              strokeWidth="28"
              strokeLinejoin="miter"
            />
            <polygon className={styles.curtainA} points={A_POINTS} />
            <polygon className={styles.curtainHook} points={HOOK_POINTS} />
            <rect className={styles.curtainDot} {...DOT} />
            <text
              className={styles.curtainText}
              x="1640"
              y="1497"
              fontSize="1780"
              fontWeight="900"
              textLength="5900"
              lengthAdjust="spacingAndGlyphs"
            >
              ateling
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
