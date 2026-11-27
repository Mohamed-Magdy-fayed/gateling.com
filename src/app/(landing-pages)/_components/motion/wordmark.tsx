import {
  LOGO_A_POINTS,
  LOGO_DOT,
  LOGO_HOOK_POINTS,
} from "@/components/ui/logo-geometry";

/*
 * The "Gateling" wordmark with the logo standing in for the G. The intro
 * curtain and the hero's background wordmark both draw it with this exact
 * geometry, so the curtain's word can land precisely on the background one.
 */

export const WORDMARK_VIEWBOX = "0 0 7800 1800";

type Props = {
  aClassName?: string;
  hookClassName?: string;
  dotClassName?: string;
  textClassName?: string;
};

export function WordmarkShapes({
  aClassName,
  hookClassName,
  dotClassName,
  textClassName,
}: Props) {
  return (
    <>
      <polygon className={aClassName} points={LOGO_A_POINTS} />
      <polygon className={hookClassName} points={LOGO_HOOK_POINTS} />
      <rect className={dotClassName} {...LOGO_DOT} />
      <text
        className={textClassName}
        x="1640"
        y="1497"
        fontSize="1780"
        fontWeight="900"
        textLength="5900"
        lengthAdjust="spacingAndGlyphs"
      >
        ateling
      </text>
    </>
  );
}
