"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
        <Input
          value={block.data.url}
          onChange={(e) =>
            onChange({ ...block, data: { ...block.data, url: e.target.value } })
          }
          disabled={disabled}
          placeholder="https://youtube.com/watch?v=..."
        />
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
