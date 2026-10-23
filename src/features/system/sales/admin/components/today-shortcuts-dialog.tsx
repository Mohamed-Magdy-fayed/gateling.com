"use client";

import { useId } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/features/core/i18n/client";
import { SHORTCUTS } from "@/features/system/sales/lib/today-shortcuts";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
};

/** The `?` panel. Reads the same table the key mapper uses, so it cannot drift. */
export function TodayShortcutsDialog({ open, onOpenChange, enabled, onEnabledChange }: Props) {
  const { t } = useTranslation();
  const switchId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("sales.shortcutsTitle")}</DialogTitle>
          <DialogDescription>{t("sales.shortcutsHint")}</DialogDescription>
        </DialogHeader>
        <dl className="flex flex-col divide-y">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.id} className="flex items-center justify-between gap-4 py-2">
              <dt className="text-sm">{t("sales.shortcut", { id: shortcut.id })}</dt>
              <dd dir="ltr" className="flex shrink-0 gap-1">
                {shortcut.keys.map((key) => (
                  <kbd key={key} className="rounded-sm border px-1.5 font-mono text-xs">
                    {key}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex items-center gap-2">
          <Switch id={switchId} checked={enabled} onCheckedChange={onEnabledChange} />
          <Label htmlFor={switchId}>{t("sales.shortcutsEnabled")}</Label>
        </div>
      </DialogContent>
    </Dialog>
  );
}
