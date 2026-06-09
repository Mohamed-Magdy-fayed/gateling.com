"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayCircleIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export type MediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  title?: string | null;
  isFeatured: boolean;
  isSecondary: boolean;
  sortOrder: number;
};

function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}?rel=0`;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}?rel=0`;
    }
    if (u.hostname === "vimeo.com") {
      const id = u.pathname.slice(1);
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    // pass through
  }
  return url;
}

function MediaDisplay({
  item,
  priority = false,
  className,
}: {
  item: MediaItem;
  priority?: boolean;
  className?: string;
}) {
  if (item.type === "video") {
    return (
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-xl",
          className,
        )}
      >
        <iframe
          src={toEmbedUrl(item.url)}
          title={item.title ?? ""}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-xl",
        className,
      )}
    >
      <Image
        src={item.url}
        alt={item.title ?? ""}
        fill
        priority={priority}
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1200px"
      />
    </div>
  );
}

type Props = {
  items: MediaItem[];
  className?: string;
};

export function MediaSection({ items, className }: Props) {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const featured = sorted.find((i) => i.isFeatured) ?? sorted[0];
  const [activeId, setActiveId] = useState<string>(featured?.id ?? "");

  if (!sorted.length) return null;

  const activeIndex = sorted.findIndex((i) => i.id === activeId);
  const activeItem = sorted[activeIndex] ?? sorted[0];

  if (!activeItem) return null;

  function prev() {
    setActiveId(sorted[(activeIndex - 1 + sorted.length) % sorted.length].id);
  }
  function next() {
    setActiveId(sorted[(activeIndex + 1) % sorted.length].id);
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main viewer */}
      <div className="relative">
        <MediaDisplay
          item={activeItem}
          priority={activeItem.id === featured?.id}
        />

        {sorted.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute inset-s-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
              onClick={prev}
              aria-label="Previous"
            >
              <ChevronLeftIcon className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute inset-e-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
              onClick={next}
              aria-label="Next"
            >
              <ChevronRightIcon className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </>
        )}
      </div>

      {activeItem.title && (
        <p className="text-muted-foreground text-center text-sm">
          {activeItem.title}
        </p>
      )}

      {/* Thumbnail strip */}
      {sorted.length > 1 && (
        <Carousel opts={{ align: "start", loop: false }} className="w-full">
          <CarouselContent className="-ms-2">
            {sorted.map((item) => (
              <CarouselItem
                key={item.id}
                className="ps-2 basis-1/3 sm:basis-1/4 md:basis-1/5"
              >
                <button
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  className={cn(
                    "relative aspect-video w-full overflow-hidden rounded-lg border-2 transition-all",
                    item.id === activeId
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border/60 hover:border-primary/50",
                  )}
                >
                  {item.type === "video" ? (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <PlayCircleIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  ) : (
                    <Image
                      src={item.url}
                      alt={item.title ?? ""}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  )}
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
    </div>
  );
}
