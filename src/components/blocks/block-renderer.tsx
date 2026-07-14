import type { BlockData } from "@/drizzle/schema";
import type { BlockType } from "@/features/system/shared/content-blocks";
import { BeforeAfterBlock } from "./types/before-after-block";
import { CalloutBlock } from "./types/callout-block";
import { ComparisonBlock } from "./types/comparison-block";
import { CtaBlock } from "./types/cta-block";
import { DevicePlayerBlock } from "./types/device-player-block";
import { GalleryBlock } from "./types/gallery-block";
import { HeadingBlock } from "./types/heading-block";
import { ImageBlock } from "./types/image-block";
import { ListBlock } from "./types/list-block";
import { ParagraphBlock } from "./types/paragraph-block";
import { QuoteBlock } from "./types/quote-block";
import { RoiEmbedBlock } from "./types/roi-embed-block";
import { StatsBlock } from "./types/stats-block";
import { VideoBlock } from "./types/video-block";

/**
 * Shape common to blocks fetched from either blogPosts or case-studies
 * `getById`/`publicGetBySlug` queries (see server `blocks: { orderBy: sortOrder }`).
 */
export type BlockRecord = {
  id?: string;
  type: BlockType | string;
  sortOrder: number;
  contentEn?: string | null;
  contentAr?: string | null;
  data?: BlockData | null;
  mediaId?: string | null;
};

export type BlockLocale = "en" | "ar";

export type BlockRendererItemProps<T = BlockData> = {
  contentEn?: string | null;
  contentAr?: string | null;
  data: T;
  locale: BlockLocale;
};

function BlockSwitch({
  block,
  locale,
}: {
  block: BlockRecord;
  locale: BlockLocale;
}) {
  const data = (block.data ?? {}) as BlockData;
  const common = {
    contentEn: block.contentEn,
    contentAr: block.contentAr,
    locale,
  };

  switch (block.type) {
    case "heading":
      return <HeadingBlock {...common} data={data as never} />;
    case "paragraph":
      return <ParagraphBlock {...common} data={data as never} />;
    case "list":
      return <ListBlock {...common} data={data as never} />;
    case "quote":
      return <QuoteBlock {...common} data={data as never} />;
    case "image":
      return <ImageBlock {...common} data={data as never} />;
    case "video":
      return <VideoBlock {...common} data={data as never} />;
    case "gallery":
      return <GalleryBlock {...common} data={data as never} />;
    case "before_after":
      return <BeforeAfterBlock {...common} data={data as never} />;
    case "device_player":
      return <DevicePlayerBlock {...common} data={data as never} />;
    case "stats":
      return <StatsBlock {...common} data={data as never} />;
    case "comparison":
      return <ComparisonBlock {...common} data={data as never} />;
    case "roi_embed":
      return <RoiEmbedBlock />;
    case "callout":
      return <CalloutBlock {...common} data={data as never} />;
    case "cta":
      return <CtaBlock {...common} data={data as never} />;
    default:
      return null;
  }
}

export function BlockRenderer({
  blocks,
  locale,
}: {
  blocks: BlockRecord[];
  locale: BlockLocale;
}) {
  const sorted = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-8">
      {sorted.map((block, index) => (
        <BlockSwitch
          key={block.id ?? `${block.type}-${index}`}
          block={block}
          locale={locale}
        />
      ))}
    </div>
  );
}
