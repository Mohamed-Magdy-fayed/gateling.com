"use client";

import {
  ExternalLinkIcon,
  MapPinIcon,
  NavigationIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import type { LeadLocation } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import {
  isMapsEmbedSrc,
  mapsDirectionsUrl,
  mapsSearchUrl,
} from "@/features/system/sales/lib/maps-embed";
import { cn } from "@/lib/utils";

type Props = {
  /** The main location; null shows the "add main location" prompt. */
  location: LeadLocation | null;
  onAdd: () => void;
  onEdit: (location: LeadLocation) => void;
  className?: string;
};

/** A live Google Maps embed. Only ever a `src` this app rebuilt and re-checked. */
export function MapsEmbed({ src, title }: { src: string; title: string }) {
  if (!isMapsEmbedSrc(src)) return null;
  return (
    <iframe
      src={src}
      title={title}
      className="size-full border-0"
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      // Scripts + same-origin are Google's own origin inside the frame; no
      // top navigation, no forms, no access to this page.
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    />
  );
}

export function GoogleMapsCard({ location, onAdd, onEdit, className }: Props) {
  const { t, locale } = useTranslation();
  const headingId = useId();
  const decimal = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const integer = new Intl.NumberFormat(locale);

  return (
    <section aria-labelledby={headingId}>
      <Card className={cn("pt-0", className)} data-testid="client-maps-card">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted sm:aspect-[21/9]">
          {location?.embedSrc ? (
            <MapsEmbed
              src={location.embedSrc}
              title={t("sales.account.mapTitle", { name: location.name })}
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
              <MapPinIcon aria-hidden="true" className="size-8" />
              <p className="max-w-xs text-pretty text-sm">
                {location
                  ? t("sales.account.mapMissing")
                  : t("sales.account.noLocations")}
              </p>
              <Button
                size="lg"
                variant="outline"
                onClick={() => (location ? onEdit(location) : onAdd())}
                data-testid="maps-add-embed"
              >
                <PlusIcon aria-hidden="true" />
                {location
                  ? t("sales.account.addEmbed")
                  : t("sales.account.addMainLocation")}
              </Button>
            </div>
          )}
        </div>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 id={headingId} className="font-semibold text-lg">
                {location?.name ?? t("sales.account.mapsHeading")}
              </h2>
              {location && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  {location.rating != null ? (
                    <>
                      <span className="font-semibold tabular-nums" dir="ltr">
                        {decimal.format(location.rating)}
                      </span>
                      <StarRating
                        value={location.rating}
                        label={t("sales.account.ratingLabel", {
                          rating: decimal.format(location.rating),
                        })}
                      />
                      {location.reviewCount != null && (
                        <span className="text-muted-foreground tabular-nums">
                          ({integer.format(location.reviewCount)})
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">
                      {t("sales.account.noRating")}
                    </span>
                  )}
                  {location.category && (
                    <>
                      <span
                        aria-hidden="true"
                        className="text-muted-foreground"
                      >
                        ·
                      </span>
                      <span className="text-muted-foreground">
                        {location.category}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {location && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="lg"
                  render={(props) => (
                    <a
                      href={mapsDirectionsUrl(location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      <NavigationIcon aria-hidden="true" />
                      {t("sales.account.directions")}
                    </a>
                  )}
                />
                <Button
                  size="lg"
                  variant="outline"
                  render={(props) => (
                    <a
                      href={mapsSearchUrl(location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      {t("sales.account.openInMaps")}
                      <ExternalLinkIcon aria-hidden="true" />
                    </a>
                  )}
                />
                <Button
                  size="icon-lg"
                  variant="ghost"
                  aria-label={t("sales.account.editLocation")}
                  onClick={() => onEdit(location)}
                >
                  <PencilIcon aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>

          {location && (
            <dl className="flex items-start gap-2 text-sm">
              <MapPinIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              />
              <div className="flex min-w-0 flex-col">
                <dt className="text-muted-foreground text-xs">
                  {t("sales.fieldAddress")}
                </dt>
                <dd className="text-pretty">{location.address ?? "—"}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
