"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  ColumnPinningState,
  RowSelectionState,
  VisibilityState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bookingStatusValues } from "@/drizzle/schema";
import {
  DataTable,
  type DataTableControlledState,
  DataTablePagination,
  DataTableToolbar,
  DataTableViewOptions,
  EntityPageHeader,
  getEntityColumnPinning,
  useDataTable,
  useTableUrlState,
} from "@/features/core/data-table";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import type { Booking } from "@/integrations/trpc/routers/bookings";

import {
  BlackoutsCard,
  BookingCancelDialog,
  type BookingRowActionVariant,
  buildBookingColumns,
} from "./components";

type RowAction = { row: Booking; variant: BookingRowActionVariant } | null;
type StatusFilter = (typeof bookingStatusValues)[number] | "all";

export function BookingsTablePage() {
  const trpc = useTRPC();
  const { t, locale } = useTranslation();

  const {
    pagination,
    sorting,
    columnFilters,
    globalFilter,
    setPagination,
    setSorting,
    setColumnFilters,
    setGlobalFilter,
  } = useTableUrlState({ page: 1, perPage: 20 });

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(() =>
    getEntityColumnPinning(),
  );
  const [rowAction, setRowAction] = useState<RowAction>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const listInput = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      perPage: pagination.pageSize,
      sorting,
      globalFilter: globalFilter || undefined,
      status: statusFilter,
    }),
    [
      globalFilter,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      statusFilter,
    ],
  );

  const { data, isFetching } = useQuery(
    trpc.bookings.list.queryOptions(listInput),
  );

  const controlled = useMemo<DataTableControlledState>(
    () => ({
      pagination,
      onPaginationChange: setPagination,
      sorting,
      onSortingChange: setSorting,
      columnFilters,
      onColumnFiltersChange: setColumnFilters,
      globalFilter,
      onGlobalFilterChange: setGlobalFilter,
      rowSelection,
      onRowSelectionChange: setRowSelection,
      columnVisibility,
      onColumnVisibilityChange: setColumnVisibility,
      columnPinning,
      onColumnPinningChange: setColumnPinning,
    }),
    [
      pagination,
      setPagination,
      sorting,
      setSorting,
      columnFilters,
      setColumnFilters,
      globalFilter,
      setGlobalFilter,
      rowSelection,
      columnVisibility,
      columnPinning,
    ],
  );

  const columns = useMemo(
    () => buildBookingColumns({ t, locale, setRowAction }),
    [t, locale],
  );

  const {
    table,
    globalFilter: resolvedFilter,
    setGlobalFilter: setResolvedFilter,
  } = useDataTable({
    mode: "server",
    data: data?.rows ?? [],
    pageCount: data?.pageCount ?? 1,
    rowCount: data?.total ?? 0,
    columns,
    getRowId: (r) => r.id,
    controlled,
  });

  const closeRowAction = () => setRowAction(null);

  return (
    <div
      className={
        isFetching ? "space-y-4 opacity-80 transition-opacity" : "space-y-4"
      }
    >
      <EntityPageHeader slug="bookings" />
      <DataTable
        table={table}
        toolbar={
          <DataTableToolbar
            table={table}
            globalFilter={resolvedFilter}
            onGlobalFilterChange={setResolvedFilter}
            searchPlaceholder={t("dataTable.searchBookingsHint")}
          >
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as StatusFilter);
                setPagination({ ...pagination, pageIndex: 0 });
              }}
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("bookings.statusFilterAll")}
                </SelectItem>
                {bookingStatusValues.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`bookings.statusValues.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DataTableViewOptions table={table} />
          </DataTableToolbar>
        }
        footer={<DataTablePagination table={table} />}
      />
      <BlackoutsCard />
      <BookingCancelDialog
        open={rowAction?.variant === "cancel"}
        onOpenChange={(open) => {
          if (!open) closeRowAction();
        }}
        booking={rowAction?.variant === "cancel" ? rowAction.row : null}
        onCancelled={closeRowAction}
      />
    </div>
  );
}
