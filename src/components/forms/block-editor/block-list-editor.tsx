"use client";

import { useTranslation } from "@/features/core/i18n/client";
import type { BlockType } from "@/features/system/shared/content-blocks";
import { createNewBlock, type EditorBlock } from "./block-defaults";
import { BlockListItem } from "./block-list-item";
import { InsertBlockMenu } from "./insert-block-menu";

type Props = {
  blocks: EditorBlock[];
  onChange: (blocks: EditorBlock[]) => void;
  disabled?: boolean;
};

/**
 * The ordered block list editor shared by the blog-post and case-study
 * full-page editors. Up/down reorder mirrors GalleryManager's convention
 * (src/components/forms/gallery-manager.tsx) — no drag-and-drop dependency.
 */
export function BlockListEditor({ blocks, onChange, disabled }: Props) {
  const { t } = useTranslation();

  function insert(type: BlockType) {
    onChange([...blocks, createNewBlock(type, blocks.length)]);
  }

  function update(index: number, next: EditorBlock) {
    const copy = [...blocks];
    copy[index] = next;
    onChange(copy);
  }

  function remove(index: number) {
    onChange(
      blocks
        .filter((_, i) => i !== index)
        .map((b, i) => ({ ...b, sortOrder: i })),
    );
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [
      next[target] as EditorBlock,
      next[index] as EditorBlock,
    ];
    onChange(next.map((b, i) => ({ ...b, sortOrder: i })));
  }

  return (
    <div className="space-y-4" data-testid="block-list-editor">
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {t("blocks.sectionTitle" as never)}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("blocks.sectionDescription" as never)}
        </p>
      </div>

      {blocks.length === 0 && (
        <p
          data-testid="block-list-empty"
          className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"
        >
          {t("blocks.emptyState" as never)}
        </p>
      )}

      <div className="space-y-3">
        {blocks.map((block, index) => (
          <BlockListItem
            key={block.id ?? `new-${index}`}
            block={block}
            index={index}
            count={blocks.length}
            onChange={(next) => update(index, next)}
            onRemove={() => remove(index)}
            onMove={(direction) => move(index, direction)}
            disabled={disabled}
          />
        ))}
      </div>

      <InsertBlockMenu onInsert={insert} disabled={disabled} />
    </div>
  );
}
