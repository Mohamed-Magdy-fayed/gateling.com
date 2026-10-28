"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import type { LeadLocation } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { parseMapsEmbed } from "@/features/system/sales/lib/maps-embed";
import { useTRPC } from "@/integrations/trpc/client";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  /** Omit to add; provide to edit. */
  location?: LeadLocation;
  /** Adding the first location makes it the main one regardless. */
  isFirst: boolean;
};

type Values = {
  embed: string;
  removeMap: boolean;
  name: string;
  address: string;
  category: string;
  rating: string;
  reviewCount: string;
  isPrimary: boolean;
};

function initialValues(location?: LeadLocation): Values {
  return {
    embed: "",
    removeMap: false,
    name: location?.name ?? "",
    address: location?.address ?? "",
    category: location?.category ?? "",
    rating: location?.rating != null ? String(location.rating) : "",
    reviewCount:
      location?.reviewCount != null ? String(location.reviewCount) : "",
    isPrimary: false,
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
 * Add or edit one Google Maps location. The operator pastes the listing's
 * Share › Embed a map HTML; the name is pre-filled from it, and the Maps
 * numbers are typed as the listing shows them. Same plain controlled form as
 * `LeadFormDialog` — the server re-validates everything, embed included.
 */
export function LocationDialog({
  open,
  onOpenChange,
  leadId,
  location,
  isFirst,
}: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [values, setValues] = useState<Values>(() => initialValues(location));
  const embedId = useId();
  const embedHintId = useId();
  const embedErrorId = useId();

  useEffect(() => {
    if (open) setValues(initialValues(location));
  }, [open, location]);

  const onSuccess = async () => {
    toast.success(t("sales.account.locationSaved"));
    await queryClient.invalidateQueries({
      queryKey: trpc.sales.byId.pathKey(),
    });
    onOpenChange(false);
  };
  const onError = () => toast.error(t("sales.account.locationSaveFailed"));
  const add = useMutation(
    trpc.sales.addLocation.mutationOptions({ onSuccess, onError }),
  );
  const update = useMutation(
    trpc.sales.updateLocation.mutationOptions({ onSuccess, onError }),
  );
  const isPending = add.isPending || update.isPending;

  const parsed = values.embed.trim() ? parseMapsEmbed(values.embed) : null;
  const embedInvalid = values.embed.trim() !== "" && parsed === null;
  const rating = toNumber(values.rating, false);
  const ratingInvalid =
    values.rating.trim() !== "" &&
    (rating === null || rating < 0 || rating > 5);
  const canSubmit =
    values.name.trim() !== "" && !embedInvalid && !ratingInvalid && !isPending;

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleEmbedChange(embed: string) {
    const name = parseMapsEmbed(embed)?.name;
    setValues((current) => ({
      ...current,
      embed,
      // Only fill an empty name: never overwrite what the operator typed.
      name: current.name.trim() || !name ? current.name : name,
    }));
  }

  function handleSubmit() {
    const fields = {
      name: values.name.trim(),
      address: orNull(values.address),
      category: orNull(values.category),
      rating,
      reviewCount: toNumber(values.reviewCount, true),
    };
    const embed = values.embed.trim();
    if (location) {
      update.mutate({
        id: location.id,
        ...fields,
        // Empty textarea keeps the current map; "remove map" clears it.
        ...(embed ? { embed } : values.removeMap ? { embed: null } : {}),
      });
    } else {
      add.mutate({
        leadId,
        ...fields,
        embed: embed || null,
        isPrimary: values.isPrimary,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {location
              ? t("sales.account.editLocation")
              : isFirst
                ? t("sales.account.addMainLocation")
                : t("sales.account.addBranch")}
          </DialogTitle>
          <DialogDescription>
            {t("sales.account.locationDialogLead")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={embedId}>{t("sales.account.embedLabel")}</Label>
            <Textarea
              id={embedId}
              rows={3}
              dir="ltr"
              className="text-start font-mono text-xs"
              placeholder='<iframe src="https://www.google.com/maps/embed?pb=…"></iframe>'
              value={values.embed}
              onChange={(event) => handleEmbedChange(event.target.value)}
              aria-invalid={embedInvalid || undefined}
              aria-describedby={
                embedInvalid ? `${embedHintId} ${embedErrorId}` : embedHintId
              }
              data-testid="location-embed-input"
            />
            <p id={embedHintId} className="text-muted-foreground text-xs">
              {location?.embedSrc
                ? t("sales.account.embedHintReplace")
                : t("sales.account.embedHint")}
            </p>
            {embedInvalid && (
              <p
                id={embedErrorId}
                role="alert"
                className="text-destructive text-xs"
              >
                {t("sales.account.embedInvalid")}
              </p>
            )}
            {location?.embedSrc && !values.embed.trim() && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${embedId}-remove`}
                  checked={values.removeMap}
                  onCheckedChange={(checked) =>
                    set("removeMap", checked === true)
                  }
                />
                <Label htmlFor={`${embedId}-remove`}>
                  {t("sales.account.removeMap")}
                </Label>
              </div>
            )}
          </div>

          <Field label={t("sales.account.locationName")}>
            {(id) => (
              <Input
                id={id}
                value={values.name}
                onChange={(event) => set("name", event.target.value)}
                data-testid="location-name-input"
              />
            )}
          </Field>
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

          {!location && !isFirst && (
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${embedId}-primary`}
                checked={values.isPrimary}
                onCheckedChange={(checked) =>
                  set("isPrimary", checked === true)
                }
              />
              <Label htmlFor={`${embedId}-primary`}>
                {t("sales.account.makeMain")}
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            data-testid="location-save"
          >
            <LoadingSwap isLoading={isPending}>{t("common.save")}</LoadingSwap>
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
  children: (id: string, describedBy: string | undefined) => React.ReactNode;
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
