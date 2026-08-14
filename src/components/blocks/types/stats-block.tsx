"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { BlockDataByType } from "@/features/system/shared/content-blocks";
import { useScrollAnimation } from "@/hooks/use-animation";
import type { BlockRendererItemProps } from "../block-renderer";

type Props = BlockRendererItemProps<BlockDataByType["stats"]>;

function splitValue(value: string): {
  prefix: string;
  numeric: number | null;
  suffix: string;
} {
  const match = value.match(/^([^\d-]*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!match) return { prefix: "", numeric: null, suffix: value };
  const [, prefix = "", numericStr = "", suffix = ""] = match;
  return { prefix, numeric: Number(numericStr), suffix };
}

function CountUpValue({ value }: { value: string }) {
  const { elementRef, isVisible } = useScrollAnimation(0.3);
  const { prefix, numeric, suffix } = splitValue(value);
  // Start at the real number, not 0. The server-rendered HTML is what crawlers
  // and no-JS visitors read, and a case study whose metrics render as "0%" is
  // worse than one with no animation at all. The count-up is re-armed below,
  // in a layout effect, so the browser never paints this initial value.
  const [display, setDisplay] = useState(numeric === null ? value : numeric);
  const hasAnimated = useRef(false);

  // Layout effect, not passive: it runs before the first paint, so resetting
  // to 0 is invisible to the user. A passive effect here would flash the real
  // number for a frame before the count-up started.
  useLayoutEffect(() => {
    if (numeric === null || hasAnimated.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setDisplay(0);
  }, [numeric]);

  useEffect(() => {
    if (!isVisible || numeric === null || hasAnimated.current) return;
    hasAnimated.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(numeric);
      return;
    }
    const duration = 900;
    const start = performance.now();

    const target = numeric;
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(target * progress));
      if (progress < 1) requestAnimationFrame(tick);
    }
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isVisible, numeric]);

  return (
    <p
      ref={elementRef}
      className="text-3xl font-bold tracking-tight text-primary"
    >
      {numeric === null ? value : `${prefix}${display}${suffix}`}
    </p>
  );
}

export function StatsBlock({ data, locale }: Props) {
  if (!data.items || data.items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
      {data.items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static content list, no stable ID
        <div key={index} className="text-center">
          <CountUpValue value={item.value} />
          <p className="mt-1 text-sm text-muted-foreground">
            {locale === "ar" ? (item.labelAr ?? item.labelEn) : item.labelEn}
          </p>
        </div>
      ))}
    </div>
  );
}
