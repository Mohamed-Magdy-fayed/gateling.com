"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, Trash2Icon, XIcon } from "lucide-react";
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
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import type { Testimonial } from "@/integrations/trpc/routers/testimonials";

type Props = {
  testimonial: Testimonial | null;
  onDeleted?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function TestimonialDeleteDialog({
  testimonial,
  onDeleted,
  onOpenChange,
  open,
}: Props) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const deleteMut = useMutation(trpc.testimonials.delete.mutationOptions());
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    if (!testimonial) return;
    setPending(true);
    try {
      await toast
        .promise(deleteMut.mutateAsync({ id: testimonial.id }), {
          loading: t("common.deleting"),
          success: t("testimonials.testimonialDeleted"),
          error: (err) =>
            err instanceof Error
              ? err.message
              : t("testimonials.testimonialDeleteFailed"),
        })
        .unwrap();
      await qc.invalidateQueries({ queryKey: trpc.testimonials.pathKey() });
      onDeleted?.();
      onOpenChange(false);
    } catch {
      /* surfaced */
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("testimonials.deleteTestimonialTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("testimonials.deleteTestimonialDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            <XIcon className="size-3.5" />
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
          >
            {pending ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <Trash2Icon className="size-3.5" />
            )}
            {pending
              ? t("common.deleting")
              : t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
