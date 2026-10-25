"use client";

import type { Table } from "@tanstack/react-table";

import {
  leadPipelineStatusValues,
  leadTierValues,
  whatsappStatusValues,
} from "@/drizzle/schema";
import {
  DataTableDateRangeFilter,
  DataTableFacetedFilter,
  DataTableNumberRangeFilter,
  DataTableTextFilter,
} from "@/features/core/data-table";
import { useTranslation } from "@/features/core/i18n/client";
import type { PipelineGridRow } from "@/features/system/sales/server/router";

/** Faceted value for "no tier"; must match `UNTIERED` in `server/filters.ts`. */
const UNTIERED = "untiered";

export function PipelineGridFilters({
  table,
}: {
  table: Table<PipelineGridRow>;
}) {
  const { t } = useTranslation();
  const column = (id: string) => table.getColumn(id);

  const statusOptions = leadPipelineStatusValues.map((status) => ({
    value: status,
    label: t("sales.statuses", { status }),
  }));
  const tierOptions = [
    ...leadTierValues.map((tier) => ({ value: tier, label: tier })),
    { value: UNTIERED, label: t("sales.untiered") },
  ];
  const whatsappOptions = whatsappStatusValues.map((status) => ({
    value: status,
    label: t("sales.whatsappStatuses", { status }),
  }));
  const contactOptions = [
    { value: "true", label: t("sales.doNotContact") },
    { value: "false", label: t("sales.contactable") },
  ];

  const city = column("city");
  const businessType = column("businessType");
  const followUps = column("followUpCount");
  const lastContacted = column("lastContactedAt");
  const nextAction = column("nextActionAt");

  return (
    <>
      <DataTableFacetedFilter
        column={column("pipelineStatus")}
        title={t("sales.columnStatus")}
        options={statusOptions}
      />
      <DataTableFacetedFilter
        column={column("tier")}
        title={t("sales.columnTier")}
        options={tierOptions}
      />
      <DataTableFacetedFilter
        column={column("whatsappStatus")}
        title={t("sales.columnWhatsapp")}
        options={whatsappOptions}
      />
      <DataTableFacetedFilter
        column={column("doNotContact")}
        title={t("sales.columnDoNotContact")}
        options={contactOptions}
      />
      {city && (
        <DataTableTextFilter column={city} title={t("sales.filterCity")} />
      )}
      {businessType && (
        <DataTableTextFilter
          column={businessType}
          title={t("sales.columnBusinessType")}
        />
      )}
      {followUps && (
        <DataTableNumberRangeFilter
          column={followUps}
          title={t("sales.columnFollowUps")}
        />
      )}
      {lastContacted && (
        <DataTableDateRangeFilter
          column={lastContacted}
          title={t("sales.columnLastContacted")}
        />
      )}
      {nextAction && (
        <DataTableDateRangeFilter
          column={nextAction}
          title={t("sales.columnNextAction")}
        />
      )}
    </>
  );
}
