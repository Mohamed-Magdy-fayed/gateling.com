"use client";

import {
  BadgeCheckIcon,
  PencilIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { useTranslation } from "@/features/core/i18n/client";
import type { SocialProfile } from "@/features/system/sales/lib/social-profiles";

import { GoogleMapsIcon, PlatformIcon, WhatsappIcon } from "./platform-icon";

type MapsInfo = {
  rating: number | null;
  reviewCount: number | null;
  category: string | null;
  address: string | null;
};

type WhatsappInfo = {
  name: string | null;
  number: string | null;
  isBusiness: boolean | null;
  chatUrl: string | null;
};

type Props = {
  maps: MapsInfo;
  /** One per platform, from `socialProfiles()`. */
  profiles: SocialProfile[];
  whatsapp: WhatsappInfo;
  onEditMaps: () => void;
  onEditSocial: (profile: SocialProfile) => void;
  onEditWhatsapp: () => void;
};

const LINK_CLASS =
  "truncate font-medium text-primary underline-offset-2 hover:underline focus-visible:underline";

/**
 * The client at a glance, under the hero: Google Maps, each social platform,
 * WhatsApp and total reach. A tile's name is its edit button; a handle or
 * number is the link to that platform. 2 columns on phones, 3 on tablets,
 * all 6 in a row on large screens.
 */
export function ReachStrip({
  maps,
  profiles,
  whatsapp,
  onEditMaps,
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
  const mapsDetail = [
    maps.reviewCount != null
      ? t("sales.account.reviewsCount", { count: maps.reviewCount })
      : null,
    maps.category,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ul
      className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-6"
      data-testid="client-reach-strip"
    >
      <ReachTile
        testId="reach-maps"
        icon={<GoogleMapsIcon className="size-4" />}
        label={t("sales.account.mapsHeading")}
        editLabel={t("sales.account.editMaps")}
        onEdit={onEditMaps}
        value={
          maps.rating != null ? (
            <span className="inline-flex items-center gap-1.5">
              {decimal.format(maps.rating)}
              <StarRating
                value={maps.rating}
                label={t("sales.account.ratingLabel", {
                  rating: decimal.format(maps.rating),
                })}
                fillClassName="fill-brand-google-star text-brand-google-star"
                className="hidden xl:inline-flex"
              />
            </span>
          ) : null
        }
        detail={
          <>
            {mapsDetail && <span className="block truncate">{mapsDetail}</span>}
            {maps.address && (
              <span className="line-clamp-2" title={maps.address}>
                {maps.address}
              </span>
            )}
          </>
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
        editLabel={t("sales.account.editWhatsapp")}
        onEdit={onEditWhatsapp}
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
              {whatsapp.chatUrl ? (
                <a
                  href={whatsapp.chatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className={`${LINK_CLASS} tabular-nums`}
                >
                  {whatsapp.number}
                </a>
              ) : (
                <span dir="ltr" className="tabular-nums">
                  {whatsapp.number}
                </span>
              )}
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
        valueSuffix={total != null ? t("sales.account.followers") : null}
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
  // The handle is the link; without one, a plain "Open profile" link stands in.
  const linkText = handle ?? t("sales.socialOpenProfile");

  return (
    <ReachTile
      testId={`reach-${profile.platform}`}
      icon={<PlatformIcon platform={profile.platform} className="size-4" />}
      label={t("sales.socialPlatform", { platform: profile.platform })}
      editLabel={t("sales.account.editProfileOn", {
        platform: profile.platform,
      })}
      onEdit={onEdit}
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
            {found.profileUrl ? (
              <a
                href={found.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className={`${LINK_CLASS} text-start`}
                data-testid={`social-link-${profile.platform}`}
              >
                {linkText}
              </a>
            ) : (
              handle && (
                <span className="truncate" dir="ltr">
                  {handle}
                </span>
              )
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
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline focus-visible:underline"
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

/**
 * One tile: its name (the edit button, when editable), a big value and a
 * detail line.
 */
export function ReachTile({
  icon,
  label,
  editLabel,
  onEdit,
  value,
  valueSuffix,
  detail,
  testId,
}: {
  icon: ReactNode;
  label: string;
  /** Accessible name for the edit action, e.g. "Edit Facebook profile". */
  editLabel?: string;
  onEdit?: () => void;
  /** Already formatted; null shows a dash. */
  value: ReactNode;
  valueSuffix?: string | null;
  detail?: ReactNode;
  testId?: string;
}) {
  return (
    <li className="flex min-w-0 flex-col gap-1" data-testid={testId}>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          aria-label={editLabel}
          className="group/tile -ms-1.5 flex min-h-8 w-fit max-w-full items-center gap-1.5 rounded-md px-1.5 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          data-testid={testId ? `${testId}-edit` : undefined}
        >
          <span className="shrink-0">{icon}</span>
          <span className="truncate">{label}</span>
          <PencilIcon
            aria-hidden="true"
            className="size-3 shrink-0 opacity-60 group-hover/tile:opacity-100"
          />
        </button>
      ) : (
        <span className="flex min-h-8 min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
          <span className="shrink-0">{icon}</span>
          <span className="truncate">{label}</span>
        </span>
      )}
      <div className="flex min-w-0 items-baseline gap-1.5">
        <span className="min-w-0 truncate font-semibold text-xl tabular-nums">
          {value ?? "—"}
        </span>
        {valueSuffix && (
          <span className="text-muted-foreground text-xs">{valueSuffix}</span>
        )}
      </div>
      {detail && (
        <div className="flex min-w-0 flex-col text-muted-foreground text-xs">
          {detail}
        </div>
      )}
    </li>
  );
}
