"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { H1, Lead } from "@/components/ui/typography";
import {
  type LeadPipelineStatus,
  type LeadTier,
  leadPipelineStatusValues,
  leadTierValues,
  type WhatsappStatus,
  whatsappStatusValues,
} from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

import { LeadFormDialog } from "./components/lead-form-dialog";

const PER_PAGE = 20;

/**
 * The full prospect list — the place to search, filter and edit. Day-to-day
 * work happens on `/sales/today`; this exists for everything that view
 * deliberately hides.
 */
export function SalesLeadsTablePage() {
  const trpc = useTRPC();
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadPipelineStatus | "all">("all");
  const [tier, setTier] = useState<LeadTier | "all">("all");
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsappStatus | "all">(
    "all",
  );
  const [city, setCity] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const input = useMemo(
    () => ({
      page,
      perPage: PER_PAGE,
      sorting: [],
      globalFilter: search || undefined,
      pipelineStatus: status,
      tier,
      whatsappStatus,
      city: city || undefined,
    }),
    [page, search, status, tier, whatsappStatus, city],
  );

  const { data, isPending } = useQuery(trpc.sales.list.queryOptions(input));

  /** Any filter change invalidates the current page number. */
  function resetTo<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <H1>{t("sales.leadsTitle")}</H1>
          <Lead>{t("sales.leadsLead")}</Lead>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          {t("sales.newLead")}
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-3 pt-6">
          <Input
            className="w-56"
            value={search}
            placeholder={t("sales.searchHint")}
            onChange={(event) => resetTo(setSearch)(event.target.value)}
          />
          <Input
            className="w-40"
            value={city}
            placeholder={t("sales.filterCity")}
            onChange={(event) => resetTo(setCity)(event.target.value)}
          />

          <FilterSelect
            value={status}
            onChange={(value) =>
              resetTo(setStatus)(value as LeadPipelineStatus | "all")
            }
            options={leadPipelineStatusValues}
            allLabel={t("sales.filterStatus")}
            renderOption={(value) =>
              t("sales.statuses", { status: value as LeadPipelineStatus })
            }
          />
          <FilterSelect
            value={tier}
            onChange={(value) => resetTo(setTier)(value as LeadTier | "all")}
            options={leadTierValues}
            allLabel={t("sales.filterTier")}
            renderOption={(value) => value}
          />
          <FilterSelect
            value={whatsappStatus}
            onChange={(value) =>
              resetTo(setWhatsappStatus)(value as WhatsappStatus | "all")
            }
            options={whatsappStatusValues}
            allLabel={t("sales.filterWhatsapp")}
            renderOption={(value) =>
              t("sales.whatsappStatuses", { status: value as WhatsappStatus })
            }
          />
        </CardContent>
      </Card>

      {isPending ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("sales.columnName")}</TableHead>
                  <TableHead>{t("sales.columnCity")}</TableHead>
                  <TableHead>{t("sales.columnPhone")}</TableHead>
                  <TableHead>{t("sales.columnWhatsapp")}</TableHead>
                  <TableHead>{t("sales.columnTier")}</TableHead>
                  <TableHead>{t("sales.columnStatus")}</TableHead>
                  <TableHead>{t("sales.columnFollowUps")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/sales/leads/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.name}
                      </Link>
                      {row.nameAr && (
                        <span className="block text-muted-foreground text-xs">
                          {row.nameAr}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {[row.city, row.area].filter(Boolean).join(" · ")}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.phone ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.whatsappStatus === "confirmed"
                            ? "default"
                            : "outline"
                        }
                      >
                        {t("sales.whatsappStatuses", {
                          status: row.whatsappStatus,
                        })}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.tier ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {t("sales.statuses", { status: row.pipelineStatus })}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.followUpCount}
                    </TableCell>
                  </TableRow>
                ))}
                {data?.rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground text-sm"
                    >
                      {t("common.empty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{data?.total ?? 0}</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            {t("dataTable.goToPreviousPage")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= (data?.pageCount ?? 1)}
            onClick={() => setPage((current) => current + 1)}
          >
            {t("dataTable.goToNextPage")}
          </Button>
        </div>
      </div>

      <LeadFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

/**
 * Deliberately untyped over the option union: the base-ui `Select` infers its
 * value type from the prop, which a generic parameter defeats. Callers cast on
 * the way out instead — the values all come from Drizzle enum tuples.
 */
type FilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  allLabel: string;
  renderOption: (value: string) => string;
};

function FilterSelect({
  value,
  onChange,
  options,
  allLabel,
  renderOption,
}: FilterSelectProps) {
  const { t } = useTranslation();
  return (
    <Select value={value} onValueChange={(next) => onChange(String(next))}>
      <SelectTrigger size="sm" className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          {allLabel}: {t("sales.filterAll")}
        </SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {renderOption(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
