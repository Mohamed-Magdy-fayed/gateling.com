import { RoiCalculator } from "@/app/(landing-pages)/tools/roi-calculator/_components/roi-calculator";

/**
 * Judgment call: `RoiCalculator` (src/app/(landing-pages)/tools/roi-calculator/_components/roi-calculator.tsx)
 * is a small, fully self-contained "use client" component with no server-only
 * dependencies, so it's imported and rendered directly rather than falling
 * back to an <iframe src="/tools/roi-calculator">. This avoids the extra
 * network round-trip / cross-origin styling mismatch an iframe would add.
 */
export function RoiEmbedBlock() {
  return <RoiCalculator />;
}
