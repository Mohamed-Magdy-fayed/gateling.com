import { LinkButton } from "@/components/general/link-button";
import type { BlockDataByType } from "@/features/system/shared/content-blocks";
import type { BlockRendererItemProps } from "../block-renderer";
import { isSafeHref } from "../safe-url";

type Props = BlockRendererItemProps<BlockDataByType["cta"]>;

export function CtaBlock({ data, locale }: Props) {
  if (!data.labelEn || !isSafeHref(data.href)) return null;

  const label = locale === "ar" ? (data.labelAr ?? data.labelEn) : data.labelEn;

  return (
    <div className="flex justify-center py-2">
      <LinkButton href={data.href} size="lg">
        {label}
      </LinkButton>
    </div>
  );
}
