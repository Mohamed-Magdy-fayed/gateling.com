"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toEmbedUrl } from "@/components/general/embed-url";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/core/i18n/client";
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
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  // Autoplay must stay muted (browsers block unmuted autoplay), so sound is
  // opt-in: the first tap restarts the clip with sound; after that a small
  // corner toggle mutes/unmutes. Shown for every self-hosted clip: reading
  // whether a file has an audio track isn't reliable across browsers.
  const [hasOptedIntoSound, setHasOptedIntoSound] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  async function handlePlayWithSound() {
    const el = videoRef.current;
    if (!el || isStarting) return;
    setIsStarting(true);
    el.muted = false;
    el.currentTime = 0;
    try {
      await el.play();
      setIsMuted(false);
      setHasOptedIntoSound(true);
    } catch {
      // Playback refused: fall back to the muted state and keep the overlay.
      el.muted = true;
      setIsMuted(true);
    } finally {
      setIsStarting(false);
    }
  }

  function handleToggleMute() {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  }

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

  const toggleLabel = String(
    t(isMuted ? "blocks.unmuteVideo" : "blocks.muteVideo"),
  );

  return (
    <>
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

      {hasOptedIntoSound ? (
        <Button
          type="button"
          aria-label={toggleLabel}
          aria-pressed={!isMuted}
          onClick={handleToggleMute}
          data-testid="device-player-mute-toggle"
          className="absolute end-3 top-3 size-11 rounded-full bg-foreground/60 text-background hover:bg-foreground/80 focus-visible:ring-4 focus-visible:ring-primary-foreground [&_svg:not([class*='size-'])]:size-5"
        >
          {isMuted ? (
            <VolumeX aria-hidden="true" />
          ) : (
            <Volume2 aria-hidden="true" />
          )}
        </Button>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-primary/60 motion-safe:animate-ping motion-reduce:hidden"
            />
            <Button
              type="button"
              aria-label={String(t("blocks.playWithSound"))}
              onClick={handlePlayWithSound}
              disabled={isStarting}
              data-testid="device-player-unmute"
              className="relative h-12 gap-2 rounded-full px-5 text-sm shadow-lg focus-visible:ring-4 focus-visible:ring-primary-foreground [&_svg:not([class*='size-'])]:size-5"
            >
              <Volume2 aria-hidden="true" />
              {t("blocks.tapForSound")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export function DevicePlayerBlock({ data }: Props) {
  const { t } = useTranslation();
  if (!isSafeHref(data.videoUrl)) return null;

  const embedUrl = toEmbedUrl(data.videoUrl);
  const isPhone = data.device === "phone";

  return (
    <div className="flex justify-center">
      <div
        data-testid="device-player-frame"
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
            title={String(t("blocks.devicePreview"))}
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
