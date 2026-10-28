"use client";

import { LightbulbIcon } from "lucide-react";
import { useId } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/features/core/i18n/client";
import type { CallTip } from "@/features/system/sales/lib/call-tips";

/** Numbered openers from `callTips()`; a short prompt when nothing is on file yet. */
export function BeforeYouCallCard({ tips }: { tips: CallTip[] }) {
  const { t, locale } = useTranslation();
  const headingId = useId();
  const compact = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const decimal = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

  function text(tip: CallTip): string {
    switch (tip.kind) {
      case "askFor":
        return t("sales.account.tipAskFor", { name: tip.name });
      case "rating":
        return t("sales.account.tipRating", {
          rating: decimal.format(tip.rating),
          reviews: tip.reviews,
        });
      case "topPlatform":
        return t("sales.account.tipTopPlatform", {
          platform: tip.platform,
          followers: compact.format(tip.followers),
        });
    }
  }

  return (
    <section aria-labelledby={headingId}>
      <Card data-testid="client-tips-card">
        <CardHeader>
          <CardTitle
            id={headingId}
            className="flex items-center gap-2 text-base"
          >
            <LightbulbIcon aria-hidden="true" className="size-4" />
            {t("sales.account.beforeYouCall")}
          </CardTitle>
          <CardDescription>
            {t("sales.account.beforeYouCallLead")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tips.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("sales.account.tipsEmpty")}
            </p>
          ) : (
            <ol className="flex flex-col gap-3">
              {tips.map((tip, index) => (
                <li key={tip.kind} className="flex items-start gap-3 text-sm">
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs tabular-nums"
                  >
                    {index + 1}
                  </span>
                  <span className="text-pretty pt-0.5">{text(tip)}</span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
