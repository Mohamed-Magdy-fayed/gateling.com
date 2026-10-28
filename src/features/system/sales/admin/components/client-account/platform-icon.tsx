import { MessageCircleIcon } from "lucide-react";
import type { ComponentProps } from "react";

import type { SocialPlatform } from "@/drizzle/schema";

/**
 * Brand marks for the platforms lucide no longer ships. Monochrome
 * (`currentColor`) so they follow the theme tokens like every other icon.
 * Always decorative: the platform name sits next to them as text.
 */

type IconProps = Omit<ComponentProps<"svg">, "children">;

export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M9.1 23.7v-8H6.6V12h2.5v-1.6c0-4.1 1.8-6 5.9-6 .8 0 2.1.2 2.6.3v3.3l-1.4-.1c-2 0-2.7.8-2.7 2.8V12h3.9l-.7 3.7h-3.2V24C19.4 23.2 24 18.2 24 12 24 5.4 18.6 0 12 0S0 5.4 0 12c0 5.6 3.9 10.4 9.1 11.7Z" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function TiktokIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.5 0h3.9c.1 1.5.6 3.1 1.8 4.2 1.1 1.1 2.7 1.6 4.2 1.8V10c-1.4 0-2.9-.4-4.2-1-.6-.3-1.1-.6-1.6-.9v8.7c-.1 1.4-.5 2.8-1.3 3.9-1.3 1.9-3.6 3.2-5.9 3.2-1.4.1-2.9-.3-4.1-1-2-1.2-3.4-3.4-3.6-5.7v-1.5c.2-1.9 1.1-3.7 2.6-5 1.7-1.4 4-2.1 6.1-1.7v4.4c-1-.3-2.1-.2-3 .4-.6.4-1.1 1-1.4 1.7-.2.5-.1 1.1-.1 1.6.2 1.6 1.8 3 3.5 2.9 1.1 0 2.2-.7 2.8-1.6.2-.3.4-.7.4-1.1.1-1.8.1-3.6.1-5.4V0Z" />
    </svg>
  );
}

/** WhatsApp has no lucide mark; the chat bubble is what the rest of sales uses. */
export const WhatsappIcon = MessageCircleIcon;

export function PlatformIcon({
  platform,
  ...props
}: IconProps & { platform: SocialPlatform }) {
  if (platform === "facebook") return <FacebookIcon {...props} />;
  if (platform === "instagram") return <InstagramIcon {...props} />;
  return <TiktokIcon {...props} />;
}
