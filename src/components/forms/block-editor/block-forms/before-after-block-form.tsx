"use client";

import { MediaUploadButton } from "@/components/forms/block-editor/media-upload-button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/features/core/i18n/client";
import type { EditorBlock } from "../block-defaults";

type Props = {
  block: EditorBlock<"before_after">;
  onChange: (next: EditorBlock<"before_after">) => void;
  disabled?: boolean;
};

export function BeforeAfterBlockForm({ block, onChange, disabled }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <Field>
        <FieldLabel>{t("blocks.beforeImage" as never)}</FieldLabel>
        <div className="flex gap-2">
          <Input
            value={block.data.beforeUrl}
            onChange={(e) =>
              onChange({
                ...block,
                data: { ...block.data, beforeUrl: e.target.value },
              })
            }
            disabled={disabled}
            placeholder="https://..."
            className="flex-1"
          />
          <MediaUploadButton
            disabled={disabled}
            onUploaded={(url) =>
              onChange({ ...block, data: { ...block.data, beforeUrl: url } })
            }
          />
        </div>
      </Field>
      <Field>
        <FieldLabel>{t("blocks.afterImage" as never)}</FieldLabel>
        <div className="flex gap-2">
          <Input
            value={block.data.afterUrl}
            onChange={(e) =>
              onChange({
                ...block,
                data: { ...block.data, afterUrl: e.target.value },
              })
            }
            disabled={disabled}
            placeholder="https://..."
            className="flex-1"
          />
          <MediaUploadButton
            disabled={disabled}
            onUploaded={(url) =>
              onChange({ ...block, data: { ...block.data, afterUrl: url } })
            }
          />
        </div>
      </Field>

      <Tabs defaultValue="en">
        <TabsList>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="ar">العربية</TabsTrigger>
        </TabsList>
        <TabsContent value="en" className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>{t("blocks.beforeLabel" as never)}</FieldLabel>
            <Input
              value={block.data.beforeLabelEn ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  data: { ...block.data, beforeLabelEn: e.target.value },
                })
              }
              disabled={disabled}
            />
          </Field>
          <Field>
            <FieldLabel>{t("blocks.afterLabel" as never)}</FieldLabel>
            <Input
              value={block.data.afterLabelEn ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  data: { ...block.data, afterLabelEn: e.target.value },
                })
              }
              disabled={disabled}
            />
          </Field>
        </TabsContent>
        <TabsContent value="ar" dir="rtl" className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>{t("blocks.beforeLabel" as never)}</FieldLabel>
            <Input
              value={block.data.beforeLabelAr ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  data: { ...block.data, beforeLabelAr: e.target.value },
                })
              }
              disabled={disabled}
            />
          </Field>
          <Field>
            <FieldLabel>{t("blocks.afterLabel" as never)}</FieldLabel>
            <Input
              value={block.data.afterLabelAr ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  data: { ...block.data, afterLabelAr: e.target.value },
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
