import { cn } from "@/lib/utils";
import styles from "./motion.module.css";
import { cssVars } from "./motion-style";

type Stat = { value: string; label: string };

type Props = {
  heading: string;
  description: string;
  benefits: string[];
  stats: Stat[];
};

/** Site rule: numbers are always written with 0-9, in Arabic too. */
function toLatinDigits(value: string) {
  return value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/** Splits "+10", "100%", "24/7" into prefix / number / suffix. */
function parseStat(value: string) {
  const match = value.match(/^(\D*?)([0-9]+)(.*)$/);
  if (!match) return null;
  const [, prefix, digits, suffix] = match;
  return { prefix, suffix, target: Number(digits) };
}

function StatValue({ value: raw }: { value: string }) {
  const value = toLatinDigits(raw);
  const parsed = parseStat(value);
  if (!parsed) return <>{value}</>;
  return (
    <>
      <span className="sr-only">{value}</span>
      <span aria-hidden>
        {parsed.prefix}
        <span
          className={styles.count}
          style={cssVars({ "--to": parsed.target })}
        />
        {parsed.suffix}
      </span>
    </>
  );
}

/**
 * The headline is uncovered whole by a sweeping bar, then the description and
 * the benefit pills land. Each plays in full once the section scrolls in.
 */
export function MotionStatement({
  heading,
  description,
  benefits,
  stats,
}: Props) {
  return (
    <>
      <section
        aria-labelledby="motion-statement-heading"
        className={cn(
          styles.tg,
          "flex min-h-svh items-center overflow-clip bg-foreground py-24 text-background",
        )}
      >
        <div className="mx-auto w-full max-w-6xl px-4 md:px-8 lg:px-16">
          <h2
            id="motion-statement-heading"
            className={cn(
              styles.wipe,
              "text-balance text-5xl font-black leading-[1.02] sm:text-7xl lg:text-8xl",
            )}
          >
            <span className={styles.wipeText}>{heading}</span>
          </h2>
          <p
            className={cn(
              styles.afterWipe,
              "mt-8 max-w-2xl text-pretty text-lg text-background/70 md:text-xl",
            )}
          >
            {description}
          </p>
          <ul className="mt-10 flex flex-wrap gap-3">
            {benefits.map((b, i) => (
              <li
                key={b}
                className={cn(
                  styles.pillIn,
                  "rounded-full bg-primary px-5 py-2.5 text-base font-bold text-primary-foreground md:text-lg",
                )}
                style={cssVars({ "--i": i })}
              >
                {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="overflow-clip py-24 md:py-32">
        <div
          className={cn(
            styles.tg,
            "mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-16 px-4 md:px-8 lg:grid-cols-4 lg:px-16",
          )}
        >
          {stats.map(({ value, label }, i) => (
            <div
              key={label}
              className={cn(styles.stat, "text-center")}
              style={cssVars({ "--i": i, "--r": i % 2 ? 8 : -8 })}
            >
              <div className="text-6xl font-black text-primary sm:text-7xl lg:text-8xl">
                <StatValue value={value} />
              </div>
              <div className="mt-3 text-sm font-medium text-muted-foreground md:text-base">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
