import type { Metadata } from "next";

import { LinkButton } from "@/components/general/link-button";
import {
  Container,
  HeroContainer,
  PageHeading,
  ProseText,
  Section,
  SectionHeader,
} from "@/components/ui/containers";

import { RoiCalculator } from "./_components/roi-calculator";

export const metadata: Metadata = {
  title:
    "Business Automation ROI Calculator — How Much Is Manual Work Costing You?",
  description:
    "Calculate how much time and money your team loses to manual processes. See your potential savings with business automation. Free calculator.",
};

export default function RoiCalculatorPage() {
  return (
    <>
      <HeroContainer>
        <Container size="narrow">
          <div className="mb-10 text-center">
            <PageHeading className="mb-4">
              How Much Is Manual Work Costing Your Business?
            </PageHeading>
            <ProseText size="lg" className="mx-auto mt-4 max-w-xl">
              Enter your team details below to see the annual cost of keeping
              things manual — and what 70% automation could save you.
            </ProseText>
          </div>
          <RoiCalculator />
        </Container>
      </HeroContainer>

      <Section variant="cta">
        <Container size="narrow" className="text-center">
          <SectionHeader
            heading="See What Automation Could Do for You"
            subheading="Our team has helped businesses cut manual work by 70%+. Let's talk."
          />
          <LinkButton href="/contact" size="lg">
            Book a Free Discovery Call
          </LinkButton>
        </Container>
      </Section>
    </>
  );
}
