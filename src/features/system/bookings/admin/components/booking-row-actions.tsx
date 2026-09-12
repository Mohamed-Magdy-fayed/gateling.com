"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  MoreHorizontalIcon,
  UserXIcon,
  VideoIcon,
  XCircleIcon,
} from "lucide-react";
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
import { useTRPC } from "@/integrations/trpc/client";
import type { Booking } from "@/integrations/trpc/routers/bookings";

export type BookingRowActionVariant = "cancel";

export type SetBookingRowAction = (
  next: { row: Booking; variant: BookingRowActionVariant } | null,
) => void;

type Props = { row: Booking; setRowAction: SetBookingRowAction };

export function BookingRowActions({ row, setRowAction }: Props) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const qc = useQueryClient();

  const invalidate = () =>
    qc.invalidateQueries(trpc.bookings.list.queryFilter());

  const confirmMutation = useMutation(
    trpc.bookings.confirm.mutationOptions({
      onSuccess: () => {
        toast.success(t("bookings.bookingConfirmed"));
        void invalidate();
      },
      onError: () => toast.error(t("bookings.actionFailed")),
    }),
  );

  const updateStatus = useMutation(
    trpc.bookings.updateStatus.mutationOptions({
      onSuccess: () => {
        toast.success(t("bookings.statusUpdated"));
        void invalidate();
      },
      onError: () => toast.error(t("bookings.actionFailed")),
    }),
  );

  const hostJoinLink = useMutation(
    trpc.bookings.hostJoinLink.mutationOptions({
      onSuccess: ({ url }) => {
        // Single-use link minted for this click; open it and forget it.
        window.open(url, "_blank", "noopener");
      },
      onError: () => toast.error(t("bookings.joinLinkFailed")),
    }),
  );

  const isPast = row.startsAt.getTime() < Date.now();
  const isActive = row.status === "requested" || row.status === "confirmed";
  const canJoin = row.status === "confirmed" && !isPast && !!row.meetingCode;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-8"
            aria-label={t("common.openMenu")}
          >
            <MoreHorizontalIcon className="size-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        {canJoin && (
          <DropdownMenuItem
            disabled={hostJoinLink.isPending}
            onClick={() => hostJoinLink.mutate({ id: row.id })}
          >
            <VideoIcon className="size-3.5" />
            {t("bookings.joinAsHost")}
          </DropdownMenuItem>
        )}
        {row.status === "requested" && (
          <DropdownMenuItem
            disabled={confirmMutation.isPending}
            onClick={() => confirmMutation.mutate({ id: row.id })}
          >
            <CheckCircleIcon className="size-3.5" />
            {t("bookings.confirmBooking")}
          </DropdownMenuItem>
        )}
        {row.status === "confirmed" && isPast && (
          <>
            <DropdownMenuItem
              disabled={updateStatus.isPending}
              onClick={() =>
                updateStatus.mutate({ id: row.id, status: "completed" })
              }
            >
              <CheckCircleIcon className="size-3.5" />
              {t("bookings.markCompleted")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={updateStatus.isPending}
              onClick={() =>
                updateStatus.mutate({ id: row.id, status: "no_show" })
              }
            >
              <UserXIcon className="size-3.5" />
              {t("bookings.markNoShow")}
            </DropdownMenuItem>
          </>
        )}
        {isActive && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setRowAction({ row, variant: "cancel" })}
            >
              <XCircleIcon className="text-destructive size-3.5" />
              <span className="text-destructive">
                {t("bookings.cancelBooking")}
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
