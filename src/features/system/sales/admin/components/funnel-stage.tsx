"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRightIcon, VideoIcon } from "lucide-react";
import { useId } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type FunnelPosition,
  VIDEO_SENT_OUTCOME,
} from "@/features/system/sales/lib/funnel";
import { useTRPC } from "@/integrations/trpc/client";

import { funnelCopy } from "./funnel-copy";

/** Dates in the operator's locale; times only where a time was agreed. */
function useFunnelCopy(position: FunnelPosition) {
  const { t, locale } = useTranslation();
  const dateOnly = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const dateTime = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  return funnelCopy(position, t, (date, withTime) =>
    (withTime ? dateTime : dateOnly).format(date),
  );
}

/**
 * Lead page: which funnel stage the client is in and the next step, in plain
 * words. At the "send the video" step it offers the one-tap log that moves
 * the lead from Discovery to Outreach.
 */
export function FunnelStageCard({
  leadId,
  position,
}: {
  leadId: string;
  position: FunnelPosition;
}) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const headingId = useId();
  const copy = useFunnelCopy(position);

  const markVideoSent = useMutation(
    trpc.sales.logActivity.mutationOptions({
      onSuccess: async () => {
        toast.success(t("sales.funnel.videoSentSaved"));
        await queryClient.invalidateQueries();
      },
      onError: () => toast.error(t("sales.funnel.videoSentFailed")),
    }),
  );

  return (
    <section aria-labelledby={headingId}>
      <Card data-testid="funnel-stage-card">
        <CardHeader className="gap-2">
          <CardTitle
            id={headingId}
            className="flex flex-wrap items-center gap-2 text-base"
          >
            {t("sales.funnel.title")}
            <Badge variant="secondary">{copy.stage}</Badge>
            {copy.progress && (
              <span className="font-normal text-muted-foreground text-xs">
                {copy.progress}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p>{copy.now}</p>
          <p className="flex items-start gap-2 font-medium">
            <ArrowRightIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-primary rtl:rotate-180"
            />
            <span>
              <span className="sr-only">{t("sales.funnel.nextLabel")}: </span>
              {copy.next}
            </span>
          </p>
          {position.step.id === "sendVideo" && (
            <Button
              size="lg"
              className="self-start"
              disabled={markVideoSent.isPending}
              onClick={() =>
                markVideoSent.mutate({
                  leadId,
                  type: "whatsapp_sent",
                  channel: "whatsapp",
                  outcome: VIDEO_SENT_OUTCOME,
                  pipelineStatus: "awaiting_reply",
                })
              }
            >
              <LoadingSwap isLoading={markVideoSent.isPending}>
                <span className="inline-flex items-center gap-2">
                  <VideoIcon aria-hidden="true" className="size-4" />
                  {t("sales.funnel.markVideoSent")}
                </span>
              </LoadingSwap>
            </Button>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

/** Today card: the stage and the next step on one short line. */
export function FunnelStageLine({ position }: { position: FunnelPosition }) {
  const copy = useFunnelCopy(position);
  return (
    <p className="text-muted-foreground text-sm">
      <span className="font-medium text-foreground">{copy.stage}</span>
      {" · "}
      {copy.next}
    </p>
  );
}
