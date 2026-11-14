"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/features/core/i18n/client";
import {
  REMOVE_REASON_MAX,
  REMOVE_REASON_MIN,
} from "@/features/system/discovery/lib/remove-reason";
import { useTRPC } from "@/integrations/trpc/client";

type ReasonError = "removeReasonRequired" | "removeReasonTooLong" | null;

function reasonError(reason: string): ReasonError {
  const length = reason.trim().length;
  if (length < REMOVE_REASON_MIN) return "removeReasonRequired";
  if (length > REMOVE_REASON_MAX) return "removeReasonTooLong";
  return null;
}

/**
 * Confirms removing a touchpoint logged by mistake. The reason is required:
 * it stays with the row so a later recount of the readout is explained.
 */
export function RemoveTouchpointDialog({
  touchpointId,
  open,
  onOpenChange,
}: {
  touchpointId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const ids = useId();
  const [reason, setReason] = useState("");
  const [showError, setShowError] = useState(false);
  const error = reasonError(reason);

  const remove = useMutation(
    trpc.discovery.removeTouchpoint.mutationOptions({
      onSuccess: async (result) => {
        toast.success(
          result.linkedEvidence.length > 0
            ? t("discovery.touchpointRemovedKeptEvidence", {
                count: result.linkedEvidence.length,
              })
            : t("discovery.touchpointRemoved"),
        );
        close(false);
        await queryClient.invalidateQueries({
          queryKey: trpc.discovery.pathKey(),
        });
      },
      onError: async (failure) => {
        toast.error(t("discovery.saveFailed"));
        // Already removed elsewhere (another tab, or via MCP): drop the
        // stale row. Other failures keep the dialog and the typed reason.
        if (failure.data?.code !== "CONFLICT") return;
        close(false);
        await queryClient.invalidateQueries({
          queryKey: trpc.discovery.pathKey(),
        });
      },
    }),
  );

  function close(next: boolean) {
    if (!next) {
      setReason("");
      setShowError(false);
    }
    onOpenChange(next);
  }

  function submit() {
    setShowError(true);
    if (error) return;
    remove.mutate({ id: touchpointId, reason: reason.trim() });
  }

  const invalid = showError && error !== null;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => !remove.isPending && close(next)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("discovery.removeTouchpointTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("discovery.removeTouchpointDesc")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field data-invalid={invalid}>
          <FieldLabel htmlFor={`${ids}-reason`}>
            {t("discovery.removeReason")}
          </FieldLabel>
          <Textarea
            id={`${ids}-reason`}
            dir="auto"
            rows={3}
            value={reason}
            placeholder={t("discovery.removeReasonPlaceholder")}
            aria-invalid={invalid}
            aria-describedby={
              invalid ? `${ids}-hint ${ids}-error` : `${ids}-hint`
            }
            onChange={(event) => setReason(event.target.value)}
          />
          <FieldDescription id={`${ids}-hint`}>
            {t("discovery.removeReasonHint")}
          </FieldDescription>
          <FieldError id={`${ids}-error`}>
            {invalid && error ? t(`discovery.${error}`) : null}
          </FieldError>
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>
            {t("discovery.cancel")}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={submit}
          >
            <LoadingSwap isLoading={remove.isPending}>
              {t("discovery.removeConfirm")}
            </LoadingSwap>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
