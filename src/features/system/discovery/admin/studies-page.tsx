"use client";

import { useQuery } from "@tanstack/react-query";
import { MessageSquarePlusIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/status";
import { H1, H3, Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

import { CreateStudyDialog } from "./components/create-study-dialog";
import { STEP_KEY, VERDICT_KEY, VERDICT_STATUS_VARIANT } from "./labels";

const SKELETONS = ["a", "b", "c"];

export function DiscoveryStudiesPage() {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const [creating, setCreating] = useState(false);
  const studies = useQuery(trpc.discovery.listStudies.queryOptions());
  const number = new Intl.NumberFormat(locale);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <H1>{t("discovery.title")}</H1>
          <Muted className="max-w-prose text-pretty">
            {t("discovery.lead")}
          </Muted>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="min-h-11 sm:min-h-8"
            render={<Link href="/discovery/templates" />}
          >
            {t("discovery.templatesLink")}
          </Button>
          <Button
            variant="outline"
            className="min-h-11 sm:min-h-8"
            onClick={() => setCreating(true)}
          >
            <PlusIcon aria-hidden="true" />
            {t("discovery.newStudy")}
          </Button>
          <Button
            className="min-h-11 sm:min-h-8"
            render={<Link href="/discovery/log" />}
          >
            <MessageSquarePlusIcon aria-hidden="true" />
            {t("discovery.logButton")}
          </Button>
        </div>
      </header>

      {studies.isError && (
        <Alert variant="destructive">
          <AlertDescription>{t("discovery.loadFailed")}</AlertDescription>
        </Alert>
      )}

      {studies.isPending && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {SKELETONS.map((key) => (
            <Skeleton key={key} className="h-32 w-full" />
          ))}
        </div>
      )}

      {studies.data && studies.data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-start gap-2">
            <H3>{t("discovery.noStudies")}</H3>
            <Muted>{t("discovery.noStudiesHint")}</Muted>
            <Button onClick={() => setCreating(true)}>
              <PlusIcon aria-hidden="true" />
              {t("discovery.newStudy")}
            </Button>
          </CardContent>
        </Card>
      )}

      {studies.data && studies.data.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {studies.data.map((study) => (
            <li key={study.id}>
              <Link
                href={`/discovery/studies/${study.id}`}
                className="focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
              >
                <Card className="hover:bg-muted/40 h-full transition-colors">
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <H3 className="truncate">{study.title}</H3>
                        <Muted className="truncate">{study.niche}</Muted>
                      </div>
                      <Status
                        variant={VERDICT_STATUS_VARIANT[study.readout.verdict]}
                      >
                        <StatusIndicator />
                        <StatusLabel>
                          {t(VERDICT_KEY[study.readout.verdict])}
                        </StatusLabel>
                      </Status>
                    </div>
                    <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span>
                        {t("discovery.stepLabel")}: {t(STEP_KEY[study.step])}
                      </span>
                      <span className="tabular-nums">
                        {t("discovery.conversationsOf", {
                          count: number.format(study.readout.conversations),
                          target: number.format(study.targetConversations),
                        })}
                      </span>
                      <span className="tabular-nums">
                        {t("discovery.touchpointsCount", {
                          count: number.format(study.touchpointCount),
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <CreateStudyDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
