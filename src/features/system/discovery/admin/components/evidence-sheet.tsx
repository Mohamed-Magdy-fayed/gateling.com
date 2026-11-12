"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  type DiscoveryEvidenceKind,
  type DiscoveryStance,
  discoveryEvidenceKindValues,
} from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

import { EVIDENCE_KIND_KEY } from "../labels";
import { ChoiceChips } from "./choice-chips";

export type EvidenceTarget = {
  studyId: string;
  contactId: string;
  touchpointId?: string;
  /** Pre-fills the quote, usually their reply. */
  quote?: string | null;
};

/**
 * Tag what someone said: pick the kind, keep their exact words, tick the
 * hypotheses it speaks to. A bottom sheet so it works one-handed on a phone.
 */
export function EvidenceSheet({
  target,
  onOpenChange,
}: {
  target: EvidenceTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const ids = useId();
  const [kind, setKind] = useState<DiscoveryEvidenceKind | null>(null);
  const [quote, setQuote] = useState("");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [stances, setStances] = useState<Record<string, DiscoveryStance>>({});
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!target) return;
    setKind(null);
    setQuote(target.quote ?? "");
    setNote("");
    setAmount("");
    setStances({});
    setShowErrors(false);
  }, [target]);

  const study = useQuery({
    ...trpc.discovery.getStudy.queryOptions({ id: target?.studyId ?? "" }),
    enabled: Boolean(target),
  });

  const save = useMutation(
    trpc.discovery.addEvidence.mutationOptions({
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

  function submit() {
    if (!target || !kind || !quote.trim()) {
      setShowErrors(true);
      return;
    }
    const amountEgp = Number.parseInt(amount, 10);
    save.mutate({
      studyId: target.studyId,
      contactId: target.contactId,
      touchpointId: target.touchpointId,
      kind,
      quote: quote.trim(),
      note: note.trim() || undefined,
      amountEgp: Number.isFinite(amountEgp) ? amountEgp : undefined,
      hypotheses: Object.entries(stances).map(([hypothesisId, stance]) => ({
        hypothesisId,
        stance,
      })),
    });
  }

  function toggle(id: string, stance: DiscoveryStance, checked: boolean) {
    setStances((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return checked ? { ...rest, [id]: stance } : rest;
    });
  }

  const showAmount = kind === "cost_loss" || kind === "money_commitment";

  return (
    <Sheet open={Boolean(target)} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto w-full max-w-2xl">
        <SheetHeader>
          <SheetTitle>{t("discovery.evidenceTitle")}</SheetTitle>
          <SheetDescription>{t("discovery.evidenceDesc")}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <FieldGroup>
            <Field data-invalid={showErrors && !kind}>
              <FieldLabel>{t("discovery.fieldKind")}</FieldLabel>
              <ChoiceChips
                label={t("discovery.fieldKind")}
                value={kind}
                onChange={setKind}
                options={discoveryEvidenceKindValues.map((value) => ({
                  value,
                  label: t(EVIDENCE_KIND_KEY[value]),
                }))}
              />
              {showErrors && !kind && (
                <p role="alert" className="text-destructive text-xs">
                  {t("discovery.required")}
                </p>
              )}
            </Field>
            <Field data-invalid={showErrors && !quote.trim()}>
              <FieldLabel htmlFor={`${ids}-quote`}>
                {t("discovery.fieldQuote")}
              </FieldLabel>
              <Textarea
                id={`${ids}-quote`}
                dir="auto"
                rows={3}
                value={quote}
                aria-invalid={showErrors && !quote.trim()}
                onChange={(e) => setQuote(e.target.value)}
              />
            </Field>
            {showAmount && (
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
            {(study.data?.hypotheses.length ?? 0) > 0 && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-medium">
                  {t("discovery.fieldHypotheses")}
                </legend>
                {study.data?.hypotheses.map((h) => (
                  <div key={h.id} className="flex items-start gap-3 py-1">
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-semibold">{h.code}</span>{" "}
                      <span className="text-muted-foreground">
                        {h.statement}
                      </span>
                    </span>
                    {(["supports", "contradicts"] as const).map((stance) => {
                      const id = `${ids}-${h.id}-${stance}`;
                      return (
                        <label
                          key={stance}
                          htmlFor={id}
                          className="flex min-h-11 items-center gap-1.5 text-xs sm:min-h-8"
                        >
                          <Checkbox
                            id={id}
                            checked={stances[h.id] === stance}
                            onCheckedChange={(checked) =>
                              toggle(h.id, stance, checked === true)
                            }
                          />
                          {stance === "supports"
                            ? t("discovery.stanceSupports")
                            : t("discovery.stanceContradicts")}
                        </label>
                      );
                    })}
                  </div>
                ))}
              </fieldset>
            )}
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
        <SheetFooter>
          <Button
            type="button"
            className="min-h-11 sm:min-h-8"
            disabled={save.isPending}
            onClick={submit}
          >
            <LoadingSwap isLoading={save.isPending}>
              {t("discovery.save")}
            </LoadingSwap>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
