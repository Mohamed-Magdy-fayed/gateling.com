"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/ui/containers";
import { Input } from "@/components/ui/input";
import {
  isBotGuardRejection,
  useBotGuard,
} from "@/features/core/bot-guard/client/use-bot-guard";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { trackGaEvent } from "@/lib/ga4";
import { trackPixelEvent } from "@/lib/meta-pixel";

export function NewsletterSection() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const trpc = useTRPC();
  const botGuard = useBotGuard("newsletter");

  const mutation = useMutation(
    trpc.subscribers.subscribe.mutationOptions({
      onSuccess: (data) => {
        if (data.alreadyActive) {
          toast.info(t("publicPages.newsletter.alreadySubscribed"));
        } else {
          toast.success(t("publicPages.newsletter.success"));
          trackPixelEvent("CompleteRegistration", {
            content_name: "Newsletter",
          });
          trackGaEvent("sign_up", { method: "newsletter" });
        }
        setEmail("");
      },
      onError: (err) => {
        toast.error(
          isBotGuardRejection(err)
            ? err.message
            : t("publicPages.newsletter.error"),
        );
      },
      onSettled: () => botGuard.reset(),
    }),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = z.string().email().safeParse(email);
    if (!result.success) {
      toast.error(t("publicPages.newsletter.invalidEmail"));
      return;
    }
    const guardFields = botGuard.getFields();
    if (!guardFields) {
      toast.error(t("common.botGuard.verificationPending"));
      return;
    }
    mutation.mutate({ email, ...guardFields });
  }

  return (
    <Section variant="feature">
      <Container size="narrow" className="text-center">
        <SectionHeader
          heading={t("publicPages.newsletter.heading")}
          subheading={t("publicPages.newsletter.description")}
          className="mb-6"
        />
        <form
          onSubmit={handleSubmit}
          className="relative flex flex-col gap-3 sm:flex-row sm:flex-wrap"
        >
          <Input
            type="email"
            placeholder={t("publicPages.newsletter.placeholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            required
          />
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="sm:w-auto"
          >
            {mutation.isPending
              ? t("publicPages.newsletter.subscribing")
              : t("publicPages.newsletter.subscribe")}
          </Button>
          {botGuard.widget}
        </form>
        <p className="text-muted-foreground mt-3 text-xs">
          {t("publicPages.newsletter.noSpam")}
        </p>
      </Container>
    </Section>
  );
}
