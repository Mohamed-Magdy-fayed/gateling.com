"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import type { DashboardRecentLead } from "@/features/system/dashboard/server/types";

const LEAD_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  new: "default",
  contacted: "secondary",
  qualified: "outline",
  closed: "secondary",
};

type Props = {
  isLoading: boolean;
  newThisMonth: number;
  leads: DashboardRecentLead[];
};

/** Contact-form leads: the warmest leads there are, so they stay on the dashboard. */
export function RecentInboundCard({ isLoading, newThisMonth, leads }: Props) {
  const { t, locale } = useTranslation();
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const statusLabel: Record<string, string> = {
    new: t("leads.statusValues.new"),
    contacted: t("leads.statusValues.contacted"),
    qualified: t("leads.statusValues.qualified"),
    closed: t("leads.statusValues.closed"),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.recentLeads")}</CardTitle>
        <CardDescription>
          {t("dashboard.recentLeadsDesc", { count: newThisMonth })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : leads.length === 0 ? (
          <Muted>{t("dashboard.noLeads")}</Muted>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("leads.name")}</TableHead>
                  <TableHead>{t("leads.email")}</TableHead>
                  <TableHead>{t("leads.company")}</TableHead>
                  <TableHead>{t("leads.status")}</TableHead>
                  <TableHead>{t("leads.createdAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <span dir="ltr">{lead.email}</span>
                    </TableCell>
                    <TableCell>{lead.company ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          LEAD_STATUS_VARIANT[lead.status] ?? "secondary"
                        }
                      >
                        {statusLabel[lead.status] ?? lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {dateFmt.format(new Date(lead.createdAt))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
