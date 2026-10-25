"use client";

import { ExternalLinkIcon, SearchIcon } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type SocialLeadFields,
  type SocialProfile,
  socialProfiles,
} from "@/features/system/sales/lib/social-profiles";

type Props = { lead: SocialLeadFields; className?: string };

/**
 * The lead's social profiles as a compact list inside the Up-next card: what
 * research found, or a Google search (name + platform + address) to find it.
 */
export function TodaySocialProfiles({ lead, className }: Props) {
  const { t } = useTranslation();
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className={className}>
      <h4 id={headingId} className="font-medium text-muted-foreground text-xs">
        {t("sales.socialTitle")}
      </h4>
      <ul className="flex flex-col divide-y">
        {socialProfiles(lead).map((profile) => (
          <SocialProfileRow key={profile.platform} profile={profile} />
        ))}
      </ul>
    </section>
  );
}

function SocialProfileRow({ profile }: { profile: SocialProfile }) {
  const { t, locale } = useTranslation();
  const nameId = useId();
  const numberFmt = new Intl.NumberFormat(locale);
  const checkedAt =
    profile.kind !== "missing" && profile.checkedAt
      ? t("sales.socialCheckedAt", {
          date: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
            new Date(profile.checkedAt),
          ),
        })
      : null;

  const found = profile.kind === "found" ? profile : null;
  const href = found
    ? found.profileUrl
    : profile.kind !== "found"
      ? profile.searchUrl
      : null;

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
      <div className="flex min-w-0 flex-1 basis-40 flex-col gap-0.5">
        <span id={nameId} className="font-medium text-sm">
          {t("sales.socialPlatform", { platform: profile.platform })}
        </span>

        {found ? (
          <>
            {found.handle && (
              <span dir="ltr" className="truncate text-start font-mono text-sm">
                {found.handle.startsWith("http")
                  ? found.handle
                  : `@${found.handle}`}
              </span>
            )}
            {(found.followers !== null || found.posts !== null) && (
              <dl className="flex flex-wrap gap-x-3 text-xs">
                {found.followers !== null && (
                  <div className="flex gap-1">
                    <dt className="text-muted-foreground">
                      {t("sales.fieldSocialFollowers")}
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {numberFmt.format(found.followers)}
                    </dd>
                  </div>
                )}
                {found.posts !== null && (
                  <div className="flex gap-1">
                    <dt className="text-muted-foreground">
                      {t("sales.socialPosts")}
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {numberFmt.format(found.posts)}
                    </dd>
                  </div>
                )}
              </dl>
            )}
            {found.bio && (
              <p
                dir="auto"
                className="line-clamp-2 text-pretty text-muted-foreground text-xs"
              >
                {found.bio}
              </p>
            )}
          </>
        ) : (
          <span className="text-muted-foreground text-xs">
            {profile.kind === "notFound"
              ? t("sales.socialNotFound")
              : t("sales.socialNotOnFile")}
          </span>
        )}

        {checkedAt && (
          <span className="text-muted-foreground text-xs">{checkedAt}</span>
        )}
      </div>

      {href && (
        <Button
          variant="outline"
          size="sm"
          aria-describedby={nameId}
          className="shrink-0 max-sm:min-h-11"
          render={(props) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {found ? (
                <ExternalLinkIcon aria-hidden="true" />
              ) : (
                <SearchIcon aria-hidden="true" />
              )}
              {found
                ? t("sales.socialOpenProfile")
                : t("sales.socialSearchGoogle")}
            </a>
          )}
        />
      )}
    </li>
  );
}
