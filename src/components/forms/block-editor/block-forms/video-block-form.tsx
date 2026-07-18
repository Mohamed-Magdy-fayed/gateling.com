"use client";

import { MediaUploadButton } from "@/components/forms/block-editor/media-upload-button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/features/core/i18n/client";
import type { EditorBlock } from "../block-defaults";

type Props = {
  block: EditorBlock<"video">;
  onChange: (next: EditorBlock<"video">) => void;
  disabled?: boolean;
};

export function VideoBlockForm({ block, onChange, disabled }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <Field>
        <FieldLabel>{t("blocks.videoUrl" as never)}</FieldLabel>
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
            placeholder="https://youtube.com/watch?v=..."
            className="flex-1"
          />
          <MediaUploadButton
            accept="video/*"
            label={String(t("blocks.uploadVideo" as never))}
            disabled={disabled}
            onUploaded={(url) =>
              onChange({ ...block, data: { ...block.data, url } })
            }
          />
        </div>
      </Field>

      <Field>
        <FieldLabel>{t("blocks.videoOrientation" as never)}</FieldLabel>
        <Select
          value={block.data.orientation ?? "landscape"}
          onValueChange={(v) =>
            onChange({
              ...block,
              data: {
                ...block.data,
                orientation: v as "landscape" | "portrait",
              },
            })
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="landscape">
              {t("blocks.videoLandscape" as never)}
            </SelectItem>
            <SelectItem value="portrait">
              {t("blocks.videoPortrait" as never)}
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Tabs defaultValue="en">
        <TabsList>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="ar">العربية</TabsTrigger>
        </TabsList>
        <TabsContent value="en">
          <Field>
            <FieldLabel>{t("blocks.videoCaption" as never)}</FieldLabel>
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
        <TabsContent value="ar" dir="rtl">
          <Field>
            <FieldLabel>{t("blocks.videoCaption" as never)}</FieldLabel>
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
