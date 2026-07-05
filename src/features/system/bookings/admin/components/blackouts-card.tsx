"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useAppForm } from "@/components/forms/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

const blackoutSchema = z
  .object({
    startsAt: z.date(),
    endsAt: z.date(),
    reason: z.string().trim().max(255),
  })
  .refine((val) => val.endsAt > val.startsAt, {
    path: ["endsAt"],
    message: "invalid_range",
  });

export function BlackoutsCard() {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const blackoutsQuery = useQuery(trpc.bookings.blackouts.list.queryOptions());

  const invalidate = () =>
    qc.invalidateQueries(trpc.bookings.blackouts.list.queryFilter());

  const createMutation = useMutation(
    trpc.bookings.blackouts.create.mutationOptions({
      onSuccess: () => {
        toast.success(t("bookings.blackoutCreated"));
        void invalidate();
        setAddOpen(false);
        form.reset();
      },
      onError: () => toast.error(t("bookings.blackoutFailed")),
    }),
  );

  const deleteMutation = useMutation(
    trpc.bookings.blackouts.delete.mutationOptions({
      onSuccess: () => {
        toast.success(t("bookings.blackoutDeleted"));
        void invalidate();
      },
      onError: () => toast.error(t("bookings.blackoutFailed")),
    }),
  );

  const form = useAppForm({
    defaultValues: {
      startsAt: null as Date | null,
      endsAt: null as Date | null,
      reason: "",
    },
    validators: { onSubmit: blackoutSchema },
    onSubmit: async ({ value }) => {
      if (!value.startsAt || !value.endsAt) return;
      await createMutation.mutateAsync({
        startsAt: value.startsAt,
        endsAt: value.endsAt,
        reason: value.reason || undefined,
      });
    },
  });

  const rangeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale],
  );

  const blackouts = blackoutsQuery.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle>{t("bookings.blackouts")}</CardTitle>
          <CardDescription>
            {t("bookings.blackoutsDescription")}
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          {t("bookings.addBlackout")}
        </Button>
      </CardHeader>
      <CardContent>
        {blackouts.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t("bookings.noBlackouts")}
          </p>
        ) : (
          <ul className="divide-y">
            {blackouts.map((blackout) => (
              <li
                key={blackout.id}
                className="flex items-center justify-between gap-4 py-2"
              >
                <div>
                  <p className="text-sm font-medium">
                    {rangeFmt.format(blackout.startsAt)} —{" "}
                    {rangeFmt.format(blackout.endsAt)}
                  </p>
                  {blackout.reason && (
                    <p className="text-muted-foreground text-xs">
                      {blackout.reason}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("bookings.deleteBlackout")}
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate({ id: blackout.id })}
                >
                  <Trash2Icon className="text-destructive size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("bookings.addBlackout")}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <form.AppField name="startsAt">
              {(field) => (
                <field.DateTimeField label={t("bookings.blackoutStartsAt")} />
              )}
            </form.AppField>
            <form.AppField name="endsAt">
              {(field) => (
                <field.DateTimeField label={t("bookings.blackoutEndsAt")} />
              )}
            </form.AppField>
            <form.AppField name="reason">
              {(field) => (
                <field.StringField
                  label={t("bookings.blackoutReason")}
                  placeholder={t("bookings.blackoutReasonPlaceholder")}
                />
              )}
            </form.AppField>
            <DialogFooter>
              <form.Subscribe selector={(state) => [state.isSubmitting]}>
                {([isSubmitting]) => (
                  <Button type="submit" disabled={isSubmitting}>
                    <LoadingSwap
                      isLoading={isSubmitting}
                      loadingText={t("common.loading")}
                    >
                      {t("bookings.addBlackout")}
                    </LoadingSwap>
                  </Button>
                )}
              </form.Subscribe>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
