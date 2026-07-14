"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/features/core/i18n/client";
import type { EditorBlock } from "../block-defaults";

type Props = {
  block: EditorBlock<"comparison">;
  onChange: (next: EditorBlock<"comparison">) => void;
  disabled?: boolean;
};

export function ComparisonBlockForm({ block, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const rows = block.data.rows;

  function updateRow(index: number, patch: Partial<(typeof rows)[number]>) {
    const next = [...rows];
    const current = next[index];
    if (!current) return;
    next[index] = { ...current, ...patch };
    onChange({ ...block, data: { rows: next } });
  }

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: reordering not supported for comparison rows
          key={index}
          className="space-y-2 rounded-lg border p-2"
        >
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
            <Input
              value={row.featureEn}
              onChange={(e) => updateRow(index, { featureEn: e.target.value })}
              disabled={disabled}
              placeholder="Feature (EN)"
            />
            <Input
              value={row.manualEn}
              onChange={(e) => updateRow(index, { manualEn: e.target.value })}
              disabled={disabled}
              placeholder="Manual (EN)"
            />
            <Input
              value={row.automatedEn}
              onChange={(e) =>
                updateRow(index, { automatedEn: e.target.value })
              }
              disabled={disabled}
              placeholder="Automated (EN)"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() =>
                onChange({
                  ...block,
                  data: { rows: rows.filter((_, i) => i !== index) },
                })
              }
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2" dir="rtl">
            <Input
              value={row.featureAr ?? ""}
              onChange={(e) => updateRow(index, { featureAr: e.target.value })}
              disabled={disabled}
              placeholder="الميزة (AR)"
            />
            <Input
              value={row.manualAr ?? ""}
              onChange={(e) => updateRow(index, { manualAr: e.target.value })}
              disabled={disabled}
              placeholder="يدوي (AR)"
            />
            <Input
              value={row.automatedAr ?? ""}
              onChange={(e) =>
                updateRow(index, { automatedAr: e.target.value })
              }
              disabled={disabled}
              placeholder="آلي (AR)"
            />
            <div />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() =>
          onChange({
            ...block,
            data: {
              rows: [...rows, { featureEn: "", manualEn: "", automatedEn: "" }],
            },
          })
        }
      >
        <PlusIcon className="me-1 size-3.5" />
        {t("blocks.addComparisonRow" as never)}
      </Button>
    </div>
  );
}
