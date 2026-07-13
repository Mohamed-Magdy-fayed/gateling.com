"use client";

import Image from "next/image";
import { MediaUploadButton } from "@/components/forms/block-editor/media-upload-button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/features/core/i18n/client";
import type { EditorBlock } from "../block-defaults";

type Props = {
  block: EditorBlock<"image">;
  onChange: (next: EditorBlock<"image">) => void;
  disabled?: boolean;
};

export function ImageBlockForm({ block, onChange, disabled }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <Field>
        <FieldLabel>{t("blocks.imageUrl" as never)}</FieldLabel>
        <div className="flex items-center gap-2">
          <Input
            value={block.data.url}
            onChange={(e) =>
              onChange({
                ...block,
                data: { ...block.data, url: e.target.value },
              })
            }
            disabled={disabled}
            placeholder="https://..."
            className="flex-1"
          />
          <MediaUploadButton
            disabled={disabled}
            onUploaded={(url) =>
              onChange({ ...block, data: { ...block.data, url } })
            }
          />
        </div>
        {block.data.url && (
          <div className="relative mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-lg border">
            <Image
              src={block.data.url}
              alt=""
              fill
              className="object-cover"
              sizes="320px"
            />
          </div>
        )}
      </Field>

      <Tabs defaultValue="en">
        <TabsList>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="ar">العربية</TabsTrigger>
        </TabsList>
        <TabsContent value="en" className="space-y-3">
          <Field>
            <FieldLabel>{t("blocks.imageAlt" as never)}</FieldLabel>
            <Input
              value={block.data.alt ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  data: { ...block.data, alt: e.target.value },
                })
              }
              disabled={disabled}
            />
          </Field>
          <Field>
            <FieldLabel>{t("blocks.imageCaption" as never)}</FieldLabel>
            <Input
              value={block.data.caption ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  data: { ...block.data, caption: e.target.value },
                })
              }
              disabled={disabled}
            />
          </Field>
        </TabsContent>
        <TabsContent value="ar" dir="rtl" className="space-y-3">
          <Field>
            <FieldLabel>{t("blocks.imageAlt" as never)}</FieldLabel>
            <Input
              value={block.data.altAr ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  data: { ...block.data, altAr: e.target.value },
                })
              }
              disabled={disabled}
            />
          </Field>
          <Field>
            <FieldLabel>{t("blocks.imageCaption" as never)}</FieldLabel>
            <Input
              value={block.data.captionAr ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  data: { ...block.data, captionAr: e.target.value },
                })
              }
              disabled={disabled}
            />
          </Field>
        </TabsContent>
      </Tabs>
    </div>
  );
}
