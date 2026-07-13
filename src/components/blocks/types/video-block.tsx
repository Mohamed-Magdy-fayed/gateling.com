import { toEmbedUrl } from "@/components/general/media-section";
import type { BlockDataByType } from "@/features/system/shared/content-blocks";
import type { BlockRendererItemProps } from "../block-renderer";

type Props = BlockRendererItemProps<BlockDataByType["video"]>;

export function VideoBlock({ data, locale }: Props) {
  const embedUrl = data.url ? toEmbedUrl(data.url) : "";
  if (!embedUrl) return null;

  const caption =
    locale === "ar" ? (data.captionAr ?? data.caption) : data.caption;

  return (
    <figure className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
        <iframe
          src={embedUrl}
          title={caption ?? "video"}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
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
