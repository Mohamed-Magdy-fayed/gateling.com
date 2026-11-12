"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, PencilIcon, PlusIcon } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { H1, H3, Muted } from "@/components/ui/typography";
import {
  type DiscoveryStep,
  type DiscoveryTemplate,
  discoveryStepValues,
} from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

import { STEP_KEY } from "./labels";
import { StatsTable } from "./study-page";

const ALL = "all";

export function DiscoveryTemplatesPage() {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const number = new Intl.NumberFormat(locale);
  const [editing, setEditing] = useState<DiscoveryTemplate | "new" | null>(
    null,
  );
  const templates = useQuery(
    trpc.discovery.listTemplates.queryOptions({ includeInactive: true }),
  );
  const stats = useQuery(trpc.discovery.templateStats.queryOptions());
  const studies = useQuery(trpc.discovery.listStudies.queryOptions());
  const byTemplate = new Map(
    (stats.data?.byTemplate ?? []).map((s) => [s.key, s]),
  );

  async function copy(body: string) {
    try {
      await navigator.clipboard.writeText(body);
      toast.success(t("discovery.copied"));
    } catch {
      toast.error(t("discovery.saveFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <H1>{t("discovery.templatesTitle")}</H1>
          <Muted className="max-w-prose text-pretty">
            {t("discovery.templatesLead")}
          </Muted>
        </div>
        <Button
          className="min-h-11 sm:min-h-8"
          onClick={() => setEditing("new")}
        >
          <PlusIcon aria-hidden="true" />
          {t("discovery.newTemplate")}
        </Button>
      </header>

      {templates.isError && (
        <Alert variant="destructive">
          <AlertDescription>{t("discovery.loadFailed")}</AlertDescription>
        </Alert>
      )}
      {templates.isPending && <Skeleton className="h-40 w-full" />}
      {templates.data?.length === 0 && (
        <Muted>{t("discovery.noTemplatesYet")}</Muted>
      )}

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {templates.data?.map((tpl) => {
          const s = byTemplate.get(tpl.id);
          return (
            <li key={tpl.id}>
              <Card className={tpl.active ? "h-full" : "h-full opacity-60"}>
                <CardContent className="flex h-full flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <H3 className="min-w-0">{tpl.title}</H3>
                    <Badge variant="outline">{t(STEP_KEY[tpl.step])}</Badge>
                  </div>
                  <p className="flex-1 text-sm whitespace-pre-wrap" dir="auto">
                    {tpl.body}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {t("discovery.sentReplied", {
                        sent: number.format(s?.sent ?? 0),
                        replied: number.format(s?.replied ?? 0),
                      })}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ms-auto min-h-11 sm:min-h-6"
                      onClick={() => copy(tpl.body)}
                    >
                      <CopyIcon aria-hidden="true" />
                      {t("discovery.copy")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-h-11 sm:min-h-6"
                      onClick={() => setEditing(tpl)}
                    >
                      <PencilIcon aria-hidden="true" />
                      {t("discovery.editTemplate")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      {stats.data && (
        <StatsTable
          title={t("discovery.byPersona")}
          rows={stats.data.byPersona}
          label={(key) =>
            key === "gateling"
              ? t("discovery.personaGateling")
              : t("discovery.personaPersonal")
          }
        />
      )}

      <TemplateDialog
        key={
          editing === null ? "closed" : editing === "new" ? "new" : editing.id
        }
        template={editing}
        studies={(studies.data ?? []).map((s) => ({
          id: s.id,
          title: s.title,
        }))}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

function TemplateDialog({
  template,
  studies,
  onClose,
}: {
  template: DiscoveryTemplate | "new" | null;
  studies: { id: string; title: string }[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const ids = useId();
  const existing = template && template !== "new" ? template : null;
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [step, setStep] = useState<DiscoveryStep>(existing?.step ?? "problem");
  const [studyId, setStudyId] = useState<string>(existing?.studyId ?? ALL);
  const [active, setActive] = useState(existing?.active ?? true);
  const [showErrors, setShowErrors] = useState(false);

  const options = {
    onSuccess: async () => {
      toast.success(t("discovery.saved"));
      await queryClient.invalidateQueries({
        queryKey: trpc.discovery.pathKey(),
      });
      onClose();
    },
    onError: () => toast.error(t("discovery.saveFailed")),
  };
  const create = useMutation(
    trpc.discovery.createTemplate.mutationOptions(options),
  );
  const update = useMutation(
    trpc.discovery.updateTemplate.mutationOptions(options),
  );
  const pending = create.isPending || update.isPending;

  function submit() {
    if (!title.trim() || !body.trim()) {
      setShowErrors(true);
      return;
    }
    const input = {
      title: title.trim(),
      body: body.trim(),
      step,
      studyId: studyId === ALL ? null : studyId,
      active,
    };
    if (existing) update.mutate({ id: existing.id, ...input });
    else create.mutate(input);
  }

  return (
    <Dialog
      open={template !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {existing
              ? t("discovery.editTemplate")
              : t("discovery.newTemplate")}
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <FieldGroup>
            <Field data-invalid={showErrors && !title.trim()}>
              <FieldLabel htmlFor={`${ids}-title`}>
                {t("discovery.fieldTitle")}
              </FieldLabel>
              <Input
                id={`${ids}-title`}
                dir="auto"
                value={title}
                aria-invalid={showErrors && !title.trim()}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field data-invalid={showErrors && !body.trim()}>
              <FieldLabel htmlFor={`${ids}-body`}>
                {t("discovery.fieldBody")}
              </FieldLabel>
              <Textarea
                id={`${ids}-body`}
                dir="auto"
                rows={6}
                value={body}
                aria-invalid={showErrors && !body.trim()}
                onChange={(e) => setBody(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>{t("discovery.stepLabel")}</FieldLabel>
              <Select
                value={step}
                onValueChange={(v) => setStep(v as DiscoveryStep)}
              >
                <SelectTrigger aria-label={t("discovery.stepLabel")}>
                  <SelectValue>
                    {(v: DiscoveryStep) => t(STEP_KEY[v])}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {discoveryStepValues.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(STEP_KEY[s])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>{t("discovery.fieldStudy")}</FieldLabel>
              <Select
                value={studyId}
                onValueChange={(v) => setStudyId(String(v))}
              >
                <SelectTrigger aria-label={t("discovery.fieldStudy")}>
                  <SelectValue>
                    {(v: string) =>
                      v === ALL
                        ? t("discovery.allStudies")
                        : (studies.find((s) => s.id === v)?.title ?? v)
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>
                    {t("discovery.allStudies")}
                  </SelectItem>
                  {studies.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field orientation="horizontal">
              <Switch
                id={`${ids}-active`}
                checked={active}
                onCheckedChange={(checked) => setActive(checked === true)}
              />
              <FieldLabel htmlFor={`${ids}-active`}>
                {t("discovery.fieldActive")}
              </FieldLabel>
            </Field>
          </FieldGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("discovery.cancel")}
          </Button>
          <Button disabled={pending} onClick={submit}>
            <LoadingSwap isLoading={pending}>{t("discovery.save")}</LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
