"use client";

import { BadgeCheckIcon, ExternalLinkIcon } from "lucide-react";
import { useId } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/features/core/i18n/client";

import { WhatsappIcon } from "./platform-icon";
import { ProfileAvatar } from "./profile-avatar";

type Props = {
  /** The display name WhatsApp shows for the number. */
  name: string | null;
  number: string | null;
  isBusiness: boolean | null;
  chatUrl: string | null;
  onEdit: () => void;
};

export function WhatsAppCard({
  name,
  number,
  isBusiness,
  chatUrl,
  onEdit,
}: Props) {
  const { t } = useTranslation();
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <Card data-testid="client-whatsapp-card">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle
            id={headingId}
            className="flex items-center gap-2 text-base"
          >
            <WhatsappIcon aria-hidden="true" className="size-4" />
            {t("sales.account.whatsapp")}
          </CardTitle>
          {isBusiness && (
            <Badge variant="secondary">
              <BadgeCheckIcon aria-hidden="true" />
              {t("sales.account.businessAccount")}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {number ? (
            <div className="flex items-center gap-3">
              <ProfileAvatar
                name={name ?? number}
                src={null}
                className="size-10"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-sm">
                  {name ?? t("sales.account.whatsappNoName")}
                </span>
                <span
                  className="text-muted-foreground text-xs tabular-nums"
                  dir="ltr"
                >
                  {number}
                </span>
              </div>
              {chatUrl && (
                <Button
                  size="icon-lg"
                  variant="outline"
                  aria-label={t("sales.account.openWhatsappChat")}
                  render={(props) => (
                    <a
                      href={chatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      <ExternalLinkIcon aria-hidden="true" />
                    </a>
                  )}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-2">
              <p className="text-muted-foreground text-sm">
                {t("sales.account.whatsappMissing")}
              </p>
              <Button size="lg" variant="outline" onClick={onEdit}>
                {t("common.edit")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
