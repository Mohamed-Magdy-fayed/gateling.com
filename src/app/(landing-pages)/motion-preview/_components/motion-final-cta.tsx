import { ArrowRightIcon } from "lucide-react";

import { LinkButton } from "@/components/general/link-button";
import { cn } from "@/lib/utils";
import styles from "./motion.module.css";
import { cssVars } from "./motion-style";
import { SplitWords } from "./split-words";

type Props = {
  title: string;
  description: string;
  primary: string;
  secondary: string;
  perks: string[];
};

/**
 * Once it scrolls in: the orange circle floods the screen, the title words pop
 * in, then the description, perks and buttons. Plays in full, once.
 */
export function MotionFinalCta({
  title,
  description,
  primary,
  secondary,
  perks,
}: Props) {
  return (
    <section
      aria-labelledby="motion-cta-heading"
      className={cn(styles.ctaTg, "overflow-clip")}
    >
      <div
        className={cn(
          styles.blast,
          "flex min-h-svh items-center bg-primary text-primary-foreground",
        )}
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-24 text-center md:px-8">
          <h2
            id="motion-cta-heading"
            className="text-balance text-4xl font-black leading-[1.05] sm:text-6xl lg:text-7xl"
          >
            <SplitWords text={title} className={styles.wordPop} />
          </h2>
          <p
            className={cn(
              styles.ctaDesc,
              "mx-auto mt-8 max-w-2xl text-pretty text-lg text-primary-foreground/85 md:text-xl",
            )}
          >
            {description}
          </p>
          <ul className="mt-8 flex flex-wrap justify-center gap-3">
            {perks.map((perk, i) => (
              <li
                key={perk}
                className={cn(
                  styles.perkPop,
                  "rounded-full border border-primary-foreground/40 px-4 py-2 text-sm font-semibold",
                )}
                style={cssVars({ "--i": i })}
              >
                {perk}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <span
              className={cn(styles.btnIn, "inline-flex justify-center")}
              style={cssVars({ "--i": 0 })}
            >
              <LinkButton
                href="/contact"
                variant="outline"
                size="lg"
                className="h-14 w-full border-transparent bg-background px-8 text-lg text-primary hover:bg-background/90 hover:text-primary sm:w-auto"
              >
                {primary}
                <ArrowRightIcon
                  aria-hidden
                  className="ms-2 size-5 rtl:-scale-x-100"
                />
              </LinkButton>
            </span>
            <span
              className={cn(styles.btnIn, "inline-flex justify-center")}
              style={cssVars({ "--i": 1 })}
            >
              <LinkButton
                href="/work"
                variant="outline"
                size="lg"
                className="h-14 w-full border-primary-foreground/50 bg-transparent px-8 text-lg text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
              >
                {secondary}
              </LinkButton>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
