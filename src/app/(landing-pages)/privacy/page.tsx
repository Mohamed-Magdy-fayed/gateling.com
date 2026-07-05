import { Container, HeroContainer, PageHeading } from "@/components/ui/containers";
import { canonicalUrl } from "@/lib/json-ld";

export const metadata = {
  title: "Privacy Policy",
  alternates: { canonical: canonicalUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <HeroContainer>
      <Container size="narrow" className="prose dark:prose-invert">
        <PageHeading>Privacy Policy</PageHeading>
        <p>Last updated: 2025</p>
        <p>
          Gateling Solutions respects your privacy. We collect only the
          information you provide through our contact form (name, email,
          company, message) and newsletter subscription (email). This data is
          used solely to respond to your inquiry and, if subscribed, to send
          relevant content.
        </p>
        <p>
          We do not sell, share, or disclose your data to third parties except
          as required by law. You can request deletion of your data at any time
          by emailing info@gateling.com.
        </p>
      </Container>
    </HeroContainer>
  );
}
