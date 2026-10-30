"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

/** The lead's stored Maps listing, as the dialog edits it. */
export type MapsListing = {
  address: string | null;
  mapsCategory: string | null;
  mapsRating: number | null;
  mapsReviewCount: number | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  listing: MapsListing;
};

type Values = {
  address: string;
  category: string;
  rating: string;
  reviewCount: string;
};

function initialValues(listing: MapsListing): Values {
  return {
    address: listing.address ?? "",
    category: listing.mapsCategory ?? "",
    rating: listing.mapsRating != null ? String(listing.mapsRating) : "",
    reviewCount:
      listing.mapsReviewCount != null ? String(listing.mapsReviewCount) : "",
  };
}

const orNull = (value: string) => (value.trim() ? value.trim() : null);
function toNumber(value: string, integer: boolean): number | null {
  const parsed = integer
    ? Number.parseInt(value.replace(/\D/g, ""), 10)
    : Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Edit the client's Google Maps listing: the address (which also places the
 * map) and the numbers as the listing shows them. Same plain controlled form
 * as `LeadFormDialog` — the server re-validates everything.
 */
export function MapsListingDialog({
  open,
  onOpenChange,
  leadId,
  listing,
}: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [values, setValues] = useState<Values>(() => initialValues(listing));

  useEffect(() => {
    if (open) setValues(initialValues(listing));
  }, [open, listing]);

  const mutation = useMutation(
    trpc.sales.setMapsListing.mutationOptions({
      onSuccess: async () => {
        toast.success(t("sales.account.mapsSaved"));
        await queryClient.invalidateQueries({
          queryKey: trpc.sales.byId.pathKey(),
        });
        onOpenChange(false);
      },
      onError: () => toast.error(t("sales.account.mapsSaveFailed")),
    }),
  );

  const rating = toNumber(values.rating, false);
  const ratingInvalid =
    values.rating.trim() !== "" &&
    (rating === null || rating < 0 || rating > 5);
  const canSubmit = !ratingInvalid && !mutation.isPending;

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit() {
    mutation.mutate({
      id: leadId,
      address: orNull(values.address),
      category: orNull(values.category),
      rating,
      reviewCount: toNumber(values.reviewCount, true),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("sales.account.editMaps")}</DialogTitle>
          <DialogDescription>
            {t("sales.account.mapsDialogLead")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field label={t("sales.fieldAddress")}>
            {(id) => (
              <Input
                id={id}
                value={values.address}
                onChange={(event) => set("address", event.target.value)}
              />
            )}
          </Field>
          <Field label={t("sales.account.category")}>
            {(id) => (
              <Input
                id={id}
                value={values.category}
                onChange={(event) => set("category", event.target.value)}
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t("sales.account.rating")}
              error={ratingInvalid ? t("sales.account.ratingInvalid") : null}
            >
              {(id, describedBy) => (
                <Input
                  id={id}
                  inputMode="decimal"
                  dir="ltr"
                  className="text-start"
                  value={values.rating}
                  onChange={(event) => set("rating", event.target.value)}
                  aria-invalid={ratingInvalid || undefined}
                  aria-describedby={describedBy}
                />
              )}
            </Field>
            <Field label={t("sales.account.reviews")}>
              {(id) => (
                <Input
                  id={id}
                  inputMode="numeric"
                  dir="ltr"
                  className="text-start"
                  value={values.reviewCount}
                  onChange={(event) => set("reviewCount", event.target.value)}
                />
              )}
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            data-testid="maps-save"
          >
            <LoadingSwap isLoading={mutation.isPending}>
              {t("common.save")}
            </LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | null;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children(id, error ? errorId : undefined)}
      {error && (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
