"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import {
  createEntityActionsColumn,
  DataTableColumnHeader,
} from "@/features/core/data-table";
import type { useTranslation } from "@/features/core/i18n/client";
import type { Booking } from "@/integrations/trpc/routers/bookings";

import {
  BookingRowActions,
  type SetBookingRowAction,
} from "./booking-row-actions";

type Translate = ReturnType<typeof useTranslation>["t"];

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  requested: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  completed: "outline",
  no_show: "outline",
};

export function buildBookingColumns(opts: {
  t: Translate;
  locale: string;
  setRowAction: SetBookingRowAction;
}): ColumnDef<Booking>[] {
  const { t, locale, setRowAction } = opts;
  const dateTimeFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return [
    {
      accessorKey: "startsAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("bookings.startsAt")} />
      ),
      meta: { label: t("bookings.startsAt") },
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-medium">
          {dateTimeFmt.format(row.original.startsAt)}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("bookings.name")} />
      ),
      meta: { label: t("bookings.name"), filterVariant: "text" },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("bookings.email")} />
      ),
      meta: { label: t("bookings.email"), filterVariant: "text" },
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("bookings.phone")} />
      ),
      meta: { label: t("bookings.phone") },
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("bookings.status")} />
      ),
      meta: { label: t("bookings.status") },
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status] ?? "secondary"}>
          {t(`bookings.statusValues.${row.original.status}`)}
        </Badge>
      ),
    },
    {
      accessorKey: "timezone",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("bookings.timezoneCol")}
        />
      ),
      meta: { label: t("bookings.timezoneCol") },
      cell: ({ row }) => row.original.timezone ?? "—",
    },
    {
      accessorKey: "customerNote",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("bookings.note")} />
      ),
      meta: { label: t("bookings.note") },
      cell: ({ row }) => (
        <span className="block max-w-[220px] truncate text-sm">
          {row.original.customerNote ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("bookings.createdAt")}
        />
      ),
      meta: { label: t("bookings.createdAt") },
      cell: ({ row }) => dateTimeFmt.format(row.original.createdAt),
    },
    createEntityActionsColumn({
      t,
      size: 48,
      cell: ({ row }) => (
        <BookingRowActions row={row.original} setRowAction={setRowAction} />
      ),
    }),
  ];
}
