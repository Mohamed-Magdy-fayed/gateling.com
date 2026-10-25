"use client";

import { ExternalLinkIcon, SearchIcon } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type SocialLeadFields,
  type SocialProfile,
  socialProfiles,
} from "@/features/system/sales/lib/social-profiles";

type Props = { lead: SocialLeadFields };

/**
 * One card per social platform for the Up-next lead: what research found, or
 * a Google search (name + platform + address) to go and find it.
 */
export function TodaySocialProfiles({ lead }: Props) {
  const { t } = useTranslation();
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="font-semibold text-base">
        {t("sales.socialTitle")}
      </h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {socialProfiles(lead).map((profile) => (
          <li key={profile.platform} className="flex">
            <SocialProfileCard profile={profile} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function SocialProfileCard({ profile }: { profile: SocialProfile }) {
  const { t, locale } = useTranslation();
  const titleId = useId();
  const numberFmt = new Intl.NumberFormat(locale);
  const checkedAt =
    profile.kind !== "missing" && profile.checkedAt
      ? t("sales.socialCheckedAt", {
          date: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
            new Date(profile.checkedAt),
          ),
        })
      : null;

  return (
    <Card size="sm" className="w-full">
      <CardContent className="flex h-full flex-col items-start gap-2">
        <h3 id={titleId} className="font-medium text-sm">
          {t("sales.socialPlatform", { platform: profile.platform })}
        </h3>

        {profile.kind === "found" ? (
          <>
            <div className="flex min-w-0 max-w-full flex-col gap-1">
              {profile.handle && (
                <span
                  dir="ltr"
                  className="truncate text-start font-mono text-sm"
                >
                  {profile.handle.startsWith("http")
                    ? profile.handle
                    : `@${profile.handle}`}
                </span>
              )}
              {(profile.followers !== null || profile.posts !== null) && (
                <dl className="flex flex-wrap gap-x-3 text-xs">
                  {profile.followers !== null && (
                    <div className="flex gap-1">
                      <dt className="text-muted-foreground">
                        {t("sales.fieldSocialFollowers")}
                      </dt>
                      <dd className="font-medium tabular-nums">
                        {numberFmt.format(profile.followers)}
                      </dd>
                    </div>
                  )}
                  {profile.posts !== null && (
                    <div className="flex gap-1">
                      <dt className="text-muted-foreground">
                        {t("sales.socialPosts")}
                      </dt>
                      <dd className="font-medium tabular-nums">
                        {numberFmt.format(profile.posts)}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
              {profile.bio && (
                <p dir="auto" className="line-clamp-3 text-pretty text-xs">
                  {profile.bio}
                </p>
              )}
              {checkedAt && (
                <p className="text-muted-foreground text-xs">{checkedAt}</p>
              )}
            </div>
            {profile.profileUrl && (
              <Button
                variant="outline"
                size="sm"
                aria-describedby={titleId}
                className="mt-auto max-sm:min-h-11"
                render={(props) => (
                  <a
                    href={profile.profileUrl ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  >
                    <ExternalLinkIcon aria-hidden="true" />
                    {t("sales.socialOpenProfile")}
                  </a>
                )}
              />
            )}
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-xs">
              {profile.kind === "notFound"
                ? t("sales.socialNotFound")
                : t("sales.socialNotOnFile")}
              {checkedAt && ` · ${checkedAt}`}
            </p>
            <Button
              variant="outline"
              size="sm"
              aria-describedby={titleId}
              className="mt-auto max-sm:min-h-11"
              render={(props) => (
                <a
                  href={profile.searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                >
                  <SearchIcon aria-hidden="true" />
                  {t("sales.socialSearchGoogle")}
                </a>
              )}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
