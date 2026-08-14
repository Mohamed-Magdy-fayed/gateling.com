import {
  Bot,
  Code,
  Cpu,
  Globe,
  LayoutDashboard,
  type LucideProps,
  Map as MapIcon,
  RefreshCw,
  Settings,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

/**
 * `services.icon` is a free-text column an admin types into, so an unknown
 * value must degrade rather than crash — every lookup falls back to `Zap`.
 * Adding an icon here is what makes it selectable in practice.
 */
const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  Bot,
  Code,
  Cpu,
  Globe,
  LayoutDashboard,
  Map: MapIcon,
  RefreshCw,
  Settings,
  Zap,
};

export function ServiceIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name] ?? Zap;
  return <Icon className={cn("text-primary h-10 w-10", className)} />;
}
