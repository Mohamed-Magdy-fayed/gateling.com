import { QuoteIcon } from "lucide-react";
import type { BlockDataByType } from "@/features/system/shared/content-blocks";
import type { BlockRendererItemProps } from "../block-renderer";
import { renderInline } from "../inline-markdown";

type Props = BlockRendererItemProps<BlockDataByType["quote"]>;

export function QuoteBlock({ contentEn, contentAr, data, locale }: Props) {
  const text = locale === "ar" ? (contentAr ?? contentEn) : contentEn;
  if (!text) return null;

  const cite = locale === "ar" ? (data.citeAr ?? data.citeEn) : data.citeEn;

  return (
    <blockquote className="relative rounded-xl border-s-4 border-primary bg-muted/30 ps-6 pe-4 py-4">
      <QuoteIcon className="absolute top-4 start-2 h-4 w-4 text-primary/60" />
      <p className="text-lg font-medium italic leading-relaxed text-foreground">
        {renderInline(text)}
      </p>
      {cite && (
        <footer className="mt-3 text-sm text-muted-foreground">— {cite}</footer>
      )}
    </blockquote>
  );
}
