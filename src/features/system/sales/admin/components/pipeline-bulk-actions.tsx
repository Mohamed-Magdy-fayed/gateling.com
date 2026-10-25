"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Table } from "@tanstack/react-table";
import { ArchiveIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BULK_ACTION_LIMIT } from "@/features/core/data-table/lib/limits";
import { useTranslation } from "@/features/core/i18n/client";
import type { PipelineGridRow } from "@/features/system/sales/server/router";
import { useTRPC } from "@/integrations/trpc/client";

type BulkStatus = "parked" | "lost";

/** The server tags unexpected bulk failures `bulk_failed:<correlationId>`. */
function failureRef(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const match = /^bulk_failed:(.+)$/.exec(message);
  return match ? match[1] : message.split(":")[0] || "—";
}

/**
 * Close the selected leads. Both actions are terminal, so each confirms with
 * the count first; the server runs the batch in one transaction, so a failure
 * means nothing changed.
 */
export function PipelineBulkActions({
  table,
}: {
  table: Table<PipelineGridRow>;
}) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [pendingStatus, setPendingStatus] = useState<BulkStatus | null>(null);

  const ids = table.getSelectedRowModel().rows.map((r) => r.original.id);
  const overLimit = ids.length > BULK_ACTION_LIMIT;

  const bulk = useMutation(
    trpc.sales.bulkSetStatus.mutationOptions({
      onSuccess: async (result) => {
        toast.success(t("sales.bulkDone", { count: result.updated }));
        table.resetRowSelection();
        setPendingStatus(null);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.sales.list.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.sales.counters.pathKey(),
          }),
        ]);
      },
      onError: (error) => {
        toast.error(t("sales.bulkFailed", { ref: failureRef(error) }));
      },
    }),
  );

  const confirmTitle =
    pendingStatus === "lost"
      ? t("sales.bulkConfirmLost", { count: ids.length })
      : t("sales.bulkConfirmPark", { count: ids.length });

  return (
    <>
      {overLimit && (
        <span className="text-muted-foreground text-xs">
          {t("sales.bulkLimit", { limit: BULK_ACTION_LIMIT })}
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={overLimit || bulk.isPending}
        onClick={() => setPendingStatus("parked")}
      >
        <ArchiveIcon className="size-3.5" aria-hidden />
        {t("sales.bulkPark")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={overLimit || bulk.isPending}
        onClick={() => setPendingStatus("lost")}
      >
        <XCircleIcon className="size-3.5" aria-hidden />
        {t("sales.bulkLost")}
      </Button>

      <AlertDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => {
          if (!open && !bulk.isPending) setPendingStatus(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("sales.bulkConfirmBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulk.isPending}>
              {t("sales.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={pendingStatus === "lost" ? "destructive" : "default"}
              disabled={bulk.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (pendingStatus) bulk.mutate({ ids, status: pendingStatus });
              }}
            >
              {bulk.isPending && <Spinner className="size-3.5" />}
              {t("sales.bulkConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
