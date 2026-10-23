"use client";

import { useMutation } from "@tanstack/react-query";
import { MailIcon, SendIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  isBotGuardRejection,
  useBotGuard,
} from "@/features/core/bot-guard/client/use-bot-guard";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

export function FooterNewsletterForm() {
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

  function handleSubscribe(e: React.FormEvent) {
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
    <form onSubmit={handleSubscribe} className="relative mt-3 space-y-2">
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <MailIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="email"
          placeholder={t("publicPages.newsletter.placeholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={mutation.isPending}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="submit"
            variant="ghost"
            disabled={mutation.isPending}
          >
            <SendIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {botGuard.widget}
    </form>
  );
}
