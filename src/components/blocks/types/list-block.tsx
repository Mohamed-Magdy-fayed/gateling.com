import type { BlockDataByType } from "@/features/system/shared/content-blocks";
import type { BlockRendererItemProps } from "../block-renderer";
import { renderInline } from "../inline-markdown";

type Props = BlockRendererItemProps<BlockDataByType["list"]>;

export function ListBlock({ data, locale }: Props) {
  const items =
    locale === "ar" && data.itemsAr?.length ? data.itemsAr : data.itemsEn;
  if (!items || items.length === 0) return null;

  const Tag = data.ordered ? "ol" : "ul";

  return (
    <Tag
      className={
        data.ordered
          ? "list-decimal space-y-2 ps-5 text-base leading-relaxed text-muted-foreground"
          : "list-disc space-y-2 ps-5 text-base leading-relaxed text-muted-foreground"
      }
    >
      {items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static content list, no stable ID
        <li key={index}>{renderInline(item)}</li>
      ))}
    </Tag>
  );
}
