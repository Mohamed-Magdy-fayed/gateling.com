"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRightIcon, VideoIcon } from "lucide-react";
import { useId } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type FunnelPosition,
  VIDEO_SENT_OUTCOME,
} from "@/features/system/sales/lib/funnel";
import type { YesAnswers } from "@/features/system/sales/lib/yeses";
import { useTRPC } from "@/integrations/trpc/client";

import { funnelCopy } from "./funnel-copy";
import { YesPath, YesProgress } from "./yes-checklist";

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
 * Lead page: where the client is, in one card. The header names the funnel
 * stage and shows the yes bar; the body is the path of seven yeses to tick;
 * the footer says what is happening now and the next step. At the "send the
 * video" step it offers the one-tap log that moves Discovery to Outreach.
 */
export function LeadProgressCard({
  leadId,
  position,
  yesAnswers,
}: {
  leadId: string;
  position: FunnelPosition;
  yesAnswers: YesAnswers;
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
      <Card data-testid="lead-progress-card" className="gap-6">
        <CardHeader className="gap-1.5">
          <CardTitle
            id={headingId}
            className="flex flex-wrap items-center gap-2 text-base"
          >
            {t("sales.funnel.title")}
            <Badge variant="secondary">{copy.stage}</Badge>
          </CardTitle>
          {copy.progress && <CardDescription>{copy.progress}</CardDescription>}
          <CardAction className="w-36 self-center sm:w-56">
            <YesProgress answers={yesAnswers} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <YesPath leadId={leadId} answers={yesAnswers} />
          <p className="text-muted-foreground text-xs lg:text-center">
            {t("sales.yeses.hint")}
          </p>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3 border-t bg-muted/50 py-4 text-sm sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <p className="text-muted-foreground">{copy.now}</p>
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
          </div>
          {position.step.id === "sendVideo" && (
            <Button
              size="lg"
              className="shrink-0"
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
        </CardFooter>
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
