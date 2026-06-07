import { Container, HeroContainer, PageHeading } from "@/components/ui/containers";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <HeroContainer>
      <Container size="narrow" className="prose dark:prose-invert">
        <PageHeading>Terms of Service</PageHeading>
        <p>Last updated: 2025</p>
        <p>
          By using the Gateling Solutions website (gateling.com), you agree to
          these terms. The website and all content are provided for
          informational purposes. Gateling Solutions reserves the right to
          update these terms at any time.
        </p>
        <p>
          Contact us at info@gateling.com for any questions about these terms.
        </p>
      </Container>
    </HeroContainer>
  );
}
