"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import {
  createEntityActionsColumn,
  createSelectColumn,
  DataTableColumnHeader,
} from "@/features/core/data-table";
import type { useTranslation } from "@/features/core/i18n/client";
import type { CaseStudyRow } from "@/integrations/trpc/routers/case-studies";

import {
  CaseStudyRowActions,
  type SetCaseStudyRowAction,
} from "./case-study-row-actions";

type Translate = ReturnType<typeof useTranslation>["t"];

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "secondary",
  published: "default",
  archived: "outline",
};

export function buildCaseStudyColumns(opts: {
  t: Translate;
  locale: string;
  setRowAction: SetCaseStudyRowAction;
}): ColumnDef<CaseStudyRow>[] {
  const { t, locale, setRowAction } = opts;
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
  });

  return [
    createSelectColumn<CaseStudyRow>(),
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("work.name")} />
      ),
      meta: { label: t("work.name"), filterVariant: "text" },
    },
    {
      accessorKey: "client",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("work.client")}
        />
      ),
      meta: { label: t("work.client"), filterVariant: "text" },
    },
    {
      accessorKey: "industry",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("work.industry")}
        />
      ),
      meta: { label: t("work.industry"), filterVariant: "text" },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("work.status")}
        />
      ),
      meta: { label: t("work.status") },
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status] ?? "secondary"}>
          {t(`work.statusValues.${row.original.status}`)}
        </Badge>
      ),
    },
    {
      accessorKey: "sortOrder",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("work.sortOrder")}
        />
      ),
      meta: { label: t("work.sortOrder") },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("forms.createdAt")}
        />
      ),
      meta: { label: t("forms.createdAt") },
      cell: ({ row }) =>
        row.original.createdAt
          ? dateFmt.format(new Date(row.original.createdAt))
          : "—",
    },
    createEntityActionsColumn({
      t,
      size: 48,
      cell: ({ row }) => (
        <CaseStudyRowActions row={row.original} setRowAction={setRowAction} />
      ),
    }),
  ];
}
