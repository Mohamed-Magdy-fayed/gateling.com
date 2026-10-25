"use client";

import Link from "next/link";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/features/core/i18n/client";
import {
  conversionRate,
  requiredDailyPace,
  SPRINT_CONTACT_TARGET,
  SPRINT_METRICS,
  type SprintMetricId,
  type SprintTrack,
} from "@/features/system/sales/lib/sprint";
import type { SalesDashboard } from "@/features/system/sales/server/dashboard";

type Sprint = SalesDashboard["sprint"];
type ActiveSprint = Exclude<Sprint, { state: "not_set" }>;

const METRIC_LABEL_KEY = {
  contacted: "dashboard.metricContacted",
  replied: "dashboard.metricReplied",
  booked: "dashboard.metricBooked",
  held: "dashboard.metricHeld",
  deposits: "dashboard.metricDeposits",
} as const satisfies Record<SprintMetricId, string>;

const TRACKS = [
  { id: "atelier", labelKey: "dashboard.trackAtelier" },
  { id: "distributor", labelKey: "dashboard.trackDistributor" },
] as const satisfies readonly { id: SprintTrack; labelKey: string }[];

function SprintStateBadge({ sprint }: { sprint: ActiveSprint }) {
  const { t, locale } = useTranslation();
  if (sprint.state === "active") {
    return (
      <Badge>
        {t("dashboard.sprintDay", { day: sprint.day, total: sprint.totalDays })}
      </Badge>
    );
  }
  if (sprint.state === "upcoming") {
    // The key is a calendar date, so format it as one — no timezone shift.
    const date = new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(`${sprint.startKey}T00:00:00Z`));
    return (
      <Badge variant="secondary">
        {t("dashboard.sprintUpcoming", { date })}
      </Badge>
    );
  }
  return <Badge variant="destructive">{t("dashboard.sprintEnded")}</Badge>;
}

function TrackScore({
  track,
  labelKey,
  sprint,
}: {
  track: SprintTrack;
  labelKey: (typeof TRACKS)[number]["labelKey"];
  sprint: ActiveSprint;
}) {
  const { t } = useTranslation();
  const score = sprint.scores[track];
  const target = SPRINT_CONTACT_TARGET[track];
  const percent = Math.min(100, Math.round((score.contacted / target) * 100));
  const pace =
    sprint.state === "active"
      ? requiredDailyPace(target, score.contacted, sprint.daysRemaining)
      : null;

  return (
    <section
      aria-labelledby={`sprint-${track}`}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <h3 id={`sprint-${track}`} className="font-medium">
          {t(labelKey)}
        </h3>
        <div
          role="progressbar"
          aria-label={t("dashboard.contactProgress", {
            done: score.contacted,
            target,
          })}
          aria-valuemin={0}
          aria-valuemax={target}
          aria-valuenow={Math.min(score.contacted, target)}
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          {t("dashboard.contactProgress", { done: score.contacted, target })}
          {" · "}
          {score.contacted >= target
            ? t("dashboard.targetMet")
            : pace !== null && t("dashboard.paceNeeded", { pace })}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {SPRINT_METRICS.map(({ id }, index) => {
          const previous =
            index > 0 ? score[SPRINT_METRICS[index - 1].id] : null;
          const rate =
            previous === null ? null : conversionRate(score[id], previous);
          return (
            <div key={id} className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-xs">
                {t(METRIC_LABEL_KEY[id])}
              </dt>
              <dd className="font-semibold text-2xl tabular-nums">
                {score[id]}
              </dd>
              {rate !== null && (
                <dd className="text-muted-foreground text-xs">
                  {t("dashboard.conversion", { rate })}
                </dd>
              )}
            </div>
          );
        })}
      </dl>
    </section>
  );
}

/**
 * The day-14 gate inputs, live. Counts follow the design doc exactly: distinct
 * leads per metric, activities created inside the sprint window, ateliers and
 * distributors never mixed.
 */
export function SprintScorecard({ sprint }: { sprint: Sprint }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.sprintTitle")}</CardTitle>
        <CardDescription>{t("dashboard.sprintDesc")}</CardDescription>
        {sprint.state !== "not_set" && (
          <CardAction>
            <SprintStateBadge sprint={sprint} />
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {sprint.state === "not_set" ? (
          <Alert>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{t("dashboard.sprintNotSet")}</span>
              <Link
                href="/settings"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {t("dashboard.sprintOpenSettings")}
              </Link>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {TRACKS.map(({ id, labelKey }) => (
              <TrackScore
                key={id}
                track={id}
                labelKey={labelKey}
                sprint={sprint}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
