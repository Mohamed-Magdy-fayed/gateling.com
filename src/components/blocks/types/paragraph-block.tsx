import type { BlockDataByType } from "@/features/system/shared/content-blocks";
import type { BlockRendererItemProps } from "../block-renderer";
import { renderInline } from "../inline-markdown";

type Props = BlockRendererItemProps<BlockDataByType["paragraph"]>;

export function ParagraphBlock({ contentEn, contentAr, locale }: Props) {
  const text = locale === "ar" ? (contentAr ?? contentEn) : contentEn;
  if (!text) return null;

  return (
    <p className="text-base leading-relaxed text-muted-foreground">
      {renderInline(text)}
    </p>
  );
}
