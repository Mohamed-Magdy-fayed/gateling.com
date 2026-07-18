import { getVideoOrientation, toEmbedUrl } from "@/components/general/embed-url";
import type { BlockDataByType } from "@/features/system/shared/content-blocks";
import type { BlockRendererItemProps } from "../block-renderer";
import { isSafeHref } from "../safe-url";

type Props = BlockRendererItemProps<BlockDataByType["video"]>;

export function VideoBlock({ data, locale }: Props) {
  if (!isSafeHref(data.url)) return null;

  // `toEmbedUrl` recognizes third-party hosts (YouTube, Vimeo, …) and returns
  // "" for anything else — including a direct Firebase upload, which then plays
  // natively.
  const embedUrl = toEmbedUrl(data.url);

  const caption =
    locale === "ar" ? (data.captionAr ?? data.caption) : data.caption;

  const isPortrait = data.orientation
    ? data.orientation === "portrait"
    : getVideoOrientation(data.url) === "portrait";

  return (
    <figure className="space-y-2">
      <div
        className={`relative mx-auto w-full overflow-hidden rounded-xl bg-muted ${
          isPortrait ? "aspect-[9/16] max-w-[360px]" : "aspect-video"
        }`}
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={caption ?? "video"}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <video
            src={data.url}
            title={caption ?? "video"}
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full bg-black object-contain"
          >
            <track kind="captions" />
          </video>
        )}
      </div>
      {caption && (
        <figcaption className="text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
