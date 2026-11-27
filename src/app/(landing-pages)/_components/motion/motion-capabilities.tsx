import {
  BarChart3Icon,
  Code2Icon,
  LayersIcon,
  MonitorIcon,
  Settings2Icon,
  SparklesIcon,
} from "lucide-react";

import { LinkButton } from "@/components/general/link-button";
import { cn } from "@/lib/utils";
import styles from "./motion.module.css";
import { cssVars } from "./motion-style";
import { SplitWords } from "./split-words";

const ICONS = [
  SparklesIcon,
  MonitorIcon,
  Code2Icon,
  LayersIcon,
  BarChart3Icon,
  Settings2Icon,
];

type Props = {
  eyebrow: string;
  heading: string;
  items: { title: string; description: string; number: string }[];
  cta: {
    title: string;
    description: string;
    services: string;
    contact: string;
  };
};

export function MotionCapabilities({ eyebrow, heading, items, cta }: Props) {
  const names = items.map((i) => i.title);

  return (
    <>
      {/* Horizontal ride: vertical scroll drives the cards sideways (scroll-linked). */}
      <section
        aria-labelledby="motion-cap-heading"
        className={cn(styles.track, styles.ride, "bg-primary/10")}
        style={cssVars({ "--cards": items.length })}
      >
        <div
          className={cn(
            styles.stage,
            "flex min-h-svh flex-col justify-center overflow-clip py-24",
          )}
        >
          <div
            className={cn(
              styles.tg,
              "mx-auto mb-12 w-full max-w-7xl px-4 md:px-8 lg:px-16",
            )}
          >
            <p
              className={cn(
                styles.riseEyebrow,
                "mb-3 text-sm font-bold uppercase text-primary",
              )}
            >
              {eyebrow}
            </p>
            <h2
              id="motion-cap-heading"
              className={cn(
                styles.riseWords,
                "max-w-4xl text-balance text-4xl font-black leading-[1.05] sm:text-6xl lg:text-7xl",
              )}
            >
              <SplitWords text={heading} />
            </h2>
          </div>

          <div className="perspective-[1400px]">
            <ul
              className={cn(
                styles.rideTrack,
                "flex w-max px-4 md:px-8 lg:px-16",
              )}
            >
              {items.map(({ title, description, number }, i) => {
                const Icon = ICONS[i % ICONS.length];
                return (
                  <li
                    key={title}
                    className={cn(
                      styles.cap,
                      "flex min-h-80 flex-col justify-between rounded-3xl border border-border bg-background p-8 shadow-xl",
                    )}
                    style={cssVars({ "--i": i })}
                  >
                    <div className="flex items-start justify-between">
                      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                        <Icon aria-hidden className="size-7" />
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "text-7xl font-black leading-none lg:text-8xl",
                          styles.outline,
                        )}
                      >
                        {number}
                      </span>
                    </div>
                    <div>
                      <h3 className="mb-3 text-2xl font-extrabold lg:text-3xl">
                        {title}
                      </h3>
                      <p className="text-pretty text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Where to go next: the full services list, or a conversation. */}
      <div
        className={cn(
          styles.tg,
          "bg-primary/10 px-4 pb-20 text-center md:px-8",
        )}
      >
        <h3
          className={cn(
            styles.riseEyebrow,
            "mx-auto max-w-2xl text-balance text-2xl font-extrabold md:text-3xl",
          )}
        >
          {cta.title}
        </h3>
        <p
          className={cn(
            styles.afterWipe,
            "mx-auto mt-3 max-w-2xl text-pretty text-muted-foreground",
          )}
          style={cssVars({ "--d": "0.1s" })}
        >
          {cta.description}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <span className={styles.ctaPop} style={cssVars({ "--i": 0 })}>
            <LinkButton href="/services" size="lg">
              {cta.services}
            </LinkButton>
          </span>
          <span className={styles.ctaPop} style={cssVars({ "--i": 1 })}>
            <LinkButton href="/contact" variant="outline" size="lg">
              {cta.contact}
            </LinkButton>
          </span>
        </div>
      </div>

      <div aria-hidden className="overflow-clip border-y border-border py-8">
        {[0, 1].map((row) => (
          <div
            key={row}
            className={cn(
              styles.marqueePush,
              row === 1 && styles.marqueePushReverse,
            )}
          >
            <div
              className={cn(
                styles.marqueeRow,
                row === 1 && styles.marqueeRowReverse,
                row === 1 && styles.outline,
                "flex w-max whitespace-nowrap py-2 text-5xl font-black sm:text-7xl lg:text-8xl",
              )}
            >
              {[...names, ...names].map((name, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: duplicated decorative run
                <span key={i} className="flex items-center gap-10 pe-10">
                  {name}
                  <span className="inline-block size-4 rotate-45 bg-primary" />
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
