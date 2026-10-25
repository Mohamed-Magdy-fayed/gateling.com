"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ColumnFiltersState,
  ColumnPinningState,
  RowSelectionState,
  VisibilityState,
} from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { H1, Lead } from "@/components/ui/typography";
import type { LeadPipelineStatus } from "@/drizzle/schema";
import {
  DataTable,
  DataTableActionBar,
  type DataTableControlledState,
  DataTableExportButton,
  DataTablePagination,
  DataTableToolbar,
  DataTableViewOptions,
  getEntityColumnPinning,
  serializeColumnFiltersForServer,
  useDataTable,
  useTableUrlState,
} from "@/features/core/data-table";
import { useTranslation } from "@/features/core/i18n/client";
import type { PipelineGridRow } from "@/features/system/sales/server/router";
import { useTRPC } from "@/integrations/trpc/client";

import {
  LeadFormDialog,
  leadToFormValues,
} from "./components/lead-form-dialog";
import { PipelineBulkActions } from "./components/pipeline-bulk-actions";
import { PipelineCounters } from "./components/pipeline-counters";
import { PipelineGridFilters } from "./components/pipeline-grid-filters";
import type { PipelineRowActionVariant } from "./components/pipeline-row-actions";
import {
  buildPipelineColumns,
  PIPELINE_HIDDEN_COLUMNS,
} from "./components/pipeline-table-columns";

type RowAction = {
  row: PipelineGridRow;
  variant: PipelineRowActionVariant;
} | null;

const STATUS_COLUMN = "pipelineStatus";
const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5"];

function statusFilterOf(filters: ColumnFiltersState): string[] {
  const value = filters.find((f) => f.id === STATUS_COLUMN)?.value;
  return Array.isArray(value) ? value.map(String) : [];
}

/**
 * Every prospect, on the shared data-table kit: filters, sorting and paging
 * live in the URL so a refresh or a shared link keeps the view. Day-to-day
 * work happens on `/sales/today`; this is where you search, slice and edit.
 */
