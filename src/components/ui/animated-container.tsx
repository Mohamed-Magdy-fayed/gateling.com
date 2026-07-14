import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ContainerSize = "default" | "narrow" | "wide";

const containerSizes: Record<ContainerSize, string> = {
  default: "max-w-6xl",
  narrow: "max-w-3xl",
  wide: "max-w-7xl",
};

export function Container({
  size = "default",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { size?: ContainerSize }) {
  return (
    <div
      className={cn(
        "container mx-auto px-4 md:px-8 lg:px-16 scroll-reveal",
        containerSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
