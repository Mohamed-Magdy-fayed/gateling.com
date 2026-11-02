"use client";

import { ArrowRightIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useId } from "react";

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
import type {
  YesFunnel,
  YesFunnelStep,
} from "@/features/system/sales/lib/yeses";
import { cn } from "@/lib/utils";

/**
 * The atelier yes funnel: one bar per step, all measured against the number
 * of ateliers in the pipeline so the funnel visibly narrows. Every figure is
 * printed beside its bar (no hover needed), the step-to-step rate sits on the
 * end, and the step losing the most of what reached it is flagged.
 */
export function YesFunnelCard({ funnel }: { funnel: YesFunnel }) {
  const { t, locale } = useTranslation();
  const headingId = useId();
  const number = new Intl.NumberFormat(locale);
  const hasTicks = funnel.steps.some((step) => step.yes > 0 || step.no > 0);

  return (
    <section aria-labelledby={headingId}>
      <Card data-testid="yes-funnel-card" className="gap-6">
        <CardHeader>
          <CardTitle id={headingId} className="text-base">
            {t("dashboard.funnelTitle")}
          </CardTitle>
          <CardDescription className="max-w-prose text-sm">
            {t("dashboard.funnelDesc")}
          </CardDescription>
          <CardAction>
            <Link
              href="/sales/leads"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("dashboard.funnelOpenPipeline")}
              <ArrowRightIcon aria-hidden="true" className="rtl:rotate-180" />
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ol className="flex flex-col gap-3">
            <FunnelRow
              label={t("dashboard.funnelLeads")}
              value={number.format(funnel.leads)}
              share={funnel.leads > 0 ? 1 : 0}
              isBase
            />
            {funnel.steps.map((step, index) => (
              <FunnelRow
                key={step.step}
                index={index + 1}
                label={t("sales.yeses.stepShort", { step: step.step })}
                value={number.format(step.yes)}
                share={funnel.leads > 0 ? step.yes / funnel.leads : 0}
                step={step}
                isWeakest={funnel.weakestStep === step.step}
              />
            ))}
          </ol>
          {!hasTicks && (
            <p className="text-muted-foreground text-sm">
              {t("dashboard.funnelEmpty")}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function FunnelRow({
  index,
  label,
  value,
  share,
  step,
  isBase = false,
  isWeakest = false,
}: {
  index?: number;
  label: string;
  value: string;
  /** 0–1 of the ateliers in the pipeline. */
  share: number;
  step?: YesFunnelStep;
  isBase?: boolean;
  isWeakest?: boolean;
}) {
  const { t, locale } = useTranslation();
  const number = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  return (
    <li
      data-testid={isBase ? "funnel-base" : `funnel-step-${step?.step}`}
      className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[11rem_1fr_9rem]"
    >
      <div className="flex min-w-0 items-center gap-2 text-sm">
        {index !== undefined && (
          <span
            aria-hidden="true"
            className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-[11px] text-muted-foreground tabular-nums"
          >
            {index}
          </span>
        )}
        <span
          className={cn(
            "truncate",
            isBase ? "text-muted-foreground" : "font-medium",
          )}
        >
          {label}
        </span>
      </div>

      {/* The bar spans the whole row on phones and sits in the middle above. */}
      <div className="col-span-2 row-start-2 flex h-6 items-center gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
        <div className="relative h-full flex-1 overflow-hidden rounded-sm bg-muted/60">
          <div
            className={cn(
              "h-full rounded-e-sm",
              isBase ? "bg-muted-foreground/30" : "bg-primary",
            )}
            style={{ width: `${Math.max(share > 0 ? 2 : 0, share * 100)}%` }}
          />
        </div>
        <span className="w-8 shrink-0 text-end font-semibold text-sm tabular-nums">
          {value}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-xs sm:justify-start">
        {step && step.rate !== null && (
          <span
            className="font-medium text-foreground tabular-nums"
            title={t("dashboard.funnelRate", {
              rate: percent.format(step.rate * 100),
            })}
          >
            <span aria-hidden="true">{percent.format(step.rate * 100)}%</span>
            <span className="sr-only">
              {t("dashboard.funnelRate", {
                rate: percent.format(step.rate * 100),
              })}
            </span>
          </span>
        )}
        {step && step.yesRecent > 0 && (
          <span className="text-muted-foreground tabular-nums">
            {t("dashboard.funnelRecent", {
              count: number.format(step.yesRecent),
            })}
          </span>
        )}
        {step && step.no > 0 && (
          <span className="inline-flex items-center gap-0.5 text-destructive tabular-nums">
            <XIcon aria-hidden="true" className="size-3" />
            {t("dashboard.funnelNo", { count: number.format(step.no) })}
          </span>
        )}
        {isWeakest && (
          <Badge variant="destructive" className="gap-1">
            <TriangleAlertIcon aria-hidden="true" />
            {t("dashboard.funnelWeakest")}
          </Badge>
        )}
      </div>
    </li>
  );
}
