"use client";

import { MapPinIcon, PhoneIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { H1 } from "@/components/ui/typography";
import type { LeadPipelineStatus, LeadTier } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";

import { WhatsappIcon } from "./platform-icon";
import { ProfileAvatar } from "./profile-avatar";

type Props = {
  name: string;
  nameAr: string | null;
  avatarUrl: string | null;
  status: LeadPipelineStatus;
  tier: LeadTier | null;
  category: string | null;
  city: string | null;
  phone: string | null;
  whatsappUrl: string | null;
  /** The reach strip, under a divider. */
  children?: ReactNode;
};

/**
 * Who the client is and the two ways to reach them. On phones the call and
 * WhatsApp buttons move to the sticky `MobileActionBar` instead.
 */
export function ClientHero({
  name,
  nameAr,
  avatarUrl,
  status,
  tier,
  category,
  city,
  phone,
  whatsappUrl,
  children,
}: Props) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <ProfileAvatar name={name} src={avatarUrl} className="size-16" />
            <div className="flex min-w-0 flex-col gap-1.5">
              <H1 className="text-balance text-2xl sm:text-3xl">{name}</H1>
              {nameAr && (
                <p
                  lang="ar"
                  dir="rtl"
                  className="text-muted-foreground text-sm"
                >
                  {nameAr}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge>{t("sales.statuses", { status })}</Badge>
                {tier && (
                  <Badge variant="outline">
                    {t("sales.account.tierBadge", { tier })}
                  </Badge>
                )}
                {category && <Badge variant="secondary">{category}</Badge>}
                {city && (
                  <Badge variant="secondary">
                    <MapPinIcon aria-hidden="true" />
                    {city}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            {phone && (
              <Button
                size="lg"
                className="h-11 px-4"
                render={(props) => (
                  <a href={`tel:${phone}`} {...props}>
                    <PhoneIcon aria-hidden="true" />
                    <span className="flex flex-col items-start leading-tight">
                      <span>{t("sales.callNow")}</span>
                      <span
                        className="font-normal text-xs opacity-80"
                        dir="ltr"
                      >
                        {phone}
                      </span>
                    </span>
                  </a>
                )}
              />
            )}
            {whatsappUrl && (
              <Button
                size="lg"
                variant="outline"
                className="h-11 px-4"
                render={(props) => (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  >
                    <WhatsappIcon aria-hidden="true" />
                    {t("sales.account.whatsapp")}
                  </a>
                )}
              />
            )}
          </div>
        </div>

        {children && (
          <>
            <Separator />
            {children}
          </>
        )}
      </CardContent>
    </Card>
  );
}
