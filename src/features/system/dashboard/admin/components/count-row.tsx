import { Badge } from "@/components/ui/badge";

type Props = {
  label: string;
  hint?: string;
  count: number;
  /** Highlight a non-zero count as something to act on now. */
  urgent?: boolean;
};

/** One labelled count in a dashboard list. */
export function CountRow({ label, hint, count, urgent = false }: Props) {
  return (
    <li className="flex items-start justify-between gap-3 py-2">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm">{label}</span>
        {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
      </div>
      <Badge
        variant={
          urgent && count > 0
            ? "destructive"
            : count > 0
              ? "secondary"
              : "outline"
        }
        className="tabular-nums"
      >
        {count}
      </Badge>
    </li>
  );
}
