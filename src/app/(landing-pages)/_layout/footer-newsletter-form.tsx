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
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

export function FooterNewsletterForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const trpc = useTRPC();

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
      onError: () => {
        toast.error(t("publicPages.newsletter.error"));
      },
    }),
  );

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    const result = z.string().email().safeParse(email);
    if (!result.success) {
      toast.error(t("publicPages.newsletter.invalidEmail"));
      return;
    }
    mutation.mutate({ email });
  }

  return (
    <form onSubmit={handleSubscribe} className="mt-3">
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
    </form>
  );
}
