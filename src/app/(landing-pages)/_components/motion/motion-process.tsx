import { cn } from "@/lib/utils";
import styles from "./motion.module.css";
import { cssVars } from "./motion-style";
import { SplitWords } from "./split-words";

type Step = {
  number: string;
  title: string;
  description: string;
  details: string[];
};

type Props = { eyebrow: string; heading: string; steps: Step[] };

/**
 * Desktop: when the row scrolls in, the line draws across and each step lands
 * in turn (giant number, then card). Mobile: each card swings in as it arrives.
 * Every reveal plays in full once triggered.
 */
export function MotionProcess({ eyebrow, heading, steps }: Props) {
  return (
    <section
      aria-labelledby="motion-process-heading"
      className="overflow-clip py-24 md:py-32"
    >
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8 lg:px-16">
        <div className={styles.tg}>
          <p
            className={cn(
              styles.riseEyebrow,
              "mb-3 text-sm font-bold uppercase text-primary",
            )}
          >
            {eyebrow}
          </p>
          <h2
            id="motion-process-heading"
            className={cn(
              styles.riseWords,
              "mb-16 max-w-4xl text-balance text-4xl font-black leading-[1.05] sm:text-6xl",
            )}
          >
            <SplitWords text={heading} />
          </h2>
        </div>

        <div className={cn(styles.processRow, "relative")}>
          <div
            aria-hidden
            className={cn(
              styles.lineGrow,
              "absolute inset-x-0 top-12 hidden h-1 rounded-full bg-primary lg:block",
            )}
          />
          <ol className="grid gap-10 lg:grid-cols-4 lg:gap-6">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className={cn(styles.stepCard, "relative perspective-[900px]")}
                style={cssVars({ "--i": i, "--dir": i % 2 ? 1 : -1 })}
              >
                <div
                  aria-hidden
                  className={cn(
                    styles.numDrop,
                    styles.outline,
                    "relative mb-6 inline-block bg-background pe-4 text-8xl font-black leading-none",
                  )}
                >
                  {step.number}
                </div>
                <div
                  className={cn(
                    styles.bodyIn,
                    "rounded-3xl border border-border bg-background p-6 shadow-lg",
                  )}
                >
                  <h3 className="mb-3 text-xl font-extrabold">{step.title}</h3>
                  <p className="mb-4 text-pretty text-sm text-muted-foreground">
                    {step.description}
                  </p>
                  <ul className="space-y-2">
                    {step.details.map((d) => (
                      <li
                        key={d}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
