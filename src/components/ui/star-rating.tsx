import { StarIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  /** 0–5; fractions fill part of a star. */
  value: number;
  /** Accessible text, e.g. "Rated 4.7 out of 5" (already translated). */
  label: string;
  className?: string;
  /** Fill colour classes for the lit stars; brand colours go here. */
  fillClassName?: string;
};

const STARS = [1, 2, 3, 4, 5] as const;

/**
 * Five stars filled to `value`. Fills from the inline start, so it reads
 * correctly in RTL. The stars are one image with a text label; screen readers
 * get the label, not five icons.
 */
export function StarRating({
  value,
  label,
  className,
  fillClassName = "fill-primary text-primary",
}: Props) {
  const clamped = Math.max(0, Math.min(5, value));
  return (
    <span
      role="img"
      aria-label={label}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {STARS.map((star) => {
        const fill = Math.max(0, Math.min(1, clamped - (star - 1)));
        return (
          <span key={star} className="relative inline-flex size-4">
            <StarIcon
              aria-hidden="true"
              className="size-4 text-muted-foreground/40"
            />
            <span
              className="absolute inset-y-0 start-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <StarIcon
                aria-hidden="true"
                className={cn("size-4", fillClassName)}
              />
            </span>
          </span>
        );
      })}
    </span>
  );
}
