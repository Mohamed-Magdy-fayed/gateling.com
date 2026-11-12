"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H1, H3, Muted } from "@/components/ui/typography";
import {
  type DiscoveryStep,
  type DiscoveryVerdict,
  discoveryStepValues,
} from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import type { ReplyStat } from "@/features/system/discovery/lib/reply-stats";
import type { DiscoveryStudyDetail } from "@/features/system/discovery/server/router";
import { useTRPC } from "@/integrations/trpc/client";

import {
  CommitmentDialog,
  type CommitmentTarget,
} from "./components/commitment-dialog";
import {
  EvidenceSheet,
  type EvidenceTarget,
} from "./components/evidence-sheet";
import { TouchpointRow } from "./components/touchpoint-row";
import {
  CHANNEL_KEY,
  COMMITMENT_STATUS_KEY,
  COMMITMENT_TYPE_KEY,
  durationParts,
  EVIDENCE_KIND_KEY,
  PERSONA_KEY,
  STEP_KEY,
  VERDICT_KEY,
  VERDICT_STATUS_VARIANT,
} from "./labels";

const VERDICT_HINT_KEY = {
  go: "discovery.verdictGoHint",
  fix_pitch: "discovery.verdictFixPitchHint",
  kill: "discovery.verdictKillHint",
} as const;

export function DiscoveryStudyPage({ studyId }: { studyId: string }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const [evidenceTarget, setEvidenceTarget] = useState<EvidenceTarget | null>(
    null,
  );
  const [commitmentTarget, setCommitmentTarget] =
    useState<CommitmentTarget | null>(null);

  const study = useQuery(trpc.discovery.getStudy.queryOptions({ id: studyId }));

  if (study.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (study.isError || !study.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("discovery.loadFailed")}</AlertDescription>
      </Alert>
    );
  }

  const detail = study.data;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <H1 className="text-balance">{detail.study.title}</H1>
          <Muted className="max-w-prose text-pretty" dir="auto">
            {detail.study.problemStatement}
          </Muted>
        </div>
        <Button
          className="min-h-11 sm:min-h-8"
          render={<Link href={`/discovery/log?studyId=${studyId}`} />}
        >
          <MessageSquarePlusIcon aria-hidden="true" />
          {t("discovery.logButton")}
        </Button>
      </header>

      <StepStepper detail={detail} />
      <ReadoutCard detail={detail} />
      <HypothesesCard detail={detail} />

      <Tabs defaultValue="evidence">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="evidence">
              {t("discovery.tabEvidence")}
            </TabsTrigger>
            <TabsTrigger value="waiting">
              {t("discovery.tabWaiting")}
            </TabsTrigger>
            <TabsTrigger value="all">
              {t("discovery.tabTouchpoints")}
            </TabsTrigger>
            <TabsTrigger value="money">
              {t("discovery.tabCommitments")}
            </TabsTrigger>
            <TabsTrigger value="replies">
              {t("discovery.tabReplies")}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="evidence">
          <EvidenceFeed studyId={studyId} detail={detail} />
        </TabsContent>
        <TabsContent value="waiting">
          <TouchpointFeed
            studyId={studyId}
            waitingOnly
            onTagEvidence={setEvidenceTarget}
            onCommit={setCommitmentTarget}
            priceQuoted={detail.study.priceQuoted}
          />
        </TabsContent>
        <TabsContent value="all">
          <TouchpointFeed
            studyId={studyId}
            waitingOnly={false}
            onTagEvidence={setEvidenceTarget}
            onCommit={setCommitmentTarget}
            priceQuoted={detail.study.priceQuoted}
          />
        </TabsContent>
        <TabsContent value="money">
          <CommitmentFeed studyId={studyId} />
        </TabsContent>
        <TabsContent value="replies">
          <ReplyStatsView detail={detail} />
        </TabsContent>
      </Tabs>

      <EvidenceSheet
        target={evidenceTarget}
        onOpenChange={(open) => !open && setEvidenceTarget(null)}
      />
      <CommitmentDialog
        target={commitmentTarget}
        onOpenChange={(open) => !open && setCommitmentTarget(null)}
      />
    </div>
  );
}

function useUpdateStudy() {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.discovery.updateStudy.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: trpc.discovery.pathKey() }),
      onError: () => toast.error(t("discovery.saveFailed")),
    }),
  );
}

