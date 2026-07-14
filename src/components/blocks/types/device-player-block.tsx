"use client";

import { useEffect, useRef, useState } from "react";
import { toEmbedUrl } from "@/components/general/media-section";
import type { BlockDataByType } from "@/features/system/shared/content-blocks";
import { cn } from "@/lib/utils";
import type { BlockRendererItemProps } from "../block-renderer";
import { isSafeHref } from "../safe-url";

type Props = BlockRendererItemProps<BlockDataByType["device_player"]>;

/**
 * Judgment call: `toEmbedUrl` only recognizes third-party hosts (YouTube,
 * Vimeo, Facebook, TikTok) and returns "" for anything else — including a
 * direct Firebase Storage MP4/WebM URL from a self-hosted upload. So a
 * self-hosted clip is the one that falls through to the native <video> path
 * below (muted/looped/poster, play only while in view) — matching the
 * plan's "self-hosted via Firebase for LCP" guidance without needing a
 * separate "is this self-hosted" flag on the block data.
 */
function SelfHostedVideo({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const onChange = () => setReducedMotion(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || reducedMotion) return;
    if (typeof IntersectionObserver === "undefined") {
      el.play().catch(() => {});
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      className="absolute inset-0 h-full w-full object-cover"
    >
      <track kind="captions" />
    </video>
  );
}

export function DevicePlayerBlock({ data, locale }: Props) {
  if (!isSafeHref(data.videoUrl)) return null;

  const embedUrl = toEmbedUrl(data.videoUrl);
  const isPhone = data.device === "phone";

  return (
    <div className="flex justify-center">
      <div
        className={cn(
          "relative overflow-hidden rounded-[2rem] border-8 border-foreground/90 bg-foreground shadow-xl",
          isPhone
            ? "aspect-9/19 w-full max-w-[280px]"
            : "aspect-video w-full max-w-3xl rounded-xl border-4",
        )}
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={locale === "ar" ? "معاينة الجهاز" : "device preview"}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <SelfHostedVideo src={data.videoUrl} poster={data.poster} />
        )}
      </div>
    </div>
  );
}
