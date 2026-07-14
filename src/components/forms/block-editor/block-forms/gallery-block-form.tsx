"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { MediaUploadButton } from "@/components/forms/block-editor/media-upload-button";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/features/core/i18n/client";
import type { EditorBlock } from "../block-defaults";

type Props = {
  block: EditorBlock<"gallery">;
  onChange: (next: EditorBlock<"gallery">) => void;
  disabled?: boolean;
};

export function GalleryBlockForm({ block, onChange, disabled }: Props) {
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
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: reordering not supported for gallery items
          key={index}
          className="flex items-start gap-2 rounded-lg border p-3"
        >
          {item.type === "image" && item.url && (
            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
              <Image
                src={item.url}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex gap-2">
              <Select
                value={item.type}
                onValueChange={(v) =>
                  updateItem(index, { type: v as "image" | "video" })
                }
                disabled={disabled}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">
                    {t("blocks.image" as never)}
                  </SelectItem>
                  <SelectItem value="video">
                    {t("blocks.video" as never)}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={item.url}
                onChange={(e) => updateItem(index, { url: e.target.value })}
                disabled={disabled}
                placeholder="https://..."
                className="flex-1"
              />
              {item.type === "image" && (
                <MediaUploadButton
                  disabled={disabled}
                  onUploaded={(url) => updateItem(index, { url })}
                />
              )}
            </div>
            <Input
              value={item.caption ?? ""}
              onChange={(e) => updateItem(index, { caption: e.target.value })}
              disabled={disabled}
              placeholder={String(t("blocks.imageCaption" as never))}
            />
          </div>
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
            data: { items: [...items, { url: "", type: "image" }] },
          })
        }
      >
        <PlusIcon className="me-1 size-3.5" />
        {t("blocks.addGalleryItem" as never)}
      </Button>
      <Field>
        <FieldLabel className="sr-only">gallery items</FieldLabel>
      </Field>
    </div>
  );
}
