"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { LinkButton } from "@/components/general/link-button";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardHeading,
  ContentCard,
  ProseText,
} from "@/components/ui/containers";
import type { BookingStatus } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

const statusBadgeVariant: Record<
  BookingStatus,
  "secondary" | "outline" | "default" | "destructive"
> = {
  requested: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  completed: "outline",
  no_show: "outline",
};

export function MyBookings() {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const bookingsQuery = useQuery(trpc.bookings.myBookings.queryOptions());

  const cancelMutation = useMutation(
    trpc.bookings.cancelMine.mutationOptions({
      onSuccess: async () => {
        toast.success(t("publicPages.myAccountPage.bookingCancelledToast"));
        await queryClient.invalidateQueries({
          queryKey: trpc.bookings.myBookings.queryKey(),
        });
      },
      onError: () => {
        toast.error(t("publicPages.bookCallPage.genericError"));
      },
      onSettled: () => setCancellingId(null),
    }),
  );

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en", {
        dateStyle: "full",
        timeStyle: "short",
      }),
    [locale],
  );

  const statusLabel = (status: BookingStatus) => {
    const map: Record<BookingStatus, string> = {
      requested: t("publicPages.myAccountPage.bookingStatusRequested"),
      confirmed: t("publicPages.myAccountPage.bookingStatusConfirmed"),
      cancelled: t("publicPages.myAccountPage.bookingStatusCancelled"),
      completed: t("publicPages.myAccountPage.bookingStatusCompleted"),
      no_show: t("publicPages.myAccountPage.bookingStatusNoShow"),
    };
    return map[status];
  };

  const bookings = bookingsQuery.data ?? [];

  if (bookingsQuery.isLoading) return null;

  if (bookings.length === 0) {
    return (
      <ContentCard className="mt-8 flex flex-col items-center gap-4 p-10 text-center">
        <CardHeading>
          {t("publicPages.myAccountPage.noBookingsHeading")}
        </CardHeading>
        <ProseText>{t("publicPages.myAccountPage.noBookingsText")}</ProseText>
        <LinkButton href="/contact?tab=book" className="mt-2">
          {t("publicPages.myAccountPage.noBookingsButton")}
        </LinkButton>
      </ContentCard>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      {bookings.map((booking) => {
        const isActive =
          (booking.status === "requested" || booking.status === "confirmed") &&
          booking.startsAt.getTime() > Date.now();
        return (
          <ContentCard key={booking.id} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <p className="font-semibold">
                  {formatter.format(booking.startsAt)}
                </p>
                {booking.customerNote && (
                  <ProseText size="sm" className="text-muted-foreground">
                    {booking.customerNote}
                  </ProseText>
                )}
              </div>
              <Badge variant={statusBadgeVariant[booking.status]}>
                {statusLabel(booking.status)}
              </Badge>
            </div>
            {isActive && (
              <div className="mt-4 flex flex-wrap gap-3">
                <LinkButton
                  href={`/contact?tab=book&reschedule=${booking.id}`}
                  variant="outline"
                  size="sm"
                >
                  {t("publicPages.myAccountPage.bookingRescheduleButton")}
                </LinkButton>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={cancelMutation.isPending}
                  onClick={() => setCancellingId(booking.id)}
                >
                  {t("publicPages.myAccountPage.bookingCancelButton")}
                </Button>
              </div>
            )}
          </ContentCard>
        );
      })}

      <AlertDialog
        open={cancellingId != null}
        onOpenChange={(open) => {
          if (!open) setCancellingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("publicPages.myAccountPage.bookingCancelConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("publicPages.myAccountPage.bookingCancelConfirmText")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("publicPages.myAccountPage.bookingCancelKeep")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancellingId) cancelMutation.mutate({ id: cancellingId });
              }}
            >
              {t("publicPages.myAccountPage.bookingCancelConfirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
