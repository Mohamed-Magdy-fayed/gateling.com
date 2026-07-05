"use client";

import { useMemo } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/features/core/i18n/client";

export type EntityAuditRecord = {
  id: string;
  createdAt?: Date | string | null;
  createdBy?: string | null;
  updatedAt?: Date | string | null;
  updatedBy?: string | null;
  deletedAt?: Date | string | null;
  deletedBy?: string | null;
};

type EntityAuditInfoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: EntityAuditRecord | null;
};

function AuditRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] items-start gap-2 py-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-words text-foreground">{value}</span>
    </div>
  );
}

export function EntityAuditInfoDialog({
  open,
  onOpenChange,
  record,
}: EntityAuditInfoDialogProps) {
  const { t, locale } = useTranslation();
  const dateTimeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale],
  );

  if (!record) return null;

  const dash = "—";
  const formatDate = (value: Date | string | null | undefined) => {
    if (!value) return dash;
    return dateTimeFmt.format(new Date(value));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("systemPages.auditInfoTitle")}</DialogTitle>
          <DialogDescription>
            {t("systemPages.auditInfoDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="divide-y divide-border">
          <AuditRow
            label={t("dataTable.id")}
            value={<code className="text-[0.7rem]">{record.id}</code>}
          />
          <AuditRow
            label={t("common.createdAt")}
            value={formatDate(record.createdAt)}
          />
          {record.createdBy !== undefined ? (
            <AuditRow
              label={t("common.createdBy")}
              value={record.createdBy ?? dash}
            />
          ) : null}
          <AuditRow
            label={t("common.updatedAt")}
            value={formatDate(record.updatedAt)}
          />
          {record.updatedBy !== undefined ? (
            <AuditRow
              label={t("common.updatedBy")}
              value={record.updatedBy ?? dash}
            />
          ) : null}
          {record.deletedAt ? (
            <>
              <AuditRow
                label={t("common.deletedAt")}
                value={formatDate(record.deletedAt)}
              />
              <AuditRow
                label={t("common.deletedBy")}
                value={record.deletedBy ?? dash}
              />
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
