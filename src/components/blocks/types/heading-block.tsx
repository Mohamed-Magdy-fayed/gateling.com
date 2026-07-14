import type { BlockDataByType } from "@/features/system/shared/content-blocks";
import { cn } from "@/lib/utils";
import type { BlockRendererItemProps } from "../block-renderer";

type Props = BlockRendererItemProps<BlockDataByType["heading"]>;

// Heading typography per level, matching the scale established by
// PageHeading (h1) / SectionHeader's h2 / CardHeading (h3) in
// src/components/ui/containers.tsx — extended down to h4-h6 consistently.
const headingClasses: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: "text-4xl font-bold tracking-tight md:text-5xl",
  2: "text-3xl font-bold tracking-tight md:text-4xl",
  3: "text-2xl font-bold tracking-tight",
  4: "text-xl font-semibold tracking-tight",
  5: "text-lg font-semibold",
  6: "text-base font-semibold",
};

export function HeadingBlock({ contentEn, contentAr, data, locale }: Props) {
  const text = locale === "ar" ? (contentAr ?? contentEn) : contentEn;
  if (!text) return null;

  const level = data.level ?? 2;
  const Tag = `h${level}` as const;

  return <Tag className={cn(headingClasses[level])}>{text}</Tag>;
}
