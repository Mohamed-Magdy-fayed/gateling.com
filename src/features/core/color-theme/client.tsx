"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Swap, SwapOff, SwapOn } from "@/components/ui/swap";
import { useTranslation } from "@/features/core/i18n/client";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn("cursor-pointer hover:bg-accent! hover:text-accent-foreground! transition-all duration-300", className)}
      {...props}
    >
      <Swap mode="dark" animation="rotate" forceTransition>
        <SwapOn>
          <SunIcon className="h-4 w-4" />
        </SwapOn>
        <SwapOff>
          <MoonIcon className="h-4 w-4" />
        </SwapOff>
      </Swap>
      <span className="sr-only">{t("themeToggle")}</span>
    </Button>
  );
}
