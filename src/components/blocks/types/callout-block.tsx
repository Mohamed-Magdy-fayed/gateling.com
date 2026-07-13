import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  XCircleIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { BlockDataByType } from "@/features/system/shared/content-blocks";
import { cn } from "@/lib/utils";
import type { BlockRendererItemProps } from "../block-renderer";
import { renderInline } from "../inline-markdown";

type Props = BlockRendererItemProps<BlockDataByType["callout"]>;

const variantClasses: Record<
  BlockDataByType["callout"]["variant"],
  { className: string; Icon: typeof InfoIcon }
> = {
  info: {
    className: "bg-primary/10 text-primary border-primary",
    Icon: InfoIcon,
  },
  warning: {
    className: "bg-amber-500/10 text-amber-600 border-amber-500",
    Icon: AlertTriangleIcon,
  },
  success: {
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500",
    Icon: CheckCircle2Icon,
  },
  danger: {
    className: "bg-destructive/10 text-destructive border-destructive",
    Icon: XCircleIcon,
  },
};

export function CalloutBlock({ contentEn, contentAr, data, locale }: Props) {
  const text = locale === "ar" ? (contentAr ?? contentEn) : contentEn;
  if (!text) return null;

  const { className, Icon } = variantClasses[data.variant ?? "info"];

  return (
    <Alert className={cn("p-4 text-sm/relaxed", className)}>
      <Icon className="size-4" />
      <AlertDescription className="text-sm text-current/90">
        {renderInline(text)}
      </AlertDescription>
    </Alert>
  );
}
