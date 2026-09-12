"use client";

import { PlugZapIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InlineCode } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";

function subscribeToNothing() {
  return () => {};
}

/**
 * The two values Meetings' integration form asks for — this deployment's
 * webhook URL and return origin — shown right above the settings grid where
 * the key and secret it issues get pasted, so setup reads top to bottom on
 * one screen. Read from the page rather than configured: the origin the admin
 * is looking at is the origin customers will return to. Through
 * useSyncExternalStore so the server render (no window) and the first client
 * render agree instead of a hydration mismatch.
 */
export function MeetingsIntegrationCard() {
  const { t } = useTranslation();
  const origin = useSyncExternalStore(
    subscribeToNothing,
    () => window.location.origin,
    () => "",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlugZapIcon className="size-4" />
          {t("systemPages.settingsMeetingsTitle")}
        </CardTitle>
        <CardDescription>
          {t("systemPages.settingsMeetingsLead")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-[auto_1fr] sm:items-center">
          <dt className="text-muted-foreground">
            {t("systemPages.settingsMeetingsWebhookUrl")}
          </dt>
          <dd dir="ltr">
            <InlineCode>{`${origin}/api/meetings-webhook`}</InlineCode>
          </dd>
          <dt className="text-muted-foreground">
            {t("systemPages.settingsMeetingsReturnOrigin")}
          </dt>
          <dd dir="ltr">
            <InlineCode>{origin}</InlineCode>
          </dd>
        </dl>
      </CardContent>
    </Card>
  );
}
