"use client";

import { PencilIcon, PlusIcon } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/features/core/i18n/client";
import {
  mapsEmbedUrl,
  mapsSearchUrl,
} from "@/features/system/sales/lib/maps-embed";
import { cn } from "@/lib/utils";

import { GoogleMapsIcon } from "./platform-icon";

type Props = {
  name: string;
  address: string | null;
  onEdit: () => void;
  className?: string;
};

/** Google's keyless map for a search, built by `mapsEmbedUrl`. */
function MapsEmbed({ src, title }: { src: string; title: string }) {
  return (
    <iframe
      src={src}
      title={title}
      className="size-full border-0"
      loading="lazy"
      // Don't leak the admin URL to Google.
      referrerPolicy="strict-origin-when-cross-origin"
      tabIndex={-1}
      // Scripts + same-origin are Google's own origin inside the frame; no
      // top navigation, no forms, no access to this page.
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    />
  );
}

/**
 * The client's listing on a map, drawn from the lead's name + address. The
 * rating, reviews and category sit in the header strip; this card is the map
 * alone, and clicking it opens the place in Google Maps. Edit lives in the
 * card header.
 */
export function GoogleMapsCard({ name, address, onEdit, className }: Props) {
  const { t } = useTranslation();
  const headingId = useId();
  const embedSrc = mapsEmbedUrl({ name, address });
  const openUrl = mapsSearchUrl({ name, address });

  return (
    <section aria-labelledby={headingId} className={className}>
      <Card className="h-full gap-3 pb-0" data-testid="client-maps-card">
        <CardHeader className="flex items-center justify-between gap-2">
          <CardTitle
            id={headingId}
            className="flex items-center gap-2 text-base"
          >
            <GoogleMapsIcon className="size-4" />
            {t("sales.account.mapsHeading")}
          </CardTitle>
          <Button
            size="icon-lg"
            variant="ghost"
            aria-label={t("sales.account.editMaps")}
            onClick={onEdit}
            data-testid="maps-edit"
          >
            <PencilIcon aria-hidden="true" />
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          <div
            className={cn(
              "relative w-full overflow-hidden bg-muted",
              embedSrc && "aspect-[16/9]",
            )}
          >
            {embedSrc ? (
              <>
                <MapsEmbed
                  src={embedSrc}
                  title={t("sales.account.mapTitle", { name })}
                />
                {/* The whole map is one link: it opens the place in Maps. */}
                <a
                  href={openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
                  data-testid="maps-open"
                >
                  <span className="sr-only">
                    {t("sales.account.openInMaps")}
                  </span>
                </a>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                <p className="max-w-xs text-pretty text-sm">
                  {t("sales.account.mapMissing")}
                </p>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onEdit}
                  data-testid="maps-add-address"
                >
                  <PlusIcon aria-hidden="true" />
                  {t("sales.account.addAddress")}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
