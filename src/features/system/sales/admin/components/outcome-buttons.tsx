"use client";

import { type Ref, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/features/core/i18n/client";
import {
  instantToWallClock,
  presetTimes,
  wallClockToInstant,
} from "@/features/system/sales/lib/day-window";
import type { Outcome } from "@/features/system/sales/lib/outcomes";
import { DEFAULT_BUSINESS_TIMEZONE } from "@/features/system/settings/lib/system-settings-registry";
import { cn } from "@/lib/utils";

type OutcomeButtonsProps = {
  outcomes: readonly Outcome[];
  /** Before the call starts the row is shown, but muted. */
  promoted: boolean;
  prompt: string;
  /** The outcome waiting on a time; the row is disabled meanwhile. */
  pendingId: string | null;
  disabled: boolean;
  onSelect: (outcome: Outcome) => void;
  firstRef?: Ref<HTMLButtonElement>;
};

/**
 * One tap per outcome. Terminal outcomes come last and read as destructive;
 * digit hints match the `1`–`9` shortcuts and hide on touch screens.
 */
export function OutcomeButtons({
  outcomes,
  promoted,
  prompt,
  pendingId,
  disabled,
  onSelect,
  firstRef,
}: OutcomeButtonsProps) {
  const { t } = useTranslation();
  const promptId = useId();

  return (
    <div className="flex flex-col gap-2">
      <p
        id={promptId}
        className={cn("text-sm", promoted ? "font-medium" : "text-muted-foreground")}
      >
        {prompt}
      </p>
      <div
        role="group"
        aria-describedby={promptId}
        className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
      >
        {outcomes.map((outcome, index) => (
          <Button
            key={outcome.id}
            ref={index === 0 ? firstRef : undefined}
            type="button"
            size="lg"
            variant={promoted ? "outline" : "ghost"}
            disabled={disabled || pendingId !== null}
            aria-pressed={pendingId === outcome.id || undefined}
            aria-keyshortcuts={String(index + 1)}
            onClick={() => onSelect(outcome)}
            className={cn(
              "justify-between max-sm:min-h-11",
              !promoted && "text-muted-foreground",
              outcome.terminal && "text-destructive hover:bg-destructive/10",
              outcome.terminal && promoted && "border-destructive/40",
            )}
          >
            {t("sales.outcome", { outcome: outcome.id })}
            <kbd
              dir="ltr"
              className="rounded-sm border px-1 font-mono text-[0.625rem] text-muted-foreground pointer-coarse:hidden"
            >
              {index + 1}
            </kbd>
          </Button>
        ))}
      </div>
    </div>
  );
}

type TimePickerProps = {
  timeZone: string;
  saving: boolean;
  onConfirm: (at: Date) => void;
  onCancel: () => void;
};

/** The zone's localized name ("Egypt Time" / "توقيت مصر"), never a raw IANA id. */
function zoneName(timeZone: string, locale: string): string {
  const part = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "longGeneric" })
    .formatToParts(new Date())
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? timeZone;
}

/**
 * Expands in place under the outcome row. Times are entered and shown in the
 * business timezone; past presets are hidden and a past custom time is
 * refused, so a promise can never be born overdue.
 */
export function OutcomeTimePicker({ timeZone, saving, onConfirm, onCancel }: TimePickerProps) {
  const { t, locale } = useTranslation();
  const fieldId = useId();
  const errorId = useId();
  const now = new Date();
  const presets = presetTimes(now, timeZone);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<"timeRequired" | "timeInPast" | null>(null);
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function confirmCustom() {
    const at = wallClockToInstant(custom, timeZone);
    if (!at) return setError("timeRequired");
    if (at.getTime() <= Date.now()) return setError("timeInPast");
    setError(null);
    onConfirm(at);
  }

  return (
    <fieldset className="flex flex-col gap-3 border-t pt-3">
      <legend className="sr-only">{t("sales.pickTime")}</legend>
      <p className="font-medium text-sm">{t("sales.pickTime")}</p>

      {presets.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant="outline"
              size="lg"
              disabled={saving}
              onClick={() => onConfirm(preset.at)}
              className="max-sm:min-h-11"
            >
              {t("sales.timePreset", { preset: preset.id })}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">{t("sales.noPresetsLeft")}</p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={fieldId}>{t("sales.customTime")}</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id={fieldId}
            type="datetime-local"
            dir="ltr"
            className="w-auto text-start"
            min={instantToWallClock(now, timeZone)}
            value={custom}
            aria-invalid={error !== null || undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => {
              setCustom(event.target.value);
              setError(null);
            }}
          />
          <Button
            type="button"
            size="lg"
            variant="secondary"
            disabled={saving || !custom}
            onClick={confirmCustom}
          >
            {t("sales.saveOutcome")}
          </Button>
          <Button type="button" size="lg" variant="ghost" onClick={onCancel}>
            {t("sales.cancel")}
          </Button>
        </div>
        {error && (
          <p id={errorId} className="text-destructive text-xs">
            {t(error === "timeInPast" ? "sales.timeInPast" : "sales.timeRequired")}
          </p>
        )}
        {deviceZone !== timeZone && (
          <p className="text-muted-foreground text-xs">
            {t("sales.businessTimeNote", {
              zone:
                timeZone === DEFAULT_BUSINESS_TIMEZONE
                  ? t("sales.cairoTime")
                  : zoneName(timeZone, locale),
            })}
          </p>
        )}
      </div>
    </fieldset>
  );
}
