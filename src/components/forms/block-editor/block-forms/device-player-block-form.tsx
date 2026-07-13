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
import { useTranslation } from "@/features/core/i18n/client";
import type { EditorBlock } from "../block-defaults";

type Props = {
  block: EditorBlock<"device_player">;
  onChange: (next: EditorBlock<"device_player">) => void;
  disabled?: boolean;
};

export function DevicePlayerBlockForm({ block, onChange, disabled }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <Field>
        <FieldLabel>{t("blocks.deviceType" as never)}</FieldLabel>
        <Select
          value={block.data.device}
          onValueChange={(v) =>
            onChange({
              ...block,
              data: { ...block.data, device: v as "phone" | "browser" },
            })
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="phone">
              {t("blocks.devicePhone" as never)}
            </SelectItem>
            <SelectItem value="browser">
              {t("blocks.deviceBrowser" as never)}
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>{t("blocks.videoUrl" as never)}</FieldLabel>
        <Input
          value={block.data.videoUrl}
          onChange={(e) =>
            onChange({
              ...block,
              data: { ...block.data, videoUrl: e.target.value },
            })
          }
          disabled={disabled}
          placeholder="https://youtube.com/watch?v=..."
        />
      </Field>
    </div>
  );
}
