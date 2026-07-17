import {
  type BlockDataByType,
  type BlockItemInput,
  type BlockType,
  ROI_CALCULATOR_DEFAULTS,
} from "@/features/system/shared/content-blocks";

/** Local editor-side block shape: same as BlockItemInput but `data` narrowed per type. */
export type EditorBlock<T extends BlockType = BlockType> = Omit<
  BlockItemInput,
  "type" | "data"
> & {
  type: T;
  data: BlockDataByType[T];
};

export const blockTypeOrder: BlockType[] = [
  "heading",
  "paragraph",
  "list",
  "quote",
  "image",
  "video",
  "gallery",
  "before_after",
  "device_player",
  "stats",
  "comparison",
  "roi_embed",
  "callout",
  "cta",
];

export function defaultBlockData<T extends BlockType>(
  type: T,
): BlockDataByType[T] {
  const defaults: BlockDataByType = {
    heading: { level: 2 },
    paragraph: {},
    list: { ordered: false, itemsEn: [""], itemsAr: [] },
    quote: {},
    image: { url: "" },
    video: { url: "" },
    gallery: { items: [] },
    before_after: { beforeUrl: "", afterUrl: "" },
    device_player: { device: "browser", videoUrl: "" },
    stats: { items: [{ labelEn: "", value: "" }] },
    comparison: { rows: [] },
    roi_embed: { showCta: true, ...ROI_CALCULATOR_DEFAULTS },
    callout: { variant: "info" },
    cta: { labelEn: "", href: "" },
  };
  return defaults[type];
}

export function createNewBlock(
  type: BlockType,
  sortOrder: number,
): EditorBlock {
  return {
    type,
    sortOrder,
    contentEn: "",
    contentAr: "",
    data: defaultBlockData(type) as BlockDataByType[BlockType],
    mediaId: null,
  } as EditorBlock;
}
