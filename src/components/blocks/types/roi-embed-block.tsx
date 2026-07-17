import { RoiCalculator } from "@/app/(landing-pages)/tools/roi-calculator/_components/roi-calculator";
import type { BlockDataByType } from "@/features/system/shared/content-blocks";

/**
 * Judgment call: `RoiCalculator` (src/app/(landing-pages)/tools/roi-calculator/_components/roi-calculator.tsx)
 * is a small, fully self-contained "use client" component with no server-only
 * dependencies, so it's imported and rendered directly rather than falling
 * back to an <iframe src="/tools/roi-calculator">. This avoids the extra
 * network round-trip / cross-origin styling mismatch an iframe would add.
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
