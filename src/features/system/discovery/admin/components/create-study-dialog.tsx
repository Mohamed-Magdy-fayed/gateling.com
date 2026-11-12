"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

type HypothesisDraft = {
  key: string;
  code: string;
  statement: string;
  passRule: string;
  passThreshold: string;
};

function emptyHypothesis(index: number): HypothesisDraft {
  return {
    key: crypto.randomUUID(),
    code: `H${index + 1}`,
    statement: "",
    passRule: "",
    passThreshold: "5",
  };
}

export function CreateStudyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const ids = useId();
  const [title, setTitle] = useState("");
  const [niche, setNiche] = useState("");
  const [problem, setProblem] = useState("");
  const [price, setPrice] = useState("");
  const [hypotheses, setHypotheses] = useState<HypothesisDraft[]>([
    emptyHypothesis(0),
  ]);
  const [showErrors, setShowErrors] = useState(false);

  const create = useMutation(
    trpc.discovery.createStudy.mutationOptions({
      onSuccess: async (study) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.discovery.pathKey(),
        });
        onOpenChange(false);
        router.push(`/discovery/studies/${study.id}`);
      },
      onError: () => toast.error(t("discovery.saveFailed")),
    }),
  );

  function update(key: string, patch: Partial<HypothesisDraft>) {
    setHypotheses((prev) =>
      prev.map((h) => (h.key === key ? { ...h, ...patch } : h)),
    );
  }

  function submit() {
    if (!title.trim() || !niche.trim() || !problem.trim()) {
      setShowErrors(true);
      return;
    }
    create.mutate({
      title: title.trim(),
      niche: niche.trim(),
      problemStatement: problem.trim(),
      priceQuoted: price.trim() || undefined,
      hypotheses: hypotheses
        .filter((h) => h.statement.trim() && h.passRule.trim())
        .map((h, index) => ({
          code: h.code.trim() || `H${index + 1}`,
          statement: h.statement.trim(),
          passRule: h.passRule.trim(),
          passThreshold: Math.max(1, Number.parseInt(h.passThreshold, 10) || 5),
          measure: "supporting_contacts" as const,
          sortOrder: index + 1,
        })),
    });
  }

  const invalid = (value: string) => showErrors && !value.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("discovery.createStudyTitle")}</DialogTitle>
          <DialogDescription>
            {t("discovery.createStudyDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <FieldGroup>
            <Field data-invalid={invalid(title)}>
              <FieldLabel htmlFor={`${ids}-title`}>
                {t("discovery.fieldTitle")}
              </FieldLabel>
              <Input
                id={`${ids}-title`}
                dir="auto"
                value={title}
                aria-invalid={invalid(title)}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field data-invalid={invalid(niche)}>
              <FieldLabel htmlFor={`${ids}-niche`}>
                {t("discovery.fieldNiche")}
              </FieldLabel>
              <Input
                id={`${ids}-niche`}
                dir="auto"
                value={niche}
                aria-invalid={invalid(niche)}
                onChange={(e) => setNiche(e.target.value)}
              />
            </Field>
            <Field data-invalid={invalid(problem)}>
              <FieldLabel htmlFor={`${ids}-problem`}>
                {t("discovery.fieldProblem")}
              </FieldLabel>
              <Textarea
                id={`${ids}-problem`}
                dir="auto"
                rows={3}
                value={problem}
                aria-invalid={invalid(problem)}
                onChange={(e) => setProblem(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${ids}-price`}>
                {t("discovery.fieldPrice")}
              </FieldLabel>
              <Input
                id={`${ids}-price`}
                dir="auto"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-2 text-sm font-medium">
                {t("discovery.hypotheses")}
              </legend>
              {hypotheses.map((h) => (
                <div
                  key={h.key}
                  className="grid grid-cols-1 gap-2 border-b pb-3 sm:grid-cols-[5rem_1fr]"
                >
                  <Input
                    aria-label={t("discovery.fieldHypCode")}
                    dir="ltr"
                    className="text-start"
                    value={h.code}
                    onChange={(e) => update(h.key, { code: e.target.value })}
                  />
                  <div className="flex flex-col gap-2">
                    <Textarea
                      aria-label={t("discovery.fieldHypStatement")}
                      placeholder={t("discovery.fieldHypStatement")}
                      dir="auto"
                      rows={2}
                      value={h.statement}
                      onChange={(e) =>
                        update(h.key, { statement: e.target.value })
                      }
                    />
                    <div className="flex gap-2">
                      <Input
                        aria-label={t("discovery.fieldHypRule")}
                        placeholder={t("discovery.fieldHypRule")}
                        dir="auto"
                        className="min-w-0 flex-1"
                        value={h.passRule}
                        onChange={(e) =>
                          update(h.key, { passRule: e.target.value })
                        }
                      />
                      <Input
                        aria-label={t("discovery.fieldHypThreshold")}
                        inputMode="numeric"
                        dir="ltr"
                        className="w-16 text-start"
                        value={h.passThreshold}
                        onChange={(e) =>
                          update(h.key, {
                            passThreshold: e.target.value.replace(/\D/g, ""),
                          })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("discovery.removeHypothesis")}
                        disabled={hypotheses.length === 1}
                        onClick={() =>
                          setHypotheses((prev) =>
                            prev.filter((x) => x.key !== h.key),
                          )
                        }
                      >
                        <Trash2Icon aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="self-start"
                onClick={() =>
                  setHypotheses((prev) => [
                    ...prev,
                    emptyHypothesis(prev.length),
                  ])
                }
              >
                <PlusIcon aria-hidden="true" />
                {t("discovery.addHypothesis")}
              </Button>
            </fieldset>
          </FieldGroup>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("discovery.cancel")}
          </Button>
          <Button type="button" disabled={create.isPending} onClick={submit}>
            <LoadingSwap isLoading={create.isPending}>
              {t("discovery.create")}
            </LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
