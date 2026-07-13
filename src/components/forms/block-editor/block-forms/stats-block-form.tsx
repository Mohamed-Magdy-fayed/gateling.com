"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/features/core/i18n/client";
import type { EditorBlock } from "../block-defaults";

type Props = {
  block: EditorBlock<"stats">;
  onChange: (next: EditorBlock<"stats">) => void;
  disabled?: boolean;
};

export function StatsBlockForm({ block, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const items = block.data.items;

  function updateItem(index: number, patch: Partial<(typeof items)[number]>) {
    const next = [...items];
    const current = next[index];
    if (!current) return;
    next[index] = { ...current, ...patch };
    onChange({ ...block, data: { items: next } });
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: reordering not supported for stat items
        <div key={index} className="flex gap-2">
          <Input
            value={item.value}
            onChange={(e) => updateItem(index, { value: e.target.value })}
            disabled={disabled}
            placeholder="70%"
            className="w-24"
          />
          <Input
            value={item.labelEn}
            onChange={(e) => updateItem(index, { labelEn: e.target.value })}
            disabled={disabled}
            placeholder="Label (EN)"
            className="flex-1"
          />
          <Input
            value={item.labelAr ?? ""}
            onChange={(e) => updateItem(index, { labelAr: e.target.value })}
            disabled={disabled}
            placeholder="Label (AR)"
            className="flex-1"
            dir="rtl"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() =>
              onChange({
                ...block,
                data: { items: items.filter((_, i) => i !== index) },
              })
            }
          >
            <Trash2Icon className="size-3.5" />
          </Button>
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
            data: { items: [...items, { labelEn: "", value: "" }] },
          })
        }
      >
        <PlusIcon className="me-1 size-3.5" />
        {t("blocks.addStat" as never)}
      </Button>
    </div>
  );
}
