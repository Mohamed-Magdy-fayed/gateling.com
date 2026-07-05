"use client";

import type { HTMLAttributes } from "react";
import { useScrollAnimation } from "@/hooks/use-animation";
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
  const { elementRef, isVisible } = useScrollAnimation();

  return (
    <div
      ref={elementRef}
      className={cn(
        "container mx-auto px-4 md:px-8 lg:px-16 duration-1000 transition-all",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
        containerSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
