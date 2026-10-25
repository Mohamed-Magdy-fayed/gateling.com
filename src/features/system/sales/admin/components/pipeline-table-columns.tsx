"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertCircleIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { LeadPipelineStatus } from "@/drizzle/schema";
import {
  createEntityActionsColumn,
  createSelectColumn,
  DataTableColumnHeader,
} from "@/features/core/data-table";
import type { useTranslation } from "@/features/core/i18n/client";
import type { PipelineGridRow } from "@/features/system/sales/server/router";
import { cn } from "@/lib/utils";

import {
  PipelineRowActions,
  type SetPipelineRowAction,
} from "./pipeline-row-actions";

type Translate = ReturnType<typeof useTranslation>["t"];

/** Columns hidden until the operator turns them on in View options. */
export const PIPELINE_HIDDEN_COLUMNS = {
  socialFollowers: false,
  createdAt: false,
  doNotContact: false,
} as const;

/**
 * Stage-group colours: open → muted, in conversation → primary, demo →
 * amber, won → emerald, closed → outline. The project has no warning/success
 * tokens, so amber/emerald are the documented fallbacks.
 */
const STATUS_TONE: Record<LeadPipelineStatus, string> = {
  new: "border-transparent bg-muted text-muted-foreground",
  blocked_no_number: "border-transparent bg-muted text-muted-foreground",
  contacted: "border-transparent bg-primary/10 text-primary",
  awaiting_reply: "border-transparent bg-primary/10 text-primary",
  callback_scheduled: "border-transparent bg-primary/10 text-primary",
  demo_agreed:
    "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400",
  demo_scheduled:
    "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400",
  demo_done:
    "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400",
  won: "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  lost: "text-muted-foreground",
  parked: "text-muted-foreground",
};

export function PipelineStatusBadge({
  status,
  t,
}: {
  status: LeadPipelineStatus;
  t: Translate;
}) {
  return (
    <Badge variant="outline" className={STATUS_TONE[status]}>
      {t("sales.statuses", { status })}
    </Badge>
  );
}

const DAY_MS = 86_400_000;

function relativeDays(value: Date, now: number, fmt: Intl.RelativeTimeFormat) {
  const days = Math.round((value.getTime() - now) / DAY_MS);
  return fmt.format(days, "day");
}

