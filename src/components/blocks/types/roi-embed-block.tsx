import type { BlockDataByType } from "@/features/system/shared/content-blocks";
import { RoiCalculator } from "@/components/blocks/roi-calculator";

/**
 * `RoiCalculator` is a small, self-contained "use client" component with no
 * server-only dependencies, so it is imported and rendered directly.
 *
 * It used to live under `/tools/roi-calculator`, which is why this comment once
 * described the alternative of an <iframe> pointing at that page. The standalone
 * page was removed in SEO Phase 2 — roughly 60 words of prose around a widget,
 * with nothing to rank for — and the component moved here, to its only
 * remaining consumer. `/tools/roi-calculator` now 308s to `/services`.
 *
 * The block's `data` lets an author tailor the calculator to the work item:
 * pre-fill the starting numbers for that business and keep or remove the CTA.
 */
export function RoiEmbedBlock({
  data,
}: {
  data?: BlockDataByType["roi_embed"] | null;
}) {
  return (
    <RoiCalculator
      showCta={data?.showCta ?? true}
      teamSize={data?.teamSize}
      hoursPerWeek={data?.hoursPerWeek}
      hourlyRate={data?.hourlyRate}
      currency={data?.currency}
    />
  );
}
