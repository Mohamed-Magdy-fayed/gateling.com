"use client";

import { useMutation } from "@tanstack/react-query";
import {
  AlertCircleIcon,
  CopyIcon,
  Loader2Icon,
  MessageCircleIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/features/core/i18n/client";
import { mainTranslations } from "@/features/core/i18n/global";
import { createI18n } from "@/features/core/i18n/lib";
import { useTRPC } from "@/integrations/trpc/client";
import type { CaseStudyRow } from "@/integrations/trpc/routers/case-studies";
import { generateWhatsAppUrl } from "@/lib/phone";

type MessageLocale = "ar" | "en";

type Props = {
  caseStudy: CaseStudyRow | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

function buildMessage(
  msgLocale: MessageLocale,
  clientName: string,
  link: string,
): string {
  const { t } = createI18n(mainTranslations, msgLocale, "en");
  return t("work.feedbackRequest.messageTemplate", { name: clientName, link });
}

export function CaseStudyFeedbackRequestDialog({
  caseStudy,
  onOpenChange,
  open,
}: Props) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();

  const linkMut = useMutation(
    trpc.caseStudies.createFeedbackAccessLink.mutationOptions(),
  );
  const { mutate, reset, data, isPending, isError } = linkMut;

  const [phone, setPhone] = useState("");
  const [msgLocale, setMsgLocale] = useState<MessageLocale>(
    locale === "ar" ? "ar" : "en",
  );
  const [message, setMessage] = useState("");

  const caseStudyId = caseStudy?.id;

  // Mint a fresh link whenever the dialog opens; clear state on close.
  useEffect(() => {
    if (open && caseStudyId) {
      mutate({ caseStudyId });
    }
    if (!open) {
      reset();
      setPhone("");
      setMessage("");
    }
  }, [open, caseStudyId, mutate, reset]);

  const linked = data && data.hasClientUser ? data : null;

  const link = useMemo(() => {
    if (!linked) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/api/feedback-access?token=${linked.token}`;
  }, [linked]);

  // Prefill phone from the linked client account when a new link arrives.
  useEffect(() => {
    if (linked) setPhone(linked.phone ?? "");
  }, [linked]);

  // (Re)build the composed message on link arrival or language switch. Manual
  // edits persist until one of those changes.
  useEffect(() => {
    if (linked) setMessage(buildMessage(msgLocale, linked.name ?? "", link));
  }, [linked, msgLocale, link]);

  const digits = phone.replace(/\D/g, "");
  const msgDir = msgLocale === "ar" ? "rtl" : "ltr";

  function regenerate() {
    if (caseStudyId) mutate({ caseStudyId });
  }

  function handleOpenWhatsApp() {
    if (!digits) {
      toast.error(t("work.feedbackRequest.phoneRequired"));
      return;
    }
    window.open(
      generateWhatsAppUrl(digits, message),
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("work.feedbackRequest.copied"));
    } catch {
      toast.error(t("work.feedbackRequest.copyFailed"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("work.feedbackRequest.title")}</DialogTitle>
          <DialogDescription>
            {t("work.feedbackRequest.description", {
              client: caseStudy?.client ?? "",
            })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1 px-4 py-4">
          {isPending && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
              <Loader2Icon className="size-4 animate-spin" />
              {t("work.feedbackRequest.generating")}
            </div>
          )}

          {!isPending && isError && (
            <Alert className="bg-destructive/10 text-destructive border-destructive">
              <AlertCircleIcon className="size-4" />
              <AlertDescription className="text-current/90">
                {t("work.feedbackRequest.generateFailed")}
              </AlertDescription>
            </Alert>
          )}

          {!isPending && data && !data.hasClientUser && (
            <Alert className="bg-amber-500/10 text-amber-600 border-amber-500">
              <AlertCircleIcon className="size-4" />
              <AlertTitle>{t("work.feedbackRequest.noClientTitle")}</AlertTitle>
              <AlertDescription className="text-current/90">
                {t("work.feedbackRequest.noClientHint")}
              </AlertDescription>
            </Alert>
          )}

          {!isPending && linked && (
            <div className="space-y-4">
              <div className="bg-muted/50 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md px-3 py-2 text-sm">
                <span className="text-muted-foreground">
                  {t("work.feedbackRequest.accountLabel")}:
                </span>
                <span className="font-medium">{linked.email ?? "—"}</span>
              </div>

              <div className="space-y-1.5">
                <Label>{t("work.feedbackRequest.languageLabel")}</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={msgLocale === "en" ? "default" : "outline"}
                    onClick={() => setMsgLocale("en")}
                  >
                    English
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={msgLocale === "ar" ? "default" : "outline"}
                    onClick={() => setMsgLocale("ar")}
                  >
                    العربية
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="feedback-phone">
                  {t("work.feedbackRequest.phoneLabel")}
                </Label>
                <Input
                  id="feedback-phone"
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  placeholder={t("work.feedbackRequest.phonePlaceholder")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">
                  {t("work.feedbackRequest.phoneHint")}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="feedback-message">
                    {t("work.feedbackRequest.messageLabel")}
                  </Label>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    disabled={isPending}
                    onClick={regenerate}
                  >
                    <RefreshCwIcon />
                    {t("work.feedbackRequest.regenerate")}
                  </Button>
                </div>
                <Textarea
                  id="feedback-message"
                  dir={msgDir}
                  rows={9}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={!linked}
            onClick={() => copyText(message)}
          >
            <CopyIcon />
            {t("work.feedbackRequest.copyMessage")}
          </Button>
          <Button type="button" disabled={!linked} onClick={handleOpenWhatsApp}>
            <MessageCircleIcon />
            {t("work.feedbackRequest.openWhatsApp")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