/** The 6 steps, start → end, so it mirrors in RTL with no extra classes. */
function StepStepper({ detail }: { detail: DiscoveryStudyDetail }) {
  const { t } = useTranslation();
  const update = useUpdateStudy();
  const current = discoveryStepValues.indexOf(detail.study.step);
  const suggested = detail.readout.suggestedStep;

  return (
    <nav aria-label={t("discovery.stepLabel")} className="flex flex-col gap-2">
      <ol className="flex flex-wrap gap-2">
        {discoveryStepValues.map((step, index) => (
          <li key={step}>
            <Badge
              variant={
                index === current
                  ? "default"
                  : index < current
                    ? "secondary"
                    : "outline"
              }
              aria-current={index === current ? "step" : undefined}
            >
              {index + 1}. {t(STEP_KEY[step])}
            </Badge>
          </li>
        ))}
      </ol>
      {suggested && (
        <Alert>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            {t("discovery.suggestedStep", { step: t(STEP_KEY[suggested]) })}
            <Button
              size="sm"
              variant="outline"
              disabled={update.isPending}
              onClick={() =>
                update.mutate({ id: detail.study.id, step: suggested })
              }
            >
              {t("discovery.moveToStep")}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">
          {t("discovery.stepLabel")}
        </span>
        <Select
          value={detail.study.step}
          onValueChange={(value) =>
            update.mutate({ id: detail.study.id, step: value as DiscoveryStep })
          }
        >
          <SelectTrigger size="sm" aria-label={t("discovery.stepLabel")}>
            <SelectValue>
              {(value: DiscoveryStep) => t(STEP_KEY[value])}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {discoveryStepValues.map((step) => (
              <SelectItem key={step} value={step}>
                {t(STEP_KEY[step])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </nav>
  );
}

function ReadoutCard({ detail }: { detail: DiscoveryStudyDetail }) {
  const { t, locale } = useTranslation();
  const number = new Intl.NumberFormat(locale);
  const { readout, study } = detail;
  const hint =
    readout.verdict === "collecting"
      ? t("discovery.verdictCollectingHint", {
          count: number.format(readout.conversations),
          target: number.format(study.targetConversations),
        })
      : t(VERDICT_HINT_KEY[readout.verdict]);

  const stats = [
    ["discovery.statConversations", readout.conversations],
    ["discovery.statStories", readout.stories],
    ["discovery.statCommitments", readout.commitments],
    ["discovery.statPaid", readout.paidCommitments],
    ["discovery.statCompliments", readout.compliments],
  ] as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <Status variant={VERDICT_STATUS_VARIANT[readout.verdict]}>
            <StatusIndicator />
            <StatusLabel>{t(VERDICT_KEY[readout.verdict])}</StatusLabel>
          </Status>
          <CardTitle className="text-pretty">{hint}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {stats.map(([key, value]) => (
            <div key={key} className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-xs">{t(key)}</dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {number.format(value)}
              </dd>
            </div>
          ))}
        </dl>
        <Muted className="text-xs">
          {t("discovery.arguedSplit", {
            price: number.format(readout.arguedPrice),
            need: number.format(readout.arguedNeed),
          })}
          {study.priceQuoted && (
            <>
              {" · "}
              {t("discovery.priceQuoted")}:{" "}
              <span dir="auto">{study.priceQuoted}</span>
            </>
          )}
        </Muted>
        <Muted className="max-w-prose text-xs text-pretty">
          {t("discovery.definitions")}
        </Muted>
      </CardContent>
    </Card>
  );
}

function HypothesesCard({ detail }: { detail: DiscoveryStudyDetail }) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const number = new Intl.NumberFormat(locale);
  const setVerdict = useMutation(
    trpc.discovery.setHypothesisVerdict.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: trpc.discovery.pathKey() }),
      onError: () => toast.error(t("discovery.saveFailed")),
    }),
  );
  const results = new Map(detail.readout.hypotheses.map((r) => [r.id, r]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("discovery.hypotheses")}</CardTitle>
      </CardHeader>
      <CardContent>
        {detail.hypotheses.length === 0 ? (
          <Muted>{t("discovery.noHypotheses")}</Muted>
        ) : (
          <ul className="flex flex-col divide-y">
            {detail.hypotheses.map((h) => {
              const r = results.get(h.id);
              const pct = r
                ? Math.min(100, Math.round((r.supporting / r.threshold) * 100))
                : 0;
              return (
                <li key={h.id} className="flex flex-col gap-2 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-sm" dir="auto">
                      <span className="font-semibold">{h.code}</span>{" "}
                      {h.statement}
                    </p>
                    <Status variant={r?.passed ? "success" : "default"}>
                      <StatusLabel>
                        {r?.passed
                          ? t("discovery.passed")
                          : t("discovery.notYet")}
                      </StatusLabel>
                    </Status>
                  </div>
                  <Muted className="text-xs" dir="auto">
                    {t("discovery.passRule")}: {h.passRule}
                  </Muted>
                  {h.measure !== "manual" && r && (
                    <div className="flex items-center gap-3">
                      <div
                        className="bg-muted h-2 flex-1 overflow-hidden rounded-full"
                        role="progressbar"
                        aria-label={h.code}
                        aria-valuemin={0}
                        aria-valuemax={r.threshold}
                        aria-valuenow={r.supporting}
                      >
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ inlineSize: `${pct}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {t("discovery.progress", {
                          count: number.format(r.supporting),
                          threshold: number.format(r.threshold),
                        })}
                        {r.contradicting > 0 &&
                          ` · ${t("discovery.contradicting", {
                            count: number.format(r.contradicting),
                          })}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {t("discovery.verdictOverride")}
                    </span>
                    <Select
                      value={h.verdict}
                      onValueChange={(value) =>
                        setVerdict.mutate({
                          id: h.id,
                          verdict: value as DiscoveryVerdict,
                        })
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        aria-label={`${t("discovery.verdictOverride")} ${h.code}`}
                      >
                        <SelectValue>
                          {(value: DiscoveryVerdict) =>
                            t(VERDICT_OVERRIDE_KEY[value])
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(["open", "true", "false"] as const).map((v) => (
                          <SelectItem key={v} value={v}>
                            {t(VERDICT_OVERRIDE_KEY[v])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

const VERDICT_OVERRIDE_KEY = {
  open: "discovery.verdictOpen",
  true: "discovery.verdictTrue",
  false: "discovery.verdictFalse",
} as const satisfies Record<DiscoveryVerdict, string>;

function EvidenceFeed({
  studyId,
  detail,
}: {
  studyId: string;
  detail: DiscoveryStudyDetail;
}) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const evidence = useQuery(
    trpc.discovery.listEvidence.queryOptions({ studyId }),
  );
  const remove = useMutation(
    trpc.discovery.deleteEvidence.mutationOptions({
      onSuccess: async () => {
        toast.success(t("discovery.deleted"));
        await queryClient.invalidateQueries({
          queryKey: trpc.discovery.pathKey(),
        });
      },
      onError: () => toast.error(t("discovery.saveFailed")),
    }),
  );
  const codes = new Map(detail.hypotheses.map((h) => [h.id, h.code]));

  if (evidence.isPending) return <Skeleton className="h-32 w-full" />;
  if (evidence.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("discovery.loadFailed")}</AlertDescription>
      </Alert>
    );
  }
  if (evidence.data.length === 0)
    return <Muted>{t("discovery.noEvidence")}</Muted>;

  return (
    <>
      <ul className="flex flex-col">
        {evidence.data.map((e) => (
          <li key={e.id} className="flex flex-col gap-1 border-b py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={e.kind === "compliment" ? "outline" : "secondary"}
              >
                {t(EVIDENCE_KIND_KEY[e.kind])}
              </Badge>
              {e.links.map((l) => (
                <Badge
                  key={l.hypothesisId}
                  variant={l.stance === "supports" ? "default" : "destructive"}
                >
                  {codes.get(l.hypothesisId)}
                </Badge>
              ))}
              <Link
                href={`/discovery/contacts/${e.contactId}`}
                className="text-muted-foreground text-xs hover:underline"
              >
                {e.contactName}
              </Link>
              <Button
                size="icon"
                variant="ghost"
                className="ms-auto"
                aria-label={t("discovery.deleteEvidence")}
                onClick={() => setPendingDelete(e.id)}
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            </div>
            <blockquote
              className={
                e.kind === "compliment"
                  ? "text-muted-foreground border-s-2 ps-3 text-sm"
                  : "border-primary border-s-2 ps-3 text-sm"
              }
              dir="auto"
            >
              {e.quote}
            </blockquote>
            {e.note && (
              <Muted className="text-xs" dir="auto">
                {e.note}
              </Muted>
            )}
          </li>
        ))}
      </ul>
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("discovery.deleteEvidence")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("discovery.deleteEvidenceConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("discovery.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDelete) remove.mutate({ id: pendingDelete });
                setPendingDelete(null);
              }}
            >
              {t("discovery.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TouchpointFeed({
  studyId,
  waitingOnly,
  onTagEvidence,
  onCommit,
  priceQuoted,
}: {
  studyId: string;
  waitingOnly: boolean;
  onTagEvidence: (target: EvidenceTarget) => void;
  onCommit: (target: CommitmentTarget) => void;
  priceQuoted: string | null;
}) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const list = useQuery(
    trpc.discovery.listTouchpoints.queryOptions({ studyId, waitingOnly }),
  );

  if (list.isPending) return <Skeleton className="h-32 w-full" />;
  if (list.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("discovery.loadFailed")}</AlertDescription>
      </Alert>
    );
  }
  if (list.data.length === 0) {
    return (
      <Muted>
        {waitingOnly ? t("discovery.noWaiting") : t("discovery.noTouchpoints")}
      </Muted>
    );
  }
  return (
    <div className="flex flex-col">
      {list.data.map((tp) => (
        <div key={tp.id}>
          <TouchpointRow
            touchpoint={tp}
            onTagEvidence={(row) =>
              onTagEvidence({
                studyId: row.studyId,
                contactId: row.contactId,
                touchpointId: row.id,
                quote:
                  row.replyText ??
                  (row.direction === "inbound" ? row.message : null),
              })
            }
          />
          {!waitingOnly && (
            <Button
              size="sm"
              variant="link"
              className="-mt-2 mb-2 px-0"
              onClick={() =>
                onCommit({ studyId, contactId: tp.contactId, priceQuoted })
              }
            >
              {t("discovery.logCommitment")}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function CommitmentFeed({ studyId }: { studyId: string }) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const number = new Intl.NumberFormat(locale);
  const list = useQuery(
    trpc.discovery.listCommitments.queryOptions({ studyId }),
  );

  if (list.isPending) return <Skeleton className="h-32 w-full" />;
  if (list.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("discovery.loadFailed")}</AlertDescription>
      </Alert>
    );
  }
  if (list.data.length === 0)
    return <Muted>{t("discovery.noCommitments")}</Muted>;
  return (
    <ul className="flex flex-col">
      {list.data.map((c) => (
        <li
          key={c.id}
          className="flex flex-wrap items-center gap-2 border-b py-3 text-sm"
        >
          <Link
            href={`/discovery/contacts/${c.contactId}`}
            className="font-medium hover:underline"
          >
            {c.contactName}
          </Link>
          <Badge variant="secondary">{t(COMMITMENT_TYPE_KEY[c.type])}</Badge>
          <Badge variant={c.status === "paid" ? "default" : "outline"}>
            {t(COMMITMENT_STATUS_KEY[c.status])}
          </Badge>
          {c.amountEgp !== null && (
            <span className="tabular-nums">
              {t("discovery.amountEgp", { amount: number.format(c.amountEgp) })}
            </span>
          )}
          {c.note && (
            <Muted className="w-full text-xs" dir="auto">
              {c.note}
            </Muted>
          )}
        </li>
      ))}
    </ul>
  );
}

function ReplyStatsView({ detail }: { detail: DiscoveryStudyDetail }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const templates = useQuery(
    trpc.discovery.listTemplates.queryOptions({
      studyId: detail.study.id,
      includeInactive: true,
    }),
  );
  const titles = new Map(
    (templates.data ?? []).map((tpl) => [tpl.id, tpl.title]),
  );
  const { byPersona, byTemplate, byChannel } = detail.replyStats;

  if (byChannel.length === 0) return <Muted>{t("discovery.noReplies")}</Muted>;
  return (
    <div className="flex flex-col gap-6">
      <StatsTable
        title={t("discovery.byPersona")}
        rows={byPersona}
        label={(key) =>
          key === "personal" || key === "gateling" ? t(PERSONA_KEY[key]) : key
        }
      />
      <StatsTable
        title={t("discovery.byTemplate")}
        rows={byTemplate}
        label={(key) => titles.get(key) ?? t("discovery.noTemplate")}
      />
      <StatsTable
        title={t("discovery.byChannel")}
        rows={byChannel}
        label={(key) =>
          key in CHANNEL_KEY
            ? t(CHANNEL_KEY[key as keyof typeof CHANNEL_KEY])
            : key
        }
      />
    </div>
  );
}

export function StatsTable({
  title,
  rows,
  label,
}: {
  title: string;
  rows: ReplyStat[];
  label: (key: string) => string;
}) {
  const { t, locale } = useTranslation();
  const number = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent" });
  if (rows.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <H3>{title}</H3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead className="text-end">
                {t("discovery.colSent")}
              </TableHead>
              <TableHead className="text-end">
                {t("discovery.colReplied")}
              </TableHead>
              <TableHead className="text-end">
                {t("discovery.colRate")}
              </TableHead>
              <TableHead className="text-end">
                {t("discovery.colMedian")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const median =
                row.medianReplyMinutes === null
                  ? null
                  : durationParts(row.medianReplyMinutes);
              return (
                <TableRow key={row.key}>
                  <TableCell className="font-medium">
                    {label(row.key)}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {number.format(row.sent)}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {number.format(row.replied)}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {row.rate === null ? "—" : percent.format(row.rate)}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {median
                      ? t(median[0], { count: number.format(median[1]) })
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