export function SalesLeadsTablePage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
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
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => ({ ...PIPELINE_HIDDEN_COLUMNS }),
  );
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(() =>
    getEntityColumnPinning(),
  );
  const [rowAction, setRowAction] = useState<RowAction>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [truncatedAt, setTruncatedAt] = useState<number | null>(null);

  const toFirstPage = useCallback(
    () => setPagination((p) => ({ ...p, pageIndex: 0 })),
    [setPagination],
  );

  /** Filter and search changes start from page one. */
  const onColumnFiltersChange = useCallback<typeof setColumnFilters>(
    (updater) => {
      setColumnFilters(updater);
      toFirstPage();
    },
    [setColumnFilters, toFirstPage],
  );
  const onGlobalFilterChange = useCallback<typeof setGlobalFilter>(
    (updater) => {
      setGlobalFilter(updater);
      toFirstPage();
    },
    [setGlobalFilter, toFirstPage],
  );

  const filterInput = useMemo(
    () => ({
      sorting,
      columnFilters: serializeColumnFiltersForServer(columnFilters),
      globalFilter: globalFilter || undefined,
    }),
    [sorting, columnFilters, globalFilter],
  );

  const listQuery = useQuery(
    trpc.sales.list.queryOptions({
      ...filterInput,
      page: pagination.pageIndex + 1,
      perPage: pagination.pageSize,
    }),
  );
  const { data, isPending, isFetching, isError } = listQuery;

  const controlled = useMemo<DataTableControlledState>(
    () => ({
      pagination,
      onPaginationChange: setPagination,
      sorting,
      onSortingChange: setSorting,
      columnFilters,
      onColumnFiltersChange,
      globalFilter,
      onGlobalFilterChange,
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
      onColumnFiltersChange,
      globalFilter,
      onGlobalFilterChange,
      rowSelection,
      columnVisibility,
      columnPinning,
    ],
  );

  const columns = useMemo(
    () => buildPipelineColumns({ t, locale, setRowAction }),
    [t, locale],
  );

  const {
    table,
    globalFilter: gf,
    setGlobalFilter: setGf,
  } = useDataTable({
    mode: "server",
    data: data?.rows ?? [],
    pageCount: data?.pageCount ?? 1,
    columns,
    getRowId: (r) => r.id,
    controlled,
  });

  const fetchAllRows = useCallback(async () => {
    const result = await queryClient.fetchQuery(
      trpc.sales.exportRows.queryOptions(filterInput),
    );
    setTruncatedAt(result.truncated ? result.limit : null);
    return {
      rows: result.rows,
      fileName: result.truncated
        ? `sales-pipeline-truncated-${result.limit}.csv`
        : "sales-pipeline.csv",
    };
  }, [queryClient, trpc, filterInput]);

  const selectStatuses = useCallback(
    (statuses: LeadPipelineStatus[]) =>
      onColumnFiltersChange((prev) => [
        ...prev.filter((f) => f.id !== STATUS_COLUMN),
        ...(statuses.length ? [{ id: STATUS_COLUMN, value: statuses }] : []),
      ]),
    [onColumnFiltersChange],
  );

  const hasFilters = columnFilters.length > 0 || Boolean(globalFilter);
  const clearFilters = () => {
    onColumnFiltersChange([]);
    onGlobalFilterChange("");
  };

  const emptyState = isPending ? (
    <div className="flex flex-col gap-2" aria-busy="true">
      {SKELETON_ROWS.map((id) => (
        <Skeleton key={id} className="h-8 w-full" />
      ))}
    </div>
  ) : hasFilters ? (
    <div className="flex flex-col items-center gap-2">
      <span>{t("sales.pipelineEmptyFiltered")}</span>
      <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
        {t("sales.clearFilters")}
      </Button>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-2">
      <span className="font-medium text-foreground">
        {t("sales.noLeadsYet")}
      </span>
      <span>{t("sales.pipelineEmptyHint")}</span>
      <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
        <PlusIcon className="size-3.5" aria-hidden />
        {t("sales.newLead")}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <H1>{t("sales.leadsTitle")}</H1>
          <Lead>{t("sales.leadsLead")}</Lead>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-3.5" aria-hidden />
          {t("sales.newLead")}
        </Button>
      </div>

      <PipelineCounters
        statusFilter={statusFilterOf(columnFilters)}
        onSelect={selectStatuses}
      />

      {isError && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {t("sales.pipelineLoadFailed")}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void listQuery.refetch()}
            >
              {t("sales.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div
        className={
          isFetching && !isPending
            ? "opacity-80 transition-opacity"
            : "transition-opacity"
        }
      >
        <DataTable
          table={table}
          emptyState={emptyState}
          toolbar={
            <div className="flex flex-col gap-2">
              <DataTableToolbar
                table={table}
                globalFilter={gf}
                onGlobalFilterChange={(v) => setGf(v)}
                searchPlaceholder={t("sales.searchHint")}
                filterSlot={<PipelineGridFilters table={table} />}
              >
                <DataTableViewOptions table={table} />
                <DataTableExportButton
                  table={table}
                  exportFileName="sales-pipeline.csv"
                  fetchAllRows={fetchAllRows}
                  getExportRow={(row) => ({
                    name: row.nameAr ? `${row.name} / ${row.nameAr}` : row.name,
                    businessType: row.businessType,
                    city: [row.city, row.area].filter(Boolean).join(" · "),
                    phone: row.phone,
                    whatsappStatus: row.whatsappStatus,
                    tier: row.tier,
                    pipelineStatus: row.pipelineStatus,
                    followUpCount: row.followUpCount,
                    lastContactedAt: row.lastContactedAt,
                    nextActionAt: row.nextActionAt,
                    socialFollowers: row.socialFollowers,
                    createdAt: row.createdAt,
                    doNotContact: row.doNotContact,
                  })}
                />
              </DataTableToolbar>
              {truncatedAt !== null && (
                <Alert>
                  <AlertDescription>
                    {t("sales.exportTruncated", { limit: truncatedAt })}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          }
          footer={<DataTablePagination table={table} />}
          actionBar={
            <DataTableActionBar table={table}>
              <PipelineBulkActions table={table} />
            </DataTableActionBar>
          }
        />
      </div>

      <LeadFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditLeadDialog
        leadId={rowAction?.variant === "edit" ? rowAction.row.id : null}
        onClose={() => setRowAction(null)}
      />
    </div>
  );
}

/**
 * Grid rows carry only the columns the table shows, so Edit loads the full
 * lead before opening the form.
 */
function EditLeadDialog({
  leadId,
  onClose,
}: {
  leadId: string | null;
  onClose: () => void;
}) {
  const trpc = useTRPC();
  const { data } = useQuery({
    ...trpc.sales.byId.queryOptions({ id: leadId ?? "" }),
    enabled: leadId !== null,
  });
  const initial = useMemo(
    () =>
      data && data.lead.id === leadId ? leadToFormValues(data.lead) : undefined,
    [data, leadId],
  );

  return (
    <LeadFormDialog
      open={leadId !== null && initial !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      initial={initial}
    />
  );
}
