"use client";

import type { ColumnDef } from "@tanstack/react-table";

import {
  createEntityActionsColumn,
  DataTableColumnHeader,
} from "@/features/core/data-table";
import type { useTranslation } from "@/features/core/i18n/client";
import type { BranchGridRow } from "@/integrations/trpc/routers/branches";

import {
  BranchRowActions,
  type SetBranchRowAction,
} from "./branch-row-actions";

type Translate = ReturnType<typeof useTranslation>["t"];

export function buildBranchColumns(opts: {
  locale: string;
  setRowAction: SetBranchRowAction;
  t: Translate;
}): ColumnDef<BranchGridRow>[] {
  const { locale, setRowAction, t } = opts;
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return [
    {
      accessorKey: "shortCode",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("systemPages.branchesShortCode")}
        />
      ),
      meta: { label: t("systemPages.branchesShortCode") },
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.shortCode}</span>
      ),
    },
    {
      accessorKey: "nameEn",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("systemPages.branchesNameEn")}
        />
      ),
      meta: { label: t("systemPages.branchesNameEn") },
    },
    {
      accessorKey: "nameAr",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("systemPages.branchesNameAr")}
        />
      ),
      meta: { label: t("systemPages.branchesNameAr") },
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("systemPages.branchesPhone")}
        />
      ),
      meta: { label: t("systemPages.branchesPhone") },
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      accessorKey: "ownerName",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("systemPages.branchesOwner")}
        />
      ),
      meta: { label: t("systemPages.branchesOwner") },
      cell: ({ row }) => row.original.ownerName ?? "—",
    },
    {
      accessorKey: "memberCount",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("systemPages.branchesMemberCount")}
        />
      ),
      meta: { label: t("systemPages.branchesMemberCount") },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("common.createdAt")}
        />
      ),
      meta: { label: t("common.createdAt") },
      cell: ({ row }) =>
        row.original.createdAt
          ? dateFmt.format(new Date(row.original.createdAt))
          : "—",
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("common.updatedAt")}
        />
      ),
      meta: { label: t("common.updatedAt") },
      cell: ({ row }) =>
        row.original.updatedAt
          ? dateFmt.format(new Date(row.original.updatedAt))
          : "—",
    },
    createEntityActionsColumn({
      t,
      size: 48,
      cell: ({ row }) => (
        <BranchRowActions row={row.original} setRowAction={setRowAction} />
      ),
    }),
  ];
}
