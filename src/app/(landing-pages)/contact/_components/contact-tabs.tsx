"use client";

import { Suspense } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/features/core/i18n/client";

import { BookingWidget } from "./booking-widget";
import { ContactForm } from "./contact-form";

type Props = {
  isSignedIn: boolean;
  tab: "message" | "book";
  onTabChange: (tab: "message" | "book") => void;
  rescheduleId: string | null;
};

export function ContactTabs({ isSignedIn, tab, onTabChange, rescheduleId }: Props) {
  const { t } = useTranslation();

  return (
    <Tabs value={tab} onValueChange={(value) => onTabChange(value as typeof tab)}>
      <TabsList variant="line">
        <TabsTrigger value="book">
          {t("publicPages.contactPage.tabBookCall")}
        </TabsTrigger>
        <TabsTrigger value="message">
          {t("publicPages.contactPage.tabMessage")}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="book" className="mt-6">
        <BookingWidget isSignedIn={isSignedIn} rescheduleId={rescheduleId} />
      </TabsContent>
      <TabsContent value="message" className="mt-6">
        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
