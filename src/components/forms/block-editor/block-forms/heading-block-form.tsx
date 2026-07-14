"use client";

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
  block: EditorBlock<"heading">;
  onChange: (next: EditorBlock<"heading">) => void;
  disabled?: boolean;
};

export function HeadingBlockForm({ block, onChange, disabled }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <Field>
        <FieldLabel>{t("blocks.headingLevel" as never)}</FieldLabel>
        <Select
          value={String(block.data.level)}
          onValueChange={(v) =>
            onChange({
              ...block,
              data: { level: Number(v) as 1 | 2 | 3 | 4 | 5 | 6 },
            })
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <SelectItem key={level} value={String(level)}>
                H{level}
              </SelectItem>
            ))}
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
            <FieldLabel>{t("blocks.contentEn" as never)}</FieldLabel>
            <Input
              value={block.contentEn ?? ""}
              onChange={(e) =>
                onChange({ ...block, contentEn: e.target.value })
              }
              disabled={disabled}
            />
          </Field>
        </TabsContent>
        <TabsContent value="ar" dir="rtl">
          <Field>
            <FieldLabel>{t("blocks.contentAr" as never)}</FieldLabel>
            <Input
              value={block.contentAr ?? ""}
              onChange={(e) =>
                onChange({ ...block, contentAr: e.target.value })
              }
              disabled={disabled}
            />
          </Field>
        </TabsContent>
      </Tabs>
    </div>
  );
}
