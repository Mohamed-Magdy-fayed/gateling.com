"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

/**
 * A row of single-choice chips: one tap instead of opening a select, which is
 * what keeps phone logging fast. A labelled group of toggle buttons; the
 * selected one is `aria-pressed`.
 */
export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: readonly Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <fieldset className={cn("flex flex-wrap gap-2", className)}>
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Button
            key={option.value}
            type="button"
            aria-pressed={selected}
            variant={selected ? "default" : "outline"}
            className="min-h-11 px-3 text-sm sm:min-h-8 sm:text-xs"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </fieldset>
  );
}
