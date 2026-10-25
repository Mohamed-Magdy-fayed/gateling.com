"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArchiveIcon,
  ExternalLinkIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  PencilIcon,
} from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/features/core/i18n/client";
import type { PipelineGridRow } from "@/features/system/sales/server/router";
import { useTRPC } from "@/integrations/trpc/client";
import { toWhatsAppUrl } from "@/lib/phone";

import { QuickLogPopover } from "./quick-log-popover";

export type PipelineRowActionVariant = "edit";

export type SetPipelineRowAction = (
  next: { row: PipelineGridRow; variant: PipelineRowActionVariant } | null,
) => void;

type Props = {
  row: PipelineGridRow;
  setRowAction: SetPipelineRowAction;
};

/**
 * Quick log stays a visible button (it is the common action and opens its own
 * popover); the rest live in the overflow menu. Do-not-contact leads keep
 * Open and Edit, but outreach is disabled with the reason stated.
 */
export function PipelineRowActions({ row, setRowAction }: Props) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const reasonId = useId();
  const whatsappUrl = row.doNotContact ? null : toWhatsAppUrl(row.phone);
  const isClosed = row.pipelineStatus === "parked";

  const park = useMutation(
    trpc.sales.park.mutationOptions({
      onSuccess: async () => {
        toast.success(t("sales.parked"));
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.sales.list.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.sales.counters.pathKey(),
          }),
        ]);
      },
      onError: () => toast.error(t("sales.parkFailed")),
    }),
  );

  return (
    <div className="flex items-center justify-end gap-1">
      {row.doNotContact ? (
        <>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-disabled="true"
            aria-describedby={reasonId}
            className="cursor-not-allowed opacity-50"
          >
            {t("sales.quickLog")}
          </Button>
          <span id={reasonId} className="sr-only">
            {t("sales.doNotContactBlocked")}
          </span>
        </>
      ) : (
        <QuickLogPopover leadId={row.id} triggerVariant="ghost" />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-8"
              aria-label={t("sales.rowActions")}
              data-testid={`pipeline-row-actions-${row.id}`}
            >
              <MoreHorizontalIcon className="size-3.5" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem render={<Link href={`/sales/leads/${row.id}`} />}>
            <ExternalLinkIcon className="size-3.5" />
            {t("sales.openLead")}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!whatsappUrl}
            render={
              whatsappUrl
                ? (props) => (
                    <a
                      {...props}
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {props.children}
                    </a>
                  )
                : undefined
            }
          >
            <MessageCircleIcon className="size-3.5" />
            <span className="flex flex-col">
              {t("sales.openWhatsapp")}
              {row.doNotContact && (
                <span className="text-muted-foreground">
                  {t("sales.doNotContact")}
                </span>
              )}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setRowAction({ row, variant: "edit" })}
          >
            <PencilIcon className="size-3.5" />
            {t("sales.editLead")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isClosed || park.isPending}
            onClick={() => park.mutate({ leadId: row.id })}
          >
            <ArchiveIcon className="size-3.5" />
            {t("sales.park")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
