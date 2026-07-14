"use client";

import Image from "next/image";
import { useId, useState } from "react";
import type { BlockDataByType } from "@/features/system/shared/content-blocks";
import type { BlockRendererItemProps } from "../block-renderer";

type Props = BlockRendererItemProps<BlockDataByType["before_after"]>;

/**
 * Judgment call: implemented with a native `<input type="range">` layered
 * over the two stacked images and clip-pathed with the slider value. This
 * keeps the handle keyboard-accessible (arrow keys / Home / End) for free —
 * no pointer-drag-only implementation, no new npm dependency.
 */
export function BeforeAfterBlock({ data, locale }: Props) {
  const [position, setPosition] = useState(50);
  const sliderId = useId();

  if (!data.beforeUrl || !data.afterUrl) return null;

  const isAr = locale === "ar";
  const beforeLabel =
    (isAr ? (data.beforeLabelAr ?? data.beforeLabelEn) : data.beforeLabelEn) ??
    (isAr ? "قبل" : "Before");
  const afterLabel =
    (isAr ? (data.afterLabelAr ?? data.afterLabelEn) : data.afterLabelEn) ??
    (isAr ? "بعد" : "After");

  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl select-none">
        {/* After (base layer) */}
        <Image
          src={data.afterUrl}
          alt={afterLabel}
          fill
          loading="lazy"
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 800px"
        />
        {/* Before (clipped overlay) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <Image
            src={data.beforeUrl}
            alt={beforeLabel}
            fill
            loading="lazy"
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>

        {/* Divider handle */}
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-background"
          style={{ insetInlineStart: `${position}%` }}
        />

        <span className="pointer-events-none absolute top-2 start-2 rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium">
          {beforeLabel}
        </span>
        <span className="pointer-events-none absolute top-2 end-2 rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium">
          {afterLabel}
        </span>
      </div>

      <label htmlFor={sliderId} className="sr-only">
        {`${beforeLabel} / ${afterLabel} slider`}
      </label>
      <input
        id={sliderId}
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}
