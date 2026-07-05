"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import {
  createEntityActionsColumn,
  createSelectColumn,
  DataTableColumnHeader,
} from "@/features/core/data-table";
import type { useTranslation } from "@/features/core/i18n/client";
import type { Service } from "@/integrations/trpc/routers/services-mgmt";

import {
  ServiceRowActions,
  type SetServiceRowAction,
} from "./service-row-actions";

type Translate = ReturnType<typeof useTranslation>["t"];

export function buildServiceColumns(opts: {
  t: Translate;
  locale: string;
  setRowAction: SetServiceRowAction;
}): ColumnDef<Service>[] {
  const { t, setRowAction } = opts;

  return [
    createSelectColumn<Service>(),
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("services.name")}
        />
      ),
      meta: { label: t("services.name"), filterVariant: "text" },
    },
    {
      accessorKey: "shortDescription",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("services.shortDescription")}
        />
      ),
      meta: { label: t("services.shortDescription") },
      cell: ({ row }) => (
        <span className="block max-w-[240px] truncate text-sm">
          {row.original.shortDescription}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("services.isActive")}
        />
      ),
      meta: { label: t("services.isActive") },
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive
            ? t("common.active")
            : t("common.inactive")}
        </Badge>
      ),
    },
    {
      accessorKey: "sortOrder",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("services.sortOrder")}
        />
      ),
      meta: { label: t("services.sortOrder") },
    },
    createEntityActionsColumn({
      t,
      size: 48,
      cell: ({ row }) => (
        <ServiceRowActions row={row.original} setRowAction={setRowAction} />
      ),
    }),
  ];
}
