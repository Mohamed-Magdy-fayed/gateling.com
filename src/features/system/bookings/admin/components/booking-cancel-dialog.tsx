"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import type { Booking } from "@/integrations/trpc/routers/bookings";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  onCancelled: () => void;
};

export function BookingCancelDialog({
  open,
  onOpenChange,
  booking,
  onCancelled,
}: Props) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const qc = useQueryClient();

  const cancelMutation = useMutation(
    trpc.bookings.cancel.mutationOptions({
      onSuccess: () => {
        toast.success(t("bookings.bookingCancelled"));
        void qc.invalidateQueries(trpc.bookings.list.queryFilter());
        onCancelled();
      },
      onError: () => toast.error(t("bookings.actionFailed")),
    }),
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("bookings.cancelBookingTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("bookings.cancelBookingDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("bookings.cancelBookingKeep")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={cancelMutation.isPending}
            onClick={() => {
              if (booking) cancelMutation.mutate({ id: booking.id });
            }}
          >
            {t("bookings.cancelBookingConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
