import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  CardHeading,
  Container,
  ContentCard,
  ProseText,
  Section,
  SectionHeader,
} from "@/components/ui/containers";

/**
 * A single internal destination surfaced from another page — a case study, a
 * blog post, a solution pillar, or a sibling service.
 *
 * `href` is always site-relative: this component exists to build the internal
 * link graph, so it deliberately has no affordance for external URLs.
 */
export type RelatedContentItem = {
  href: string;
  title: string;
  description: string;
  /** Small contextual label above the title (industry, tag, category). */
  eyebrow?: string;
};

type SectionVariant = "feature" | "alternate";

/**
 * Renders a grid of internal links as a full page section.
 *
 * Shared by `/services/[slug]` and the `/solutions` pillar pages so a related
 * block looks and links the same everywhere. Each card is one anchor wrapping
 * its whole surface — a single descriptive link per destination rather than a
 * card of inert text plus a "read more" stub, which is what crawlers actually
 * follow and what screen-reader users hear.
 *
 * Renders nothing when `items` is empty, so callers can pass a list that was
 * filtered down by unresolved slugs without guarding at every call site.
 */
export function RelatedContentSection({
  eyebrow,
  heading,
  subheading,
  items,
  linkLabel,
  variant = "alternate",
  columns = 2,
}: {
  eyebrow?: string;
  heading: string;
  subheading?: string;
  items: RelatedContentItem[];
  /** Visible affordance inside each card, e.g. "Read the article". */
  linkLabel: string;
  variant?: SectionVariant;
  columns?: 2 | 3;
}) {
  if (items.length === 0) return null;

  return (
    <Section variant={variant}>
      <Container>
        <SectionHeader
          eyebrow={eyebrow}
          heading={heading}
          subheading={subheading}
        />
        <div
          className={
            columns === 3
              ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              : "grid gap-6 md:grid-cols-2"
          }
        >
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="group block">
              <ContentCard className="flex h-full flex-col">
                {item.eyebrow && (
                  <Badge variant="secondary" className="mb-3 self-start">
                    {item.eyebrow}
                  </Badge>
                )}
                <CardHeading className="group-hover:text-primary transition-colors">
                  {item.title}
                </CardHeading>
                <ProseText size="sm" className="mt-3 flex-1">
                  {item.description}
                </ProseText>
                <span className="text-primary mt-5 inline-flex items-center gap-1.5 text-sm font-medium">
                  {linkLabel}
                  <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                </span>
              </ContentCard>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
