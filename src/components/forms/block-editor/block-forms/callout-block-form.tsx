"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/features/core/i18n/client";
import type { EditorBlock } from "../block-defaults";

type Props = {
  block: EditorBlock<"callout">;
  onChange: (next: EditorBlock<"callout">) => void;
  disabled?: boolean;
};

export function CalloutBlockForm({ block, onChange, disabled }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <Field>
        <FieldLabel>{t("blocks.calloutVariant" as never)}</FieldLabel>
        <Select
          value={block.data.variant}
          onValueChange={(v) =>
            onChange({
              ...block,
              data: { variant: v as "info" | "warning" | "success" | "danger" },
            })
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="info">
              {t("blocks.calloutInfo" as never)}
            </SelectItem>
            <SelectItem value="warning">
              {t("blocks.calloutWarning" as never)}
            </SelectItem>
            <SelectItem value="success">
              {t("blocks.calloutSuccess" as never)}
            </SelectItem>
            <SelectItem value="danger">
              {t("blocks.calloutDanger" as never)}
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
            <FieldLabel>{t("blocks.contentEn" as never)}</FieldLabel>
            <Textarea
              rows={3}
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
            <Textarea
              rows={3}
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
