"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  type DiscoveryCommitmentStatus,
  type DiscoveryCommitmentType,
  discoveryCommitmentStatusValues,
  discoveryCommitmentTypeValues,
} from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

import { COMMITMENT_STATUS_KEY, COMMITMENT_TYPE_KEY } from "../labels";
import { ChoiceChips } from "./choice-chips";

export type CommitmentTarget = {
  studyId: string;
  contactId: string;
  priceQuoted?: string | null;
};

/** Money signals are logged apart from talk, so the readout can't confuse them. */
export function CommitmentDialog({
  target,
  onOpenChange,
}: {
  target: CommitmentTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const ids = useId();
  const [type, setType] = useState<DiscoveryCommitmentType>("deposit");
  const [status, setStatus] = useState<DiscoveryCommitmentStatus>("promised");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!target) return;
    setType("deposit");
    setStatus("promised");
    setAmount("");
    setPrice(target.priceQuoted ?? "");
    setNote("");
  }, [target]);

  const save = useMutation(
    trpc.discovery.logCommitment.mutationOptions({
      onSuccess: async () => {
        toast.success(t("discovery.saved"));
        await queryClient.invalidateQueries({
          queryKey: trpc.discovery.pathKey(),
        });
        onOpenChange(false);
      },
      onError: () => toast.error(t("discovery.saveFailed")),
    }),
  );

  const isMoney = type === "deposit" || type === "pre_order";

  return (
    <Dialog open={Boolean(target)} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col">
        <DialogHeader>
          <DialogTitle>{t("discovery.commitmentTitle")}</DialogTitle>
          <DialogDescription>{t("discovery.commitmentDesc")}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <FieldGroup>
            <Field>
              <FieldLabel>{t("discovery.fieldType")}</FieldLabel>
              <ChoiceChips
                label={t("discovery.fieldType")}
                value={type}
                onChange={setType}
                options={discoveryCommitmentTypeValues.map((value) => ({
                  value,
                  label: t(COMMITMENT_TYPE_KEY[value]),
                }))}
              />
            </Field>
            {isMoney && (
              <Field>
                <FieldLabel>{t("discovery.fieldStatus")}</FieldLabel>
                <ChoiceChips
                  label={t("discovery.fieldStatus")}
                  value={status}
                  onChange={setStatus}
                  options={discoveryCommitmentStatusValues.map((value) => ({
                    value,
                    label: t(COMMITMENT_STATUS_KEY[value]),
                  }))}
                />
              </Field>
            )}
            {isMoney && (
              <Field>
                <FieldLabel htmlFor={`${ids}-amount`}>
                  {t("discovery.fieldAmount")}
                </FieldLabel>
                <Input
                  id={`${ids}-amount`}
                  inputMode="numeric"
                  dir="ltr"
                  className="text-start"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor={`${ids}-price`}>
                {t("discovery.priceQuoted")}
              </FieldLabel>
              <Input
                id={`${ids}-price`}
                dir="auto"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${ids}-note`}>
                {t("discovery.fieldNote")}
              </FieldLabel>
              <Input
                id={`${ids}-note`}
                dir="auto"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
          </FieldGroup>
        </div>
        <DialogFooter>
          <Button
            type="button"
            disabled={save.isPending}
            onClick={() => {
              if (!target) return;
              const amountEgp = Number.parseInt(amount, 10);
              save.mutate({
                studyId: target.studyId,
                contactId: target.contactId,
                type,
                status: isMoney ? status : "promised",
                amountEgp:
                  isMoney && Number.isFinite(amountEgp) ? amountEgp : undefined,
                priceQuoted: price.trim() || undefined,
                note: note.trim() || undefined,
              });
            }}
          >
            <LoadingSwap isLoading={save.isPending}>
              {t("discovery.save")}
            </LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
