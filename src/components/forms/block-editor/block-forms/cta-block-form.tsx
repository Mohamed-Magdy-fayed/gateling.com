"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/features/core/i18n/client";
import type { EditorBlock } from "../block-defaults";

type Props = {
  block: EditorBlock<"cta">;
  onChange: (next: EditorBlock<"cta">) => void;
  disabled?: boolean;
};

export function CtaBlockForm({ block, onChange, disabled }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <Field>
        <FieldLabel>{t("blocks.ctaHref" as never)}</FieldLabel>
        <Input
          value={block.data.href}
          onChange={(e) =>
            onChange({
              ...block,
              data: { ...block.data, href: e.target.value },
            })
          }
          disabled={disabled}
          placeholder="/contact"
        />
      </Field>

      <Tabs defaultValue="en">
        <TabsList>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="ar">العربية</TabsTrigger>
        </TabsList>
        <TabsContent value="en">
          <Field>
            <FieldLabel>{t("blocks.ctaLabel" as never)}</FieldLabel>
            <Input
              value={block.data.labelEn}
              onChange={(e) =>
                onChange({
                  ...block,
                  data: { ...block.data, labelEn: e.target.value },
                })
              }
              disabled={disabled}
            />
          </Field>
        </TabsContent>
        <TabsContent value="ar" dir="rtl">
          <Field>
            <FieldLabel>{t("blocks.ctaLabel" as never)}</FieldLabel>
            <Input
              value={block.data.labelAr ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  data: { ...block.data, labelAr: e.target.value },
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
