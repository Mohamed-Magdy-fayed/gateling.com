"use client";

import {
  BadgeCheckIcon,
  ExternalLinkIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  UsersIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/core/i18n/client";
import type { SocialProfile } from "@/features/system/sales/lib/social-profiles";

import { PlatformIcon, WhatsappIcon } from "./platform-icon";

type WhatsappInfo = {
  name: string | null;
  number: string | null;
  isBusiness: boolean | null;
  chatUrl: string | null;
};

type Props = {
  rating: number | null;
  reviewCount: number | null;
  /** One per platform, from `socialProfiles()`. */
  profiles: SocialProfile[];
  whatsapp: WhatsappInfo;
  locationCount: number;
  onEditSocial: (profile: SocialProfile) => void;
  onEditWhatsapp: () => void;
};

/**
 * The client at a glance, under the hero: Google rating, each social
 * platform (name, handle, followers, link, edit), WhatsApp, and total reach.
 * 2 columns on phones, 3 on tablets, all 6 in a row on large screens.
 */
export function ReachStrip({
  rating,
  reviewCount,
  profiles,
  whatsapp,
  locationCount,
  onEditSocial,
  onEditWhatsapp,
}: Props) {
  const { t, locale } = useTranslation();
  const compact = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const decimal = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const known = profiles.flatMap((p) =>
    p.kind === "found" && p.followers != null ? [p.followers] : [],
  );
  const total = known.length > 0 ? known.reduce((sum, n) => sum + n, 0) : null;

  return (
    <ul
      className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-6"
      data-testid="client-reach-strip"
    >
      <ReachTile
        icon={
          <StarIcon
            aria-hidden="true"
            className="size-4 fill-brand-google-star text-brand-google-star"
          />
        }
        label={t("sales.account.reachRating")}
        value={rating != null ? decimal.format(rating) : null}
        detail={
          reviewCount != null
            ? t("sales.account.reviewsCount", { count: reviewCount })
            : null
        }
      />

      {profiles.map((profile) => (
        <SocialTile
          key={profile.platform}
          profile={profile}
          followers={
            profile.kind === "found" && profile.followers != null
              ? compact.format(profile.followers)
              : null
          }
          onEdit={() => onEditSocial(profile)}
        />
      ))}

      <ReachTile
        testId="reach-whatsapp"
        icon={<WhatsappIcon className="size-4" />}
        label={t("sales.account.whatsapp")}
        actions={
          <>
            {whatsapp.chatUrl && (
              <Button
                size="icon-lg"
                variant="ghost"
                aria-label={t("sales.account.openWhatsappChat")}
                render={(props) => (
                  <a
                    href={whatsapp.chatUrl ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  >
                    <ExternalLinkIcon aria-hidden="true" />
                  </a>
                )}
              />
            )}
            <Button
              size="icon-lg"
              variant="ghost"
              aria-label={t("sales.account.editWhatsapp")}
              onClick={onEditWhatsapp}
            >
              <PencilIcon aria-hidden="true" />
            </Button>
          </>
        }
        value={
          whatsapp.number ? (
            <span className="block truncate text-base">
              {whatsapp.name ?? t("sales.account.whatsappNoName")}
            </span>
          ) : null
        }
        detail={
          whatsapp.number ? (
            <span className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span dir="ltr" className="tabular-nums">
                {whatsapp.number}
              </span>
              {whatsapp.isBusiness && (
                <Badge variant="secondary">
                  <BadgeCheckIcon aria-hidden="true" />
                  {t("sales.account.businessAccount")}
                </Badge>
              )}
            </span>
          ) : (
            t("sales.account.whatsappMissing")
          )
        }
      />

      <ReachTile
        icon={<UsersIcon aria-hidden="true" className="size-4" />}
        label={t("sales.account.reachTotal")}
        value={total != null ? compact.format(total) : null}
        detail={
          <span className="inline-flex items-center gap-1">
            <MapPinIcon aria-hidden="true" className="size-3" />
            {t("sales.account.locationsCount", { count: locationCount })}
          </span>
        }
      />
    </ul>
  );
}

function SocialTile({
  profile,
  followers,
  onEdit,
}: {
  profile: SocialProfile;
  /** Already formatted; null when unknown. */
  followers: string | null;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const found = profile.kind === "found" ? profile : null;
  const searchUrl = profile.kind === "found" ? null : profile.searchUrl;
  const handle = found?.handle
    ? /^[\w.-]+$/.test(found.handle)
      ? `@${found.handle}`
      : found.handle
    : null;

  return (
    <ReachTile
      testId={`reach-${profile.platform}`}
      icon={<PlatformIcon platform={profile.platform} className="size-4" />}
      label={t("sales.socialPlatform", { platform: profile.platform })}
      actions={
        <>
          {found?.profileUrl && (
            <Button
              size="icon-lg"
              variant="ghost"
              aria-label={t("sales.account.openProfileOn", {
                platform: profile.platform,
              })}
              render={(props) => (
                <a
                  href={found.profileUrl ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                >
                  <ExternalLinkIcon aria-hidden="true" />
                </a>
              )}
            />
          )}
          <Button
            size="icon-lg"
            variant="ghost"
            aria-label={t("sales.account.editProfileOn", {
              platform: profile.platform,
            })}
            onClick={onEdit}
            data-testid={`social-edit-${profile.platform}`}
          >
            {found ? (
              <PencilIcon aria-hidden="true" />
            ) : (
              <PlusIcon aria-hidden="true" />
            )}
          </Button>
        </>
      }
      value={followers}
      valueSuffix={followers ? t("sales.account.followers") : null}
      detail={
        found ? (
          <span className="flex min-w-0 flex-col">
            {found.displayName && (
              <span className="truncate text-foreground">
                {found.displayName}
              </span>
            )}
            {handle && (
              <span className="truncate" dir="ltr">
                {handle}
              </span>
            )}
          </span>
        ) : (
          <span className="flex flex-wrap items-center gap-x-2">
            {profile.kind === "notFound"
              ? t("sales.account.noAccount")
              : t("sales.socialNotOnFile")}
            {searchUrl && (
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-1 font-medium text-primary hover:underline focus-visible:underline"
              >
                <SearchIcon aria-hidden="true" className="size-3" />
                {t("sales.account.search")}
              </a>
            )}
          </span>
        )
      }
    />
  );
}

/** One tile: icon + label (+ actions), a big value, and a detail line. */
export function ReachTile({
  icon,
  label,
  actions,
  value,
  valueSuffix,
  detail,
  testId,
}: {
  icon: ReactNode;
  label: string;
  actions?: ReactNode;
  /** Already formatted; null shows a dash. */
  value: ReactNode;
  valueSuffix?: string | null;
  detail?: ReactNode;
  testId?: string;
}) {
  return (
    <li className="flex min-w-0 flex-col gap-1" data-testid={testId}>
      <div className="flex min-h-8 items-center justify-between gap-1">
        <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
          <span className="shrink-0">{icon}</span>
          <span className="truncate">{label}</span>
        </span>
        {actions && (
          <span className="-me-2 flex shrink-0 items-center">{actions}</span>
        )}
      </div>
      <div className="flex min-w-0 items-baseline gap-1.5">
        <span className="min-w-0 truncate font-semibold text-xl tabular-nums">
          {value ?? "—"}
        </span>
        {valueSuffix && (
          <span className="text-muted-foreground text-xs">{valueSuffix}</span>
        )}
      </div>
      {detail && (
        <div className="min-w-0 text-muted-foreground text-xs">{detail}</div>
      )}
    </li>
  );
}
