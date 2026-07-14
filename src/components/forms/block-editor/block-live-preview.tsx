"use client";

import { BlockRenderer } from "@/components/blocks/block-renderer";
import { useTranslation } from "@/features/core/i18n/client";
import type { EditorBlock } from "./block-defaults";

/** Renders the in-memory blocks array through the real BlockRenderer — not a mock. */
export function BlockLivePreview({ blocks }: { blocks: EditorBlock[] }) {
  const { locale } = useTranslation();

  return (
    <div
      data-testid="block-live-preview"
      className="rounded-xl border bg-muted/20 p-6"
    >
      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing to preview yet — add a block to see it rendered here.
        </p>
      ) : (
        <BlockRenderer blocks={blocks} locale={locale === "ar" ? "ar" : "en"} />
      )}
    </div>
  );
}
