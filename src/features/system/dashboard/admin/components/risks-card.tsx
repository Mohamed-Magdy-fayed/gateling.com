"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/features/core/i18n/client";
import type { SalesDashboard } from "@/features/system/sales/server/dashboard";

import { CountRow } from "./count-row";

/**
 * Auto-park leads lead the list: a third unanswered WhatsApp risks a ban on
 * the business number, so that count is the one that must never be missed.
 */
export function RisksCard({ risks }: { risks: SalesDashboard["risks"] }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.risksTitle")}</CardTitle>
        <CardDescription>{t("dashboard.risksDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          <CountRow
            label={t("dashboard.riskAutoPark")}
            hint={t("dashboard.riskAutoParkHint")}
            count={risks.autoPark}
            urgent
          />
          <CountRow
            label={t("dashboard.riskWhatsapp")}
            hint={t("dashboard.riskWhatsappHint")}
            count={risks.whatsappNotConfirmed}
          />
          <CountRow
            label={t("dashboard.riskNoNumber")}
            hint={t("dashboard.riskNoNumberHint")}
            count={risks.noNumber}
          />
        </ul>
      </CardContent>
    </Card>
  );
}
