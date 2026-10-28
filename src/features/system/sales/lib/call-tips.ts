import type { SocialPlatform } from "@/drizzle/schema";

/**
 * "Before you call": short openers built only from what is on file for the
 * client. Each tip is data (a kind plus its values), not text, so the page
 * translates it; a tip whose facts are missing is simply left out.
 */

export type CallTipInput = {
  whatsappName: string | null;
  rating: number | null;
  reviewCount: number | null;
  followers: Partial<Record<SocialPlatform, number | null>>;
  locationCount: number;
};

export type CallTip =
  | { kind: "askFor"; name: string }
  | { kind: "rating"; rating: number; reviews: number }
  | { kind: "topPlatform"; platform: SocialPlatform; followers: number }
  | { kind: "locations"; count: number };

export function callTips(input: CallTipInput): CallTip[] {
  const tips: CallTip[] = [];

  const name = input.whatsappName?.trim();
  if (name) tips.push({ kind: "askFor", name });

  if (
    input.rating !== null &&
    input.reviewCount !== null &&
    input.reviewCount > 0
  ) {
    tips.push({
      kind: "rating",
      rating: input.rating,
      reviews: input.reviewCount,
    });
  }

  const top = (
    Object.entries(input.followers) as [SocialPlatform, number | null][]
  )
    .filter((entry): entry is [SocialPlatform, number] => (entry[1] ?? 0) > 0)
    .sort((a, b) => b[1] - a[1])[0];
  if (top)
    tips.push({ kind: "topPlatform", platform: top[0], followers: top[1] });

  // One shop has no "which location books?" question to ask.
  if (input.locationCount > 1) {
    tips.push({ kind: "locations", count: input.locationCount });
  }

  return tips;
}
