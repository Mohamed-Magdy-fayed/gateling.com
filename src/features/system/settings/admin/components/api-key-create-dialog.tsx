"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  CopyIcon,
  KeyRoundIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useId, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useAppForm } from "@/components/forms/hooks";
import {
  OverlayFormBody,
  OverlayFormFooterActions,
  OverlayFormSubmitButton,
} from "@/components/forms/overlay-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/features/core/i18n/client";
import { translationKey } from "@/features/core/i18n/global";
import { useTRPC } from "@/integrations/trpc/client";

const createKeySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(100, translationKey("forms.validation.max255")),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Two steps in one dialog: name the key, then show the plaintext exactly
 * once. Closing the dialog drops the key from memory for good.
 */
export function ApiKeyCreateDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const createMut = useMutation(trpc.apiKeys.create.mutationOptions());
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const formId = useId();

  const form = useAppForm({
    defaultValues: { name: "" },
    validators: { onSubmit: createKeySchema },
    onSubmit: async ({ value }) => {
      try {
        const { key } = await createMut.mutateAsync({ name: value.name });
        setCreatedKey(key);
        await queryClient.invalidateQueries({
          queryKey: trpc.apiKeys.pathKey(),
        });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("systemPages.apiKeysCreateFailed"),
        );
      }
    },
  });

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        // Drop the plaintext from the mutation cache too, not just the view.
        setCreatedKey(null);
        createMut.reset();
        form.reset();
      }
      onOpenChange(next);
    },
    [createMut, form, onOpenChange],
  );

  const handleBodySubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void form.handleSubmit();
    },
    [form],
  );

  function copyKey() {
    if (!createdKey) return;
    // Clipboard is unavailable on insecure origins and can be denied; the
    // field is selectable as the manual fallback.
    navigator.clipboard
      ?.writeText(createdKey)
      .then(() => toast.success(t("systemPages.apiKeysCopied")))
      .catch(() => toast.error(t("systemPages.apiKeysCopyFailed")));
  }

  const pending = createMut.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 px-4 pt-4">
          <DialogTitle>
            {createdKey
              ? t("systemPages.apiKeysCreatedTitle")
              : t("systemPages.apiKeysNew")}
          </DialogTitle>
          <DialogDescription>
            {createdKey ? null : t("systemPages.apiKeysNewDescription")}
          </DialogDescription>
        </DialogHeader>

        {createdKey ? (
          <div className="space-y-4 px-4 py-4">
            <Alert>
              <AlertDescription>
                {t("systemPages.apiKeysCreatedWarning")}
              </AlertDescription>
            </Alert>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                readOnly
                dir="ltr"
                value={createdKey}
                aria-label={t("systemPages.apiKeysPrefix")}
                className="min-w-0 flex-1 text-start font-mono text-xs"
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button type="button" variant="outline" onClick={copyKey}>
                <CopyIcon className="size-3.5" />
                {t("systemPages.apiKeysCopy")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-4">
            <OverlayFormBody formId={formId} onSubmit={handleBodySubmit}>
              <FieldSet disabled={pending}>
                <FieldGroup>
                  <form.AppField name="name">
                    {(field) => (
                      <field.StringField
                        label={t("systemPages.apiKeysName")}
                        placeholder={String(
                          t("systemPages.apiKeysNamePlaceholder"),
                        )}
                      />
                    )}
                  </form.AppField>
                </FieldGroup>
              </FieldSet>
            </OverlayFormBody>
          </div>
        )}

        <DialogFooter className="shrink-0 border-t bg-muted px-4 py-4 sm:flex-row sm:justify-end">
          <OverlayFormFooterActions>
            {createdKey ? (
              <Button type="button" onClick={() => handleOpenChange(false)}>
                <CheckIcon className="size-3.5" />
                {t("systemPages.apiKeysDone")}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={pending}
                >
                  <XIcon className="size-3.5" />
                  {t("common.cancel")}
                </Button>
                <OverlayFormSubmitButton formId={formId} disabled={pending}>
                  {pending ? (
                    <Loader2Icon className="size-3.5 animate-spin motion-reduce:animate-none" />
                  ) : (
                    <KeyRoundIcon className="size-3.5" />
                  )}
                  {t("systemPages.apiKeysCreate")}
                </OverlayFormSubmitButton>
              </>
            )}
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
