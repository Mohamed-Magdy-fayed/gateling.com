import { MapPinIcon, MessageCircleIcon } from "lucide-react";
import { type ComponentProps, useId } from "react";

import type { SocialPlatform } from "@/drizzle/schema";
import { cn } from "@/lib/utils";

/**
 * Brand marks for the platforms lucide no longer ships, in each brand's own
 * colours (the `--brand-*` tokens in `globals.css`, which also flip TikTok's
 * black mark to white in dark mode). Always decorative: the platform name sits
 * next to them as text.
 */

type IconProps = Omit<ComponentProps<"svg">, "children">;

const TIKTOK_PATH =
  "M12.5 0h3.9c.1 1.5.6 3.1 1.8 4.2 1.1 1.1 2.7 1.6 4.2 1.8V10c-1.4 0-2.9-.4-4.2-1-.6-.3-1.1-.6-1.6-.9v8.7c-.1 1.4-.5 2.8-1.3 3.9-1.3 1.9-3.6 3.2-5.9 3.2-1.4.1-2.9-.3-4.1-1-2-1.2-3.4-3.4-3.6-5.7v-1.5c.2-1.9 1.1-3.7 2.6-5 1.7-1.4 4-2.1 6.1-1.7v4.4c-1-.3-2.1-.2-3 .4-.6.4-1.1 1-1.4 1.7-.2.5-.1 1.1-.1 1.6.2 1.6 1.8 3 3.5 2.9 1.1 0 2.2-.7 2.8-1.6.2-.3.4-.7.4-1.1.1-1.8.1-3.6.1-5.4V0Z";

export function FacebookIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn("text-brand-facebook", className)}
      {...props}
    >
      <path d="M9.1 23.7v-8H6.6V12h2.5v-1.6c0-4.1 1.8-6 5.9-6 .8 0 2.1.2 2.6.3v3.3l-1.4-.1c-2 0-2.7.8-2.7 2.8V12h3.9l-.7 3.7h-3.2V24C19.4 23.2 24 18.2 24 12 24 5.4 18.6 0 12 0S0 5.4 0 12c0 5.6 3.9 10.4 9.1 11.7Z" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  const gradientId = useId();
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={`url(#${gradientId})`}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="24" x2="24" y2="0">
          <stop offset="0" stopColor="var(--brand-instagram-from)" />
          <stop offset="0.5" stopColor="var(--brand-instagram-via)" />
          <stop offset="1" stopColor="var(--brand-instagram-to)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle
        cx="17.5"
        cy="6.5"
        r="0.5"
        fill="var(--brand-instagram-via)"
        stroke="none"
      />
    </svg>
  );
}

export function TiktokIcon(props: IconProps) {
  return (
    <svg viewBox="-1 -1 26 26" aria-hidden="true" {...props}>
      <path
        d={TIKTOK_PATH}
        fill="var(--brand-tiktok-cyan)"
        transform="translate(-0.8 -0.6)"
      />
      <path
        d={TIKTOK_PATH}
        fill="var(--brand-tiktok-red)"
        transform="translate(0.8 0.6)"
      />
      <path d={TIKTOK_PATH} fill="var(--brand-tiktok)" />
    </svg>
  );
}

/** The Google Maps pin, in Maps red. */
export function GoogleMapsIcon({
  className,
  ...props
}: ComponentProps<typeof MapPinIcon>) {
  return (
    <MapPinIcon
      aria-hidden="true"
      className={cn(
        "fill-brand-google-maps text-brand-google-maps [&>circle]:fill-background [&>circle]:stroke-background",
        className,
      )}
      {...props}
    />
  );
}

/** WhatsApp has no lucide mark; the chat bubble in WhatsApp green stands in. */
export function WhatsappIcon({
  className,
  ...props
}: ComponentProps<typeof MessageCircleIcon>) {
  return (
    <MessageCircleIcon
      aria-hidden="true"
      className={cn("text-brand-whatsapp", className)}
      {...props}
    />
  );
}

export function PlatformIcon({
  platform,
  ...props
}: IconProps & { platform: SocialPlatform }) {
  if (platform === "facebook") return <FacebookIcon {...props} />;
  if (platform === "instagram") return <InstagramIcon {...props} />;
  return <TiktokIcon {...props} />;
}
