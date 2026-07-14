"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/features/core/i18n/client";
import type { EditorBlock } from "../block-defaults";

type Props = {
  block: EditorBlock<"paragraph">;
  onChange: (next: EditorBlock<"paragraph">) => void;
  disabled?: boolean;
};

export function ParagraphBlockForm({ block, onChange, disabled }: Props) {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="en">
      <TabsList>
        <TabsTrigger value="en">English</TabsTrigger>
        <TabsTrigger value="ar">العربية</TabsTrigger>
      </TabsList>
      <TabsContent value="en">
        <Field>
          <FieldLabel>{t("blocks.contentEn" as never)}</FieldLabel>
          <Textarea
            rows={4}
            value={block.contentEn ?? ""}
            onChange={(e) => onChange({ ...block, contentEn: e.target.value })}
            disabled={disabled}
            placeholder={String(t("blocks.paragraphPlaceholder" as never))}
          />
        </Field>
      </TabsContent>
      <TabsContent value="ar" dir="rtl">
        <Field>
          <FieldLabel>{t("blocks.contentAr" as never)}</FieldLabel>
          <Textarea
            rows={4}
            value={block.contentAr ?? ""}
            onChange={(e) => onChange({ ...block, contentAr: e.target.value })}
            disabled={disabled}
          />
        </Field>
      </TabsContent>
    </Tabs>
  );
}
