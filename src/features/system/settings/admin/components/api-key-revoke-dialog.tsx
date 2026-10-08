"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BanIcon, Loader2Icon, XIcon } from "lucide-react";
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

type Props = {
  apiKey: { id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
};

export function ApiKeyRevokeDialog({ apiKey, onOpenChange }: Props) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const revokeMut = useMutation(trpc.apiKeys.revoke.mutationOptions());
  const pending = revokeMut.isPending;

  async function handleConfirm() {
    if (!apiKey) return;
    try {
      await toast
        .promise(revokeMut.mutateAsync({ id: apiKey.id }), {
          loading: t("systemPages.apiKeysRevoking"),
          success: t("systemPages.apiKeysRevokedToast"),
          error: (err) =>
            err instanceof Error
              ? err.message
              : t("systemPages.apiKeysRevokeFailed"),
        })
        .unwrap();
      await queryClient.invalidateQueries({
        queryKey: trpc.apiKeys.pathKey(),
      });
      onOpenChange(false);
    } catch {
      // toast.promise already surfaced the failure.
    }
  }

  return (
    <AlertDialog open={apiKey !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("systemPages.apiKeysRevokeTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {apiKey
              ? String(
                  t("systemPages.apiKeysRevokeDescription", {
                    name: apiKey.name,
                  }),
                )
              : ""}
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
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {pending ? (
              <Loader2Icon className="size-3.5 animate-spin motion-reduce:animate-none" />
            ) : (
              <BanIcon className="size-3.5" />
            )}
            {pending
              ? t("systemPages.apiKeysRevoking")
              : t("systemPages.apiKeysRevoke")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
