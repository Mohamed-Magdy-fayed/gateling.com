"use client";

import { useQuery } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { H2, Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

import { DailyTouchesCard } from "./components/daily-touches-card";
import { PipelineStagesCard } from "./components/pipeline-stages-card";
import { RecentInboundCard } from "./components/recent-inbound-card";
import { RisksCard } from "./components/risks-card";
import { SprintScorecard } from "./components/sprint-scorecard";
import { UpcomingDemosCard } from "./components/upcoming-demos-card";
import { WorkloadCard } from "./components/workload-card";

/** Non-admins can't read the pipeline; they get the inbound section only. */
function isForbidden(error: unknown): boolean {
  return error instanceof TRPCClientError && error.data?.code === "FORBIDDEN";
}

function SalesSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <Skeleton className="h-56 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

export function DashboardRentalPage() {
  const { t } = useTranslation();
  const trpc = useTRPC();

  const inbound = useQuery(trpc.dashboard.getData.queryOptions());
  const sales = useQuery({
    ...trpc.dashboard.getSales.queryOptions(),
    retry: (failures, error) => !isForbidden(error) && failures < 2,
  });

  const salesSection = (() => {
    if (sales.isPending) return <SalesSkeleton />;
    if (sales.isError) {
      if (isForbidden(sales.error)) return null;
      return (
        <Alert variant="destructive">
          <AlertDescription>{t("dashboard.salesLoadFailed")}</AlertDescription>
        </Alert>
      );
    }
    const data = sales.data;
    return (
      <>
        <SprintScorecard sprint={data.sprint} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <WorkloadCard workload={data.workload} />
          <UpcomingDemosCard
            demos={data.upcomingDemos}
            timeZone={data.timeZone}
          />
          <RisksCard risks={data.risks} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PipelineStagesCard stages={data.stages} />
          <DailyTouchesCard touches={data.touches} />
        </div>
      </>
    );
  })();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-6">
      <div>
        <H2>{t("dashboard.title")}</H2>
        <Muted>{t("dashboard.lead")}</Muted>
      </div>

      {salesSection}

      <RecentInboundCard
        isLoading={inbound.isPending}
        newThisMonth={inbound.data?.newLeadsThisMonth ?? 0}
        leads={inbound.data?.recentLeads ?? []}
      />
    </div>
  );
}