export function buildPipelineColumns(opts: {
  t: Translate;
  locale: string;
  setRowAction: SetPipelineRowAction;
}): ColumnDef<PipelineGridRow>[] {
  const { t, locale, setRowAction } = opts;
  const lang = locale === "ar" ? "ar" : "en";
  const dateFmt = new Intl.DateTimeFormat(lang, { dateStyle: "medium" });
  const dateTimeFmt = new Intl.DateTimeFormat(lang, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const relativeFmt = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const numberFmt = new Intl.NumberFormat(lang);
  const now = Date.now();

  const header =
    (title: string): ColumnDef<PipelineGridRow>["header"] =>
    ({ column }) => <DataTableColumnHeader column={column} title={title} />;

  return [
    createSelectColumn<PipelineGridRow>(),
    {
      accessorKey: "name",
      header: header(t("sales.columnName")),
      meta: { label: t("sales.columnName") },
      enableHiding: false,
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="flex min-w-40 flex-col gap-0.5">
            <Link
              href={`/sales/leads/${lead.id}`}
              className="font-medium hover:underline focus-visible:underline"
            >
              {lead.name}
            </Link>
            {lead.nameAr && (
              <span className="text-muted-foreground text-xs">
                {lead.nameAr}
              </span>
            )}
            {lead.doNotContact && (
              <Badge
                variant="outline"
                className="w-fit border-destructive/40 text-destructive"
              >
                {t("sales.doNotContact")}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "businessType",
      header: header(t("sales.columnBusinessType")),
      meta: { label: t("sales.columnBusinessType"), filterVariant: "text" },
      cell: ({ row }) => row.original.businessType ?? "—",
    },
    {
      accessorKey: "city",
      header: header(t("sales.columnCity")),
      meta: { label: t("sales.columnCity"), filterVariant: "text" },
      cell: ({ row }) =>
        [row.original.city, row.original.area].filter(Boolean).join(" · ") ||
        "—",
    },
    {
      accessorKey: "phone",
      header: () => t("sales.columnPhone"),
      meta: { label: t("sales.columnPhone") },
      enableSorting: false,
      cell: ({ row }) => {
        const { phone, doNotContact } = row.original;
        if (!phone) return "—";
        // Do-not-contact numbers stay readable but are not one tap from a call.
        if (doNotContact) {
          return (
            <span dir="ltr" className="font-mono text-xs">
              {phone}
            </span>
          );
        }
        return (
          <a
            href={`tel:${phone}`}
            dir="ltr"
            className="font-mono text-xs hover:underline focus-visible:underline"
          >
            {phone}
          </a>
        );
      },
    },
    {
      accessorKey: "whatsappStatus",
      header: () => t("sales.columnWhatsapp"),
      meta: { label: t("sales.columnWhatsapp") },
      enableSorting: false,
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.whatsappStatus === "confirmed"
              ? "secondary"
              : "outline"
          }
        >
          {t("sales.whatsappStatuses", { status: row.original.whatsappStatus })}
        </Badge>
      ),
    },
    {
      accessorKey: "tier",
      header: header(t("sales.columnTier")),
      meta: { label: t("sales.columnTier") },
      cell: ({ row }) => row.original.tier ?? "—",
    },
    {
      accessorKey: "pipelineStatus",
      header: header(t("sales.columnStatus")),
      meta: { label: t("sales.columnStatus") },
      cell: ({ row }) => (
        <PipelineStatusBadge status={row.original.pipelineStatus} t={t} />
      ),
    },
    {
      accessorKey: "followUpCount",
      header: header(t("sales.columnFollowUps")),
      meta: { label: t("sales.columnFollowUps"), filterVariant: "numberRange" },
      cell: ({ row }) => (
        <span className="tabular-nums">
          {numberFmt.format(row.original.followUpCount)}
        </span>
      ),
    },
    {
      accessorKey: "lastContactedAt",
      header: header(t("sales.columnLastContacted")),
      meta: {
        label: t("sales.columnLastContacted"),
        filterVariant: "dateRange",
      },
      cell: ({ row }) => {
        const value = row.original.lastContactedAt;
        if (!value) return t("sales.neverContacted");
        const date = new Date(value);
        return (
          <time dateTime={date.toISOString()} title={dateTimeFmt.format(date)}>
            {relativeDays(date, now, relativeFmt)}
          </time>
        );
      },
    },
    {
      accessorKey: "nextActionAt",
      header: header(t("sales.columnNextAction")),
      meta: { label: t("sales.columnNextAction"), filterVariant: "dateRange" },
      cell: ({ row }) => {
        const value = row.original.nextActionAt;
        if (!value) return "—";
        const date = new Date(value);
        const overdue = date.getTime() < now;
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1",
              overdue && "text-destructive",
            )}
          >
            {overdue && <AlertCircleIcon className="size-3.5" aria-hidden />}
            <time dateTime={date.toISOString()}>
              {dateTimeFmt.format(date)}
            </time>
            {overdue && (
              <span className="sr-only sm:not-sr-only sm:text-xs">
                {t("sales.overdue")}
              </span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "socialFollowers",
      header: header(t("sales.columnFollowers")),
      meta: { label: t("sales.columnFollowers") },
      cell: ({ row }) =>
        row.original.socialFollowers != null ? (
          <span className="tabular-nums">
            {numberFmt.format(row.original.socialFollowers)}
          </span>
        ) : (
          "—"
        ),
    },
    {
      accessorKey: "createdAt",
      header: header(t("sales.columnCreated")),
      meta: { label: t("sales.columnCreated"), filterVariant: "dateRange" },
      cell: ({ row }) => dateFmt.format(new Date(row.original.createdAt)),
    },
    {
      id: "doNotContact",
      accessorFn: (row) => (row.doNotContact ? "true" : "false"),
      header: () => t("sales.columnDoNotContact"),
      meta: { label: t("sales.columnDoNotContact") },
      enableSorting: false,
      cell: ({ row }) =>
        row.original.doNotContact
          ? t("sales.doNotContact")
          : t("sales.contactable"),
    },
    createEntityActionsColumn({
      t,
      size: 112,
      cell: ({ row }) => (
        <PipelineRowActions row={row.original} setRowAction={setRowAction} />
      ),
    }),
  ];
}
