"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/features/core/i18n/client";
import type { EditorBlock } from "../block-defaults";

type Props = {
  block: EditorBlock<"list">;
  onChange: (next: EditorBlock<"list">) => void;
  disabled?: boolean;
};

function ItemsEditor({
  items,
  onChange,
  disabled,
  dir,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  disabled?: boolean;
  dir?: "rtl";
}) {
  return (
    <div className="space-y-2" dir={dir}>
      {items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: reordering not supported for list items
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[index] = e.target.value;
              onChange(next);
            }}
            disabled={disabled}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
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
        onClick={() => onChange([...items, ""])}
      >
        <PlusIcon className="me-1 size-3.5" />
        Add item
      </Button>
    </div>
  );
}

export function ListBlockForm({ block, onChange, disabled }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <Field orientation="horizontal">
        <FieldLabel>{t("blocks.listOrdered" as never)}</FieldLabel>
        <Switch
          checked={block.data.ordered}
          onCheckedChange={(checked) =>
            onChange({ ...block, data: { ...block.data, ordered: checked } })
          }
          disabled={disabled}
        />
      </Field>

      <Tabs defaultValue="en">
        <TabsList>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="ar">العربية</TabsTrigger>
        </TabsList>
        <TabsContent value="en">
          <ItemsEditor
            items={block.data.itemsEn}
            onChange={(itemsEn) =>
              onChange({ ...block, data: { ...block.data, itemsEn } })
            }
            disabled={disabled}
          />
        </TabsContent>
        <TabsContent value="ar">
          <ItemsEditor
            items={block.data.itemsAr}
            onChange={(itemsAr) =>
              onChange({ ...block, data: { ...block.data, itemsAr } })
            }
            disabled={disabled}
            dir="rtl"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
