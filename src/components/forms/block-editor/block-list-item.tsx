"use client";

import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/core/i18n/client";
import type { BlockType } from "@/features/system/shared/content-blocks";
import type { EditorBlock } from "./block-defaults";
import { BeforeAfterBlockForm } from "./block-forms/before-after-block-form";
import { CalloutBlockForm } from "./block-forms/callout-block-form";
import { ComparisonBlockForm } from "./block-forms/comparison-block-form";
import { CtaBlockForm } from "./block-forms/cta-block-form";
import { DevicePlayerBlockForm } from "./block-forms/device-player-block-form";
import { GalleryBlockForm } from "./block-forms/gallery-block-form";
import { HeadingBlockForm } from "./block-forms/heading-block-form";
import { ImageBlockForm } from "./block-forms/image-block-form";
import { ListBlockForm } from "./block-forms/list-block-form";
import { ParagraphBlockForm } from "./block-forms/paragraph-block-form";
import { QuoteBlockForm } from "./block-forms/quote-block-form";
import { RoiEmbedBlockForm } from "./block-forms/roi-embed-block-form";
import { StatsBlockForm } from "./block-forms/stats-block-form";
import { VideoBlockForm } from "./block-forms/video-block-form";

type Props = {
  block: EditorBlock;
  index: number;
  count: number;
  onChange: (next: EditorBlock) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  disabled?: boolean;
};

const blockTypeLabelKeys: Record<BlockType, string> = {
  heading: "blocks.typeHeading",
  paragraph: "blocks.typeParagraph",
  list: "blocks.typeList",
  quote: "blocks.typeQuote",
  image: "blocks.typeImage",
  video: "blocks.typeVideo",
  gallery: "blocks.typeGallery",
  before_after: "blocks.typeBeforeAfter",
  device_player: "blocks.typeDevicePlayer",
  stats: "blocks.typeStats",
  comparison: "blocks.typeComparison",
  roi_embed: "blocks.typeRoiEmbed",
  callout: "blocks.typeCallout",
  cta: "blocks.typeCta",
};

function BlockForm({
  block,
  onChange,
  disabled,
}: {
  block: EditorBlock;
  onChange: (next: EditorBlock) => void;
  disabled?: boolean;
}) {
  switch (block.type) {
    case "heading":
      return (
        <HeadingBlockForm
          block={block as EditorBlock<"heading">}
          onChange={onChange as never}
          disabled={disabled}
        />
      );
    case "paragraph":
      return (
        <ParagraphBlockForm
          block={block as EditorBlock<"paragraph">}
          onChange={onChange as never}
          disabled={disabled}
        />
      );
    case "list":
      return (
        <ListBlockForm
          block={block as EditorBlock<"list">}
          onChange={onChange as never}
          disabled={disabled}
        />
      );
    case "quote":
      return (
        <QuoteBlockForm
          block={block as EditorBlock<"quote">}
          onChange={onChange as never}
          disabled={disabled}
        />
      );
    case "image":
      return (
        <ImageBlockForm
          block={block as EditorBlock<"image">}
          onChange={onChange as never}
          disabled={disabled}
        />
      );
    case "video":
      return (
        <VideoBlockForm
          block={block as EditorBlock<"video">}
          onChange={onChange as never}
          disabled={disabled}
        />
      );
    case "gallery":
      return (
        <GalleryBlockForm
          block={block as EditorBlock<"gallery">}
          onChange={onChange as never}
          disabled={disabled}
        />
      );
    case "before_after":
      return (
        <BeforeAfterBlockForm
          block={block as EditorBlock<"before_after">}
          onChange={onChange as never}
          disabled={disabled}
        />
      );
    case "device_player":
      return (
        <DevicePlayerBlockForm
          block={block as EditorBlock<"device_player">}
          onChange={onChange as never}
          disabled={disabled}
        />
      );
    case "stats":
      return (
        <StatsBlockForm
          block={block as EditorBlock<"stats">}
          onChange={onChange as never}
          disabled={disabled}
        />
      );
    case "comparison":
      return (
        <ComparisonBlockForm
          block={block as EditorBlock<"comparison">}
          onChange={onChange as never}
          disabled={disabled}
        />
      );
    case "roi_embed":
      return (
        <RoiEmbedBlockForm
          block={block as EditorBlock<"roi_embed">}
          onChange={onChange as never}
          disabled={disabled}
        />
      );
    case "callout":
      return (
        <CalloutBlockForm
          block={block as EditorBlock<"callout">}
          onChange={onChange as never}
          disabled={disabled}
        />
      );
    case "cta":
      return (
        <CtaBlockForm
          block={block as EditorBlock<"cta">}
          onChange={onChange as never}
          disabled={disabled}
        />
      );
    default:
      return null;
  }
}

export function BlockListItem({
  block,
  index,
  count,
  onChange,
  onRemove,
  onMove,
  disabled,
}: Props) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="block-editor-item"
      data-block-type={block.type}
      className="rounded-xl border bg-background p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <Badge variant="secondary">
          {t(blockTypeLabelKeys[block.type] as never)}
        </Badge>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled || index === 0}
            onClick={() => onMove(-1)}
            aria-label={String(t("galleryManager.moveUp" as never))}
          >
            <ArrowUpIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled || index === count - 1}
            onClick={() => onMove(1)}
            aria-label={String(t("galleryManager.moveDown" as never))}
          >
            <ArrowDownIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
            aria-label={String(t("blocks.removeBlock" as never))}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      </div>
      <BlockForm block={block} onChange={onChange} disabled={disabled} />
    </div>
  );
}
