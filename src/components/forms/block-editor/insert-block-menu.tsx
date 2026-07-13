"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/features/core/i18n/client";
import type { BlockType } from "@/features/system/shared/content-blocks";
import { blockTypeOrder } from "./block-defaults";

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

export function InsertBlockMenu({
  onInsert,
  disabled,
}: {
  onInsert: (type: BlockType) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button type="button" variant="outline" disabled={disabled}>
            <PlusIcon className="me-1.5 size-3.5" />
            {t("blocks.addBlock" as never)}
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-56">
        {blockTypeOrder.map((type) => (
          <DropdownMenuItem key={type} onClick={() => onInsert(type)}>
            {t(blockTypeLabelKeys[type] as never)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
