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
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/features/core/i18n/client";
import { ROI_CALCULATOR_DEFAULTS } from "@/features/system/shared/content-blocks";
import type { EditorBlock } from "../block-defaults";

type Props = {
  block: EditorBlock<"roi_embed">;
  onChange: (next: EditorBlock<"roi_embed">) => void;
  disabled?: boolean;
};

/** Parses a number input, treating an empty field as "fall back to default". */
function parseOptionalNumber(value: string): number | undefined {
  return value === "" ? undefined : Number(value);
}

export function RoiEmbedBlockForm({ block, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const { data } = block;

  const update = (patch: Partial<typeof data>) =>
    onChange({ ...block, data: { ...data, ...patch } });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t("blocks.roiEmbedDescription" as never)}
      </p>

      <Field orientation="horizontal">
        <FieldLabel>{t("blocks.roiShowCta" as never)}</FieldLabel>
        <Switch
          checked={data.showCta ?? true}
          onCheckedChange={(checked) => update({ showCta: checked })}
          disabled={disabled}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel>{t("blocks.roiTeamSize" as never)}</FieldLabel>
          <Input
            type="number"
            min={1}
            value={data.teamSize ?? ROI_CALCULATOR_DEFAULTS.teamSize}
            onChange={(e) =>
              update({ teamSize: parseOptionalNumber(e.target.value) })
            }
            disabled={disabled}
          />
        </Field>

        <Field>
          <FieldLabel>{t("blocks.roiHoursPerWeek" as never)}</FieldLabel>
          <Input
            type="number"
            min={1}
            value={data.hoursPerWeek ?? ROI_CALCULATOR_DEFAULTS.hoursPerWeek}
            onChange={(e) =>
              update({ hoursPerWeek: parseOptionalNumber(e.target.value) })
            }
            disabled={disabled}
          />
        </Field>

        <Field>
          <FieldLabel>{t("blocks.roiHourlyRate" as never)}</FieldLabel>
          <Input
            type="number"
            min={1}
            value={data.hourlyRate ?? ROI_CALCULATOR_DEFAULTS.hourlyRate}
            onChange={(e) =>
              update({ hourlyRate: parseOptionalNumber(e.target.value) })
            }
            disabled={disabled}
          />
        </Field>

        <Field>
          <FieldLabel>{t("blocks.roiCurrency" as never)}</FieldLabel>
          <Select
            value={data.currency ?? ROI_CALCULATOR_DEFAULTS.currency}
            onValueChange={(v) => update({ currency: v as "EGP" | "USD" })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EGP">EGP</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}
