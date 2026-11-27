import { ArrowRightIcon, CheckCircleIcon, StarIcon } from "lucide-react";

import { LinkButton } from "@/components/general/link-button";
import { cn } from "@/lib/utils";
import styles from "./motion.module.css";
import { MotionCurtain } from "./motion-curtain";
import { cssVars } from "./motion-style";
import { SplitWords } from "./split-words";
import { WORDMARK_VIEWBOX, WordmarkShapes } from "./wordmark";

type Props = {
  trust: string[];
  headlinePart1: string;
  headlinePart2: string;
  lead: string;
  ctaContact: string;
  ctaWork: string;
  live: string;
};

const BARS = [38, 62, 45, 80, 58, 92, 70];
const SKELETON = ["w-full", "w-5/6", "w-2/3"];

export function MotionHero({
  trust,
  headlinePart1,
  headlinePart2,
  lead,
  ctaContact,
  ctaWork,
  live,
}: Props) {
  return (
    <>
      <MotionCurtain />
      <div
        aria-hidden
        className={cn(
          styles.progress,
          "fixed inset-x-0 top-0 z-60 h-1 bg-primary",
        )}
      />

      <section
        className={cn(
          styles.heroTimeline,
          "relative flex min-h-svh items-center overflow-clip py-16",
        )}
      >
        {/* Giant outlined wordmark behind everything. It starts at the page's
            start padding and scrolls until its far end meets the end padding.
            The intro curtain's word lands exactly here (.wordmarkAnchor). */}
        <div
          aria-hidden
          className={cn(
            styles.wordmarkAnchor,
            "pointer-events-none select-none",
          )}
        >
          <div className={cn(styles.wordmarkOut, styles.wordmarkMover)}>
            <svg
              aria-hidden="true"
              viewBox={WORDMARK_VIEWBOX}
              direction="ltr"
              className={cn(styles.introWordmark, styles.wordmarkSvg)}
            >
              <WordmarkShapes />
            </svg>
          </div>
        </div>

        <div
          className={cn(
            styles.heroOut,
            "relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 md:px-8 lg:grid-cols-2 lg:px-16",
          )}
        >
          <div className="space-y-8">
            <ul className="flex flex-wrap gap-3 text-sm">
              {trust.map((item, i) => (
                <li
                  key={item}
                  className={cn(
                    styles.introTrust,
                    "flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 text-muted-foreground",
                  )}
                  style={cssVars({ "--i": i })}
                >
                  <StarIcon
                    aria-hidden
                    className="size-4 fill-primary text-primary"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <h1 className="text-balance text-5xl font-black leading-[0.95] sm:text-6xl lg:text-7xl xl:text-8xl">
              <span className={cn(styles.introLine1, "block text-primary")}>
                <SplitWords text={headlinePart1} />
              </span>
              <span
                className={cn(
                  styles.introLine2,
                  "mt-2 block text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl",
                )}
              >
                <SplitWords text={headlinePart2} />
              </span>
            </h1>

            <p
              className={cn(
                styles.introLead,
                "max-w-xl text-pretty text-lg text-foreground/80",
              )}
            >
              {lead}
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <span
                className={cn(styles.introCta, "inline-flex")}
                style={cssVars({ "--i": 0 })}
              >
                <LinkButton
                  href="/contact"
                  size="lg"
                  className="h-14 w-full px-8 text-lg sm:w-auto"
                >
                  {ctaContact}
                  <ArrowRightIcon
                    aria-hidden
                    className="ms-2 size-5 rtl:-scale-x-100"
                  />
                </LinkButton>
              </span>
              <span
                className={cn(styles.introCta, "inline-flex")}
                style={cssVars({ "--i": 1 })}
              >
                <LinkButton
                  href="/work"
                  variant="outline"
                  size="lg"
                  className="h-14 w-full px-8 text-lg sm:w-auto"
                >
                  {ctaWork}
                </LinkButton>
              </span>
            </div>
          </div>

          {/* Product board: flies in from deep space, tilts toward the pointer */}
          <div
            aria-hidden
            className={cn(
              styles.tiltZone,
              "relative mx-auto w-full max-w-md perspective-[1200px] lg:max-w-none",
            )}
          >
            <div className={cn(styles.introBoard, "transform-3d")}>
              <div
                className={cn(
                  styles.tilt,
                  "relative rounded-3xl bg-primary/15 p-5 shadow-2xl transform-3d sm:p-8",
                )}
              >
                <div className="rounded-2xl border border-border bg-background p-5 shadow-lg sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div
                      className={cn(
                        styles.introSkel,
                        "h-4 w-1/2 rounded-full bg-primary/30",
                      )}
                      style={cssVars({ "--i": 0 })}
                    />
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <span className="size-2 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
                      {live}
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {SKELETON.map((width, i) => (
                      <div
                        key={width}
                        className={cn(
                          styles.introSkel,
                          "h-3 rounded-full bg-muted",
                          width,
                        )}
                        style={cssVars({ "--i": i + 1 })}
                      />
                    ))}
                  </div>
                  <div className="mt-6 flex h-36 items-end gap-2 sm:h-44">
                    {BARS.map((h, i) => (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: static decorative bars
                        key={i}
                        style={{ height: `${h}%`, ...cssVars({ "--i": i }) }}
                        className={cn(
                          styles.introBar,
                          "flex-1 rounded-t-md",
                          i === 5 ? "bg-primary" : "bg-primary/25",
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div
                  className={cn(
                    styles.introBadge,
                    "absolute -top-5 -end-5 rounded-full bg-primary p-3 text-primary-foreground shadow-lg",
                  )}
                  style={cssVars({ "--i": 0 })}
                >
                  <CheckCircleIcon className="size-7" />
                </div>
                <div
                  className={cn(
                    styles.introBadge,
                    "absolute -bottom-6 -start-4 rounded-2xl border border-border bg-background px-4 py-3 shadow-lg",
                  )}
                  style={cssVars({ "--i": 1 })}
                >
                  <div className="mb-2 h-4 w-20 rounded-full bg-primary" />
                  <div className="h-2 w-14 rounded-full bg-muted" />
                </div>
              </div>
            </div>

            {/* Nine invisible hover cells drive the tilt (desktop pointers only). */}
            <div className={styles.tiltCells}>
              {Array.from({ length: 9 }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed 3×3 grid
                <div key={i} className={styles.cell} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
