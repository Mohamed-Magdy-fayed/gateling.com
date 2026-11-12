"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ExternalLinkIcon, TagIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import type {
  DiscoveryChannel,
  DiscoveryDirection,
  DiscoveryPersona,
  DiscoveryTouchpointFormat,
} from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

import { CHANNEL_KEY, durationParts, FORMAT_KEY, PERSONA_KEY } from "../labels";

export type TouchpointView = {
  id: string;
  studyId: string;
  contactId: string;
  contactName: string;
  channel: DiscoveryChannel;
  format: DiscoveryTouchpointFormat;
  direction: DiscoveryDirection;
  persona: DiscoveryPersona;
  url: string | null;
  message: string | null;
  replyText: string | null;
  occurredAt: Date;
  repliedAt: Date | null;
  studyTitle?: string;
};

/** One message or call, with the one-tap "they replied" and "tag evidence". */
export function TouchpointRow({
  touchpoint: tp,
  showContact = true,
  onTagEvidence,
}: {
  touchpoint: TouchpointView;
  showContact?: boolean;
  onTagEvidence: (tp: TouchpointView) => void;
}) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const number = new Intl.NumberFormat(locale);

  const replied = useMutation(
    trpc.discovery.markReplied.mutationOptions({
      onSuccess: async () => {
        toast.success(t("discovery.repliedSaved"));
        await queryClient.invalidateQueries({
          queryKey: trpc.discovery.pathKey(),
        });
      },
      onError: () => toast.error(t("discovery.saveFailed")),
    }),
  );

  const waiting = tp.direction === "outbound" && !tp.repliedAt;
  const latency =
    tp.repliedAt && tp.direction === "outbound"
      ? durationParts(
          Math.max(
            0,
            Math.round(
              (new Date(tp.repliedAt).getTime() -
                new Date(tp.occurredAt).getTime()) /
                60_000,
            ),
          ),
        )
      : null;

  return (
    <article className="flex flex-col gap-2 border-b py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {showContact && (
          <Link
            href={`/discovery/contacts/${tp.contactId}`}
            className="text-sm font-medium hover:underline"
          >
            {tp.contactName}
          </Link>
        )}
        <Badge variant="secondary">{t(CHANNEL_KEY[tp.channel])}</Badge>
        <Badge variant="outline">{t(FORMAT_KEY[tp.format])}</Badge>
        <Badge variant="outline">{t(PERSONA_KEY[tp.persona])}</Badge>
        <time
          className="text-muted-foreground tabular-nums"
          dateTime={new Date(tp.occurredAt).toISOString()}
        >
          {date.format(new Date(tp.occurredAt))}
        </time>
        {tp.studyTitle && (
          <span className="text-muted-foreground">
            {t("discovery.inStudy", { study: tp.studyTitle })}
          </span>
        )}
      </div>
      {tp.message && (
        <p className="text-sm whitespace-pre-wrap" dir="auto">
          <span className="text-muted-foreground me-1 text-xs font-medium">
            {tp.direction === "outbound"
              ? t("discovery.yourMessage")
              : t("discovery.theirMessage")}
            :
          </span>
          {tp.message}
        </p>
      )}
      {tp.replyText && (
        <p
          className="bg-muted rounded-md p-2 text-sm whitespace-pre-wrap"
          dir="auto"
        >
          <span className="text-muted-foreground me-1 text-xs font-medium">
            {t("discovery.theirMessage")}:
          </span>
          {tp.replyText}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {latency && (
          <span className="text-muted-foreground text-xs tabular-nums">
            {t("discovery.repliedAfter", {
              time: t(latency[0], { count: number.format(latency[1]) }),
            })}
          </span>
        )}
        {waiting && (
          <>
            <span className="text-muted-foreground text-xs">
              {t("discovery.noReply")}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="min-h-11 sm:min-h-6"
              disabled={replied.isPending}
              onClick={() => replied.mutate({ id: tp.id })}
            >
              <LoadingSwap isLoading={replied.isPending}>
                <CheckIcon aria-hidden="true" />
                {t("discovery.markReplied")}
              </LoadingSwap>
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="min-h-11 sm:min-h-6"
          onClick={() => onTagEvidence(tp)}
        >
          <TagIcon aria-hidden="true" />
          {t("discovery.tagEvidence")}
        </Button>
        {tp.url && (
          <Button
            size="sm"
            variant="ghost"
            className="min-h-11 sm:min-h-6"
            render={
              // biome-ignore lint/a11y/useAnchorContent: label comes from Button children
              <a href={tp.url} target="_blank" rel="noopener noreferrer" />
            }
          >
            <ExternalLinkIcon aria-hidden="true" />
            {t("discovery.openLink")}
          </Button>
        )}
      </div>
    </article>
  );
}
