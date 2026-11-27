/**
 * Gateling mark geometry, in the logo artwork's own 1920 × 1920 unit space
 * (traced from public/logo.png). Shared by the animated logo and the
 * homepage intro curtain.
 */

export const LOGO_VIEWBOX = "0 0 1920 1920";

/** The big "A" stroke, as one outline. */
export const LOGO_A_POINTS =
  "245,1497 998,268 1331,804 1143,804 999,576 519,1342 895,1342 990,1497";

/** The hook that closes the "G". */
export const LOGO_HOOK_POINTS =
  "1028,982 1440,982 1508,1092 1508,1380 1335,1547 1333,1094 955,1094";

/** The small square dot. */
export const LOGO_DOT = { x: 1354, y: 717, width: 85, height: 87 } as const;

/** The "A" outline with a lead-in from `startX`, ending back at its first corner. */
export function logoTracePath(startX: number): string {
  return `M${startX} 1497 L${LOGO_A_POINTS.replaceAll(" ", " L")} L245 1497`;
}
