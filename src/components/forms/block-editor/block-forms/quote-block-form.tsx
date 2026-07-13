"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/features/core/i18n/client";
import type { EditorBlock } from "../block-defaults";

type Props = {
  block: EditorBlock<"quote">;
  onChange: (next: EditorBlock<"quote">) => void;
  disabled?: boolean;
};

export function QuoteBlockForm({ block, onChange, disabled }: Props) {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="en">
      <TabsList>
        <TabsTrigger value="en">English</TabsTrigger>
        <TabsTrigger value="ar">العربية</TabsTrigger>
      </TabsList>
      <TabsContent value="en" className="space-y-3">
        <Field>
          <FieldLabel>{t("blocks.contentEn" as never)}</FieldLabel>
          <Textarea
            rows={3}
            value={block.contentEn ?? ""}
            onChange={(e) => onChange({ ...block, contentEn: e.target.value })}
            disabled={disabled}
          />
        </Field>
        <Field>
          <FieldLabel>{t("blocks.quoteCite" as never)}</FieldLabel>
          <Input
            value={block.data.citeEn ?? ""}
            onChange={(e) =>
              onChange({
                ...block,
                data: { ...block.data, citeEn: e.target.value },
              })
            }
            disabled={disabled}
          />
        </Field>
      </TabsContent>
      <TabsContent value="ar" dir="rtl" className="space-y-3">
        <Field>
          <FieldLabel>{t("blocks.contentAr" as never)}</FieldLabel>
          <Textarea
            rows={3}
            value={block.contentAr ?? ""}
            onChange={(e) => onChange({ ...block, contentAr: e.target.value })}
            disabled={disabled}
          />
        </Field>
        <Field>
          <FieldLabel>{t("blocks.quoteCite" as never)}</FieldLabel>
          <Input
            value={block.data.citeAr ?? ""}
            onChange={(e) =>
              onChange({
                ...block,
                data: { ...block.data, citeAr: e.target.value },
              })
            }
            disabled={disabled}
          />
        </Field>
      </TabsContent>
    </Tabs>
  );
}
