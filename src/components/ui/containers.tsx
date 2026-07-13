import { CheckCircle2 } from "lucide-react";
import type { ComponentType, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export { Container, type ContainerSize } from "./animated-container";

// ─── Section ─────────────────────────────────────────────────────────────────
// Five semantic section variants — use these and only these on public pages.
// feature:  standard content, white bg            → py-20
// compact:  secondary sub-content within a page   → py-12  (never for page heroes)
// alternate: muted bg, alternates with feature    → py-20 bg-muted/30
// emphasis: primary color highlight, max 1/page   → py-24 bg-primary
// cta:      always the last section on every page → py-24 gradient

type SectionVariant = "feature" | "compact" | "alternate" | "emphasis" | "cta";

const sectionVariants: Record<SectionVariant, string> = {
  feature: "py-20",
  compact: "py-12",
  alternate: "bg-muted/30 py-20",
  emphasis: "bg-primary text-primary-foreground py-24",
  cta: "bg-linear-to-br from-primary/5 via-background to-primary/10 py-24",
};

export function Section({
  variant = "feature",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { variant?: SectionVariant }) {
  return (
    <section className={cn(sectionVariants[variant], className)} {...props}>
      {children}
    </section>
  );
}

// ─── Container ───────────────────────────────────────────────────────────────
// Centered, max-width constrained, horizontally padded container.
// wide:    max-w-7xl — hero, multi-column landing layouts
// default: max-w-6xl — standard content sections
// narrow:  max-w-3xl — focused content, forms, sub-page centered text

// ─── SectionHeader ────────────────────────────────────────────────────────────
// Centered section intro: optional eyebrow label + h2 heading + subheading.
// Always use this — never write raw h2 + p for a section intro.

export function SectionHeader({
  eyebrow,
  heading,
  subheading,
  align = "center",
  className,
}: {
  eyebrow?: React.ReactNode;
  heading: React.ReactNode;
  subheading?: React.ReactNode;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div
      className={cn("mb-12", align === "center" && "text-center", className)}
    >
      {eyebrow && (
        <p className="text-primary mb-3 text-sm font-semibold uppercase tracking-widest">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
        {heading}
      </h2>
      {subheading && (
        <p
          className={cn(
            "text-muted-foreground mt-3 text-lg",
            align === "center" && "mx-auto max-w-2xl",
          )}
        >
          {subheading}
        </p>
      )}
    </div>
  );
}

// ─── HeroContainer ─────────────────────────────────────────────────────────────
// Full-viewport hero (100dvh minus 4rem sticky header) with gradient + dot grid.
// ALWAYS the first section on every public page — never use Section for a page hero.

export function HeroContainer({
  className,
  children,
  imageUrl,
  ...props
}: HTMLAttributes<HTMLElement> & { imageUrl?: string }) {
  return (
    <section
      className={cn(
        "relative flex min-h-full flex-col justify-center overflow-hidden md:min-h-[calc(100dvh-4rem)]",
        imageUrl && "bg-center bg-cover bg-no-repeat",
        className,
      )}
      style={{ backgroundImage: `url(${imageUrl})` }}
      {...props}
    >
      {/* gradient backdrop */}
      <div className="from-primary/8 via-background to-background pointer-events-none absolute inset-0 bg-linear-to-t" />
      {/* subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative z-10 py-16">{children}</div>
    </section>
  );
}

// ─── SmallHeroContainer ─────────────────────────────────────────────────────────────
// fixed hight h-80 with gradient + dot grid.
// ALWAYS the first section on most public page — never use Section for a page hero.

export function SmallHeroContainer({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "relative flex min-h-full flex-col justify-center overflow-hidden md:min-h-80",
        className,
      )}
      {...props}
    >
      {/* gradient backdrop */}
      <div className="from-primary/8 via-background to-background pointer-events-none absolute inset-0 bg-linear-to-t" />
      {/* subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative z-10 py-16">{children}</div>
    </section>
  );
}

// ─── Grid ────────────────────────────────────────────────────────────────────
// Reusable responsive grid.

type GridCols = 2 | 3 | 4;

const gridColsClasses: Record<GridCols, string> = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
};

export function Grid({
  cols = 3,
  gap = "default",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  cols?: GridCols;
  gap?: "default" | "compact";
}) {
  return (
    <div
      className={cn(
        "grid",
        gridColsClasses[cols],
        gap === "compact" ? "gap-4" : "gap-6 md:gap-8",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── ContentCard ─────────────────────────────────────────────────────────────
// Standard card primitive. Use for every card-shaped content block.
// Never write raw div with rounded-xl border p-* — always use this.

export function ContentCard({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-background rounded-xl border p-6 shadow-sm",
        "ring-primary/0 transition-all duration-200 hover:shadow-md hover:ring-1 hover:ring-primary/20",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── GradientText ─────────────────────────────────────────────────────────────
// Inline gradient text highlight for headings.

export function GradientText({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ─── Stat ─────────────────────────────────────────────────────────────────────
// A single metric/stat display (value + label, centered column).

export function Stat({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <p className="text-primary text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-muted-foreground mt-0.5 text-sm">{label}</p>
    </div>
  );
}

// ─── IconBox ─────────────────────────────────────────────────────────────────
// Sized, styled icon container with hover effect (place parent in a `group`).
// sm: h-10 w-10 rounded-lg   (compact cards)
// md: h-12 w-12 rounded-lg   (standard cards, default)
// lg: h-16 w-16 rounded-full (CTA and hero sections)

type IconBoxSize = "sm" | "md" | "lg";

const iconBoxSizes: Record<IconBoxSize, { wrapper: string; icon: string }> = {
  sm: {
    wrapper:
      "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20",
    icon: "h-5 w-5 text-primary",
  },
  md: {
    wrapper:
      "flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20",
    icon: "h-6 w-6 text-primary",
  },
  lg: {
    wrapper:
      "flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20",
    icon: "h-8 w-8 text-primary",
  },
};

export function IconBox({
  icon: Icon,
  size = "md",
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  size?: IconBoxSize;
  className?: string;
}) {
  const { wrapper, icon } = iconBoxSizes[size];
  return (
    <div className={cn(wrapper, className)}>
      <Icon className={icon} />
    </div>
  );
}

// ─── CheckItem ───────────────────────────────────────────────────────────────
// A single checked list item. Use inside `<div className="space-y-2">`.

export function CheckItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-2", className)}>
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p className="text-sm text-foreground/80">{children}</p>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
// A metric card: prominent value + descriptive label. Wraps ContentCard.

export function StatCard({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <ContentCard className={cn("text-start", className)}>
      <p className="text-primary text-lg font-bold">{value}</p>
      <p className="text-muted-foreground mt-1 text-sm">{label}</p>
    </ContentCard>
  );
}

// ─── PageHeading ─────────────────────────────────────────────────────────────
// h1 for page-level hero sections. Always use inside HeroContainer.
// Never write raw <h1 className="text-4xl ..."> on a public page.

export function PageHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn("text-4xl font-bold tracking-tight md:text-5xl", className)}
    >
      {children}
    </h1>
  );
}

// ─── CardHeading ─────────────────────────────────────────────────────────────
// h3 for ContentCard primary titles.
// Never write raw <h3 className="..."> inside a card.

export function CardHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h3 className={cn("text-lg font-semibold", className)}>{children}</h3>;
}

// ─── ProseText ───────────────────────────────────────────────────────────────
// Supporting/body paragraph with consistent muted styling.
// Never write raw <p className="text-muted-foreground ..."> for body copy.

type ProseSize = "sm" | "base" | "lg";

const proseSizes: Record<ProseSize, string> = {
  sm: "text-sm text-muted-foreground leading-relaxed",
  base: "text-base text-muted-foreground leading-relaxed",
  lg: "text-lg text-muted-foreground leading-relaxed",
};

export function ProseText({
  children,
  size = "base",
  className,
}: {
  children: React.ReactNode;
  size?: ProseSize;
  className?: string;
}) {
  return <p className={cn(proseSizes[size], className)}>{children}</p>;
}
