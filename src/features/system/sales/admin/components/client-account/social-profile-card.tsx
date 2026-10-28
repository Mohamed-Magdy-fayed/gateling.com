"use client";

import {
  ExternalLinkIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/features/core/i18n/client";
import type { SocialProfile } from "@/features/system/sales/lib/social-profiles";

import { PlatformIcon } from "./platform-icon";
import { ProfileAvatar } from "./profile-avatar";

type Props = {
  profile: SocialProfile;
  /** Fallback for the avatar initials and a missing display name. */
  leadName: string;
  onEdit: () => void;
};

/** A bare username gets an `@`; a URL or a page name is shown as is. */
function shownHandle(handle: string): string {
  return /^[\w.-]+$/.test(handle) ? `@${handle}` : handle;
}

/** One platform: name, handle, picture and followers — or the way to find it. */
export function SocialProfileCard({ profile, leadName, onEdit }: Props) {
  const { t, locale } = useTranslation();
  const headingId = useId();
  const platformName = t("sales.socialPlatform", {
    platform: profile.platform,
  });
  const found = profile.kind === "found" ? profile : null;
  const searchUrl = profile.kind === "found" ? null : profile.searchUrl;
  const checkedAt =
    profile.kind !== "missing" && profile.checkedAt
      ? t("sales.socialCheckedAt", {
          date: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
            new Date(profile.checkedAt),
          ),
        })
      : null;

  return (
    <section aria-labelledby={headingId}>
      <Card data-testid={`client-social-${profile.platform}`}>
        <CardHeader className="flex items-center justify-between gap-2">
          <CardTitle
            id={headingId}
            className="flex items-center gap-2 text-base"
          >
            <PlatformIcon platform={profile.platform} className="size-4" />
            {platformName}
          </CardTitle>
          <div className="flex items-center gap-1">
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
              <PencilIcon aria-hidden="true" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {found ? (
            <>
              <div className="flex min-w-0 items-center gap-3">
                <ProfileAvatar
                  name={found.displayName ?? leadName}
                  src={found.avatarUrl}
                  alt={t("sales.account.profilePicture", {
                    platform: profile.platform,
                  })}
                  className="size-11"
                />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-sm">
                    {found.displayName ?? leadName}
                  </span>
                  {found.handle && (
                    <span
                      className="truncate text-muted-foreground text-xs"
                      dir="ltr"
                    >
                      {shownHandle(found.handle)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="font-semibold text-2xl tabular-nums"
                    dir="ltr"
                  >
                    {found.followers != null
                      ? new Intl.NumberFormat(locale).format(found.followers)
                      : "—"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {t("sales.account.followers")}
                  </span>
                </div>
                {checkedAt && (
                  <span className="text-muted-foreground text-xs">
                    {checkedAt}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-muted-foreground text-sm">
                {profile.kind === "notFound"
                  ? t("sales.socialNotFound")
                  : t("sales.socialNotOnFile")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="lg" variant="outline" onClick={onEdit}>
                  <PlusIcon aria-hidden="true" />
                  {t("sales.account.addProfile")}
                </Button>
                {searchUrl && (
                  <Button
                    size="lg"
                    variant="ghost"
                    render={(props) => (
                      <a
                        href={searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                      >
                        <SearchIcon aria-hidden="true" />
                        {t("sales.socialSearchGoogle")}
                      </a>
                    )}
                  />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
