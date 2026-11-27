import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";
import { cssVars } from "./motion-style";

/**
 * Splits text into masked words for reveal animations. Words only — splitting
 * into letters would break Arabic letter joining. Each word carries `--i`.
 */
export function SplitWords({
  text,
  className,
  wordStyle,
}: {
  text: string;
  className?: string;
  wordStyle?: (i: number) => CSSProperties;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((word, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static text, order never changes
        <span key={i}>
          <span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom">
            <span
              data-word
              className={cn("inline-block", className)}
              style={{ ...cssVars({ "--i": i }), ...wordStyle?.(i) }}
            >
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}
