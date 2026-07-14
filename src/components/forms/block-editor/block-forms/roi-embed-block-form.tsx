"use client";

import { useTranslation } from "@/features/core/i18n/client";

/** roi_embed has no editable fields (data: Record<string, never>) — informational only. */
export function RoiEmbedBlockForm() {
  const { t } = useTranslation();
  return (
    <p className="text-sm text-muted-foreground">
      {t("blocks.roiEmbedDescription" as never)}
    </p>
  );
}
