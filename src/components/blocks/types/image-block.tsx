import Image from "next/image";
import type { BlockDataByType } from "@/features/system/shared/content-blocks";
import type { BlockRendererItemProps } from "../block-renderer";

type Props = BlockRendererItemProps<BlockDataByType["image"]>;

export function ImageBlock({ data, locale }: Props) {
  if (!data.url) return null;

  const alt = (locale === "ar" ? (data.altAr ?? data.alt) : data.alt) ?? "";
  const caption =
    locale === "ar" ? (data.captionAr ?? data.caption) : data.caption;

  return (
    <figure className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl">
        <Image
          src={data.url}
          alt={alt}
          fill
          loading="lazy"
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1200px"
        />
      </div>
      {caption && (
        <figcaption className="text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
