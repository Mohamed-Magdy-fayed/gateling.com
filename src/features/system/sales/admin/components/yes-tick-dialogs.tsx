"use client";

import { useId, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/features/core/i18n/client";
import type { YesStep } from "@/features/system/sales/lib/yeses";

/** `datetime-local` wants a local-time string with no zone suffix. */
function toLocalInputValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

/** Tomorrow at noon: ateliers open around midday. */
function defaultDemoTime(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(12, 0, 0, 0);
  return toLocalInputValue(date);
}

/**
 * Ticking "Demo booked" before a demo exists books it: the time is what the
 * Meetings room is provisioned for, so the tick waits for it.
 */
export function DemoTimeDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (at: Date) => void;
}) {
  const { t } = useTranslation();
  const inputId = useId();
  const hintId = useId();
  const [value, setValue] = useState(defaultDemoTime);
  const at = value ? new Date(value) : null;
  const isValid = at !== null && at.getTime() > Date.now();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (at && isValid) onConfirm(at);
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("sales.yeses.demoDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("sales.yeses.demoDialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={inputId}>{t("sales.yeses.demoDialogLabel")}</Label>
            <Input
              id={inputId}
              type="datetime-local"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              aria-invalid={!isValid}
              aria-describedby={hintId}
              required
            />
            <p
              id={hintId}
              className={
                isValid
                  ? "text-muted-foreground text-xs"
                  : "text-destructive text-xs"
              }
            >
              {t("sales.yeses.demoDialogHint")}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!isValid}>
              {t("sales.yeses.demoDialogConfirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * A no on an open lead: record it, and let the operator decide whether the
 * lead is lost. A no now is not always a no forever.
 */
export function NoAnswerDialog({
  step,
  onOpenChange,
  onConfirm,
}: {
  step: YesStep | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (closeLead: boolean) => void;
}) {
  const { t } = useTranslation();
  const label = step ? t("sales.yeses.stepShort", { step }) : "";

  return (
    <AlertDialog open={step !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("sales.yeses.noDialogTitle", { step: label })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("sales.yeses.noDialogDesc")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <Button variant="outline" onClick={() => onConfirm(false)}>
            {t("sales.yeses.noDialogKeep")}
          </Button>
          <AlertDialogAction
            variant="destructive"
            onClick={() => onConfirm(true)}
          >
            {t("sales.yeses.noDialogLost")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
