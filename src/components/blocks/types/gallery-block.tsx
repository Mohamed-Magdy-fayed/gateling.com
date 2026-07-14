import Image from "next/image";
import { toEmbedUrl } from "@/components/general/media-section";
import type { BlockDataByType } from "@/features/system/shared/content-blocks";
import type { BlockRendererItemProps } from "../block-renderer";

type Props = BlockRendererItemProps<BlockDataByType["gallery"]>;

export function GalleryBlock({ data }: Props) {
  if (!data.items || data.items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {data.items.map((item, index) => {
        const embedUrl = item.type === "video" ? toEmbedUrl(item.url) : "";
        if (item.type === "video" && !embedUrl) return null;
        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static content list, no stable ID
            key={index}
            className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted"
          >
            {item.type === "video" ? (
              <iframe
                src={embedUrl}
                title={item.alt ?? "video"}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <Image
                src={item.url}
                alt={item.alt ?? ""}
                fill
                loading="lazy"
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            )}
            {item.caption && (
              <span className="absolute inset-x-0 bottom-0 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground">
                {item.caption}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
