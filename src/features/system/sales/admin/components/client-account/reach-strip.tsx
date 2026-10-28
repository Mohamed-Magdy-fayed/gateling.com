"use client";

import { MapPinIcon, StarIcon, UsersIcon } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import type { SocialPlatform } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";

import { PlatformIcon } from "./platform-icon";

type Props = {
  rating: number | null;
  reviewCount: number | null;
  followers: Record<SocialPlatform, number | null>;
  locationCount: number;
};

const PLATFORMS: SocialPlatform[] = ["facebook", "instagram", "tiktok"];

/** The at-a-glance numbers under the hero: rating, audience per platform, reach. */
export function ReachStrip({
  rating,
  reviewCount,
  followers,
  locationCount,
}: Props) {
  const { t, locale } = useTranslation();
  const compact = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const decimal = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const known = PLATFORMS.flatMap((p) =>
    followers[p] != null ? [followers[p]] : [],
  );
  const total = known.length > 0 ? known.reduce((sum, n) => sum + n, 0) : null;

  return (
    <dl
      className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5"
      data-testid="client-reach-strip"
    >
      <ReachStat
        icon={StarIcon}
        label={t("sales.account.reachRating")}
        value={rating != null ? decimal.format(rating) : null}
        suffix={
          reviewCount != null
            ? t("sales.account.reviewsCount", { count: reviewCount })
            : null
        }
      />
      {PLATFORMS.map((platform) => (
        <ReachStat
          key={platform}
          icon={(props) => <PlatformIcon platform={platform} {...props} />}
          label={t("sales.socialPlatform", { platform })}
          value={
            followers[platform] != null
              ? compact.format(followers[platform])
              : null
          }
          suffix={t("sales.account.followers")}
        />
      ))}
      <ReachStat
        icon={UsersIcon}
        label={t("sales.account.reachTotal")}
        value={total != null ? compact.format(total) : null}
        suffix={
          <span className="inline-flex items-center gap-1">
            <MapPinIcon aria-hidden="true" className="size-3" />
            {t("sales.account.locationsCount", { count: locationCount })}
          </span>
        }
      />
    </dl>
  );
}

export function ReachStat({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  /** Already formatted; null shows a dash. */
  value: string | null;
  suffix?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="font-semibold text-xl tabular-nums" dir="ltr">
          {value ?? "—"}
        </span>
        {value != null && suffix && (
          <span className="text-muted-foreground text-xs">{suffix}</span>
        )}
      </dd>
    </div>
  );
}
