import type { BlockDataByType } from "@/features/system/shared/content-blocks";
import type { BlockRendererItemProps } from "../block-renderer";

type Props = BlockRendererItemProps<BlockDataByType["comparison"]>;

export function ComparisonBlock({ data, locale }: Props) {
  if (!data.rows || data.rows.length === 0) return null;

  const isAr = locale === "ar";

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-start text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-start">
            <th className="px-4 py-3 text-start font-semibold">
              {isAr ? "الميزة" : "Feature"}
            </th>
            <th className="px-4 py-3 text-start font-semibold text-muted-foreground">
              {isAr ? "يدوي" : "Manual"}
            </th>
            <th className="px-4 py-3 text-start font-semibold text-primary">
              {isAr ? "آلي" : "Automated"}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, index) => (
            <tr
              // biome-ignore lint/suspicious/noArrayIndexKey: static content list, no stable ID
              key={index}
              className="border-b last:border-0 odd:bg-muted/10"
            >
              <td className="px-4 py-3 font-medium">
                {isAr ? (row.featureAr ?? row.featureEn) : row.featureEn}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {isAr ? (row.manualAr ?? row.manualEn) : row.manualEn}
              </td>
              <td className="px-4 py-3 text-primary">
                {isAr ? (row.automatedAr ?? row.automatedEn) : row.automatedEn}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
