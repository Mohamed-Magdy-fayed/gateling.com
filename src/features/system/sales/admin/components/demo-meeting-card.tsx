"use client";

import { useMutation } from "@tanstack/react-query";
import { CopyIcon, VideoIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

type Props = {
  leadId: string;
  /** Guest link of the demo room, once provisioned. */
  meetingUrl: string | null;
  /** The lead is `demo_scheduled` but the room has not been created yet. */
  isPending: boolean;
};

/**
 * The prospect gets the guest link by WhatsApp (the pipeline sends nothing
 * itself); staff join through a fresh single-use host link on each click.
 */
export function DemoMeetingCard({ leadId, meetingUrl, isPending }: Props) {
  const trpc = useTRPC();
  const { t } = useTranslation();

  const hostJoinLink = useMutation(
    trpc.sales.demoHostJoinLink.mutationOptions({
      onSuccess: ({ url }) => window.open(url, "_blank", "noopener"),
      onError: () => toast.error(t("sales.demoMeetingJoinFailed")),
    }),
  );

  if (!meetingUrl && !isPending) return null;

  async function copyLink() {
    if (!meetingUrl) return;
    await navigator.clipboard.writeText(meetingUrl);
    toast.success(t("sales.demoMeetingCopied"));
  }

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="gap-1">
        <CardTitle className="text-base">{t("sales.demoMeeting")}</CardTitle>
        <p className="text-muted-foreground text-xs">
          {meetingUrl
            ? t("sales.demoMeetingHint")
            : t("sales.demoMeetingPending")}
        </p>
      </CardHeader>
      {meetingUrl && (
        <CardContent className="flex flex-wrap items-center gap-2">
          <Input
            readOnly
            value={meetingUrl}
            className="min-w-64 flex-1 font-mono text-xs"
            aria-label={t("sales.demoMeeting")}
            onFocus={(event) => event.currentTarget.select()}
          />
          <Button size="sm" variant="outline" onClick={copyLink}>
            <CopyIcon className="size-3.5" />
            {t("sales.demoMeetingCopy")}
          </Button>
          <Button
            size="sm"
            disabled={hostJoinLink.isPending}
            onClick={() => hostJoinLink.mutate({ id: leadId })}
          >
            <VideoIcon className="size-3.5" />
            {t("sales.demoMeetingJoin")}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
