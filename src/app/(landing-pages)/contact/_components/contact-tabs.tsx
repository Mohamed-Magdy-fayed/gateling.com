"use client";

import { Suspense, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/features/core/i18n/client";

import { BookingWidget } from "./booking-widget";
import { ContactForm } from "./contact-form";

type Props = {
  isSignedIn: boolean;
  initialTab: "message" | "book";
  rescheduleId: string | null;
};

export function ContactTabs({ isSignedIn, initialTab, rescheduleId }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState(initialTab);

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
      <TabsList variant="line">
        <TabsTrigger value="message">
          {t("publicPages.contactPage.tabMessage")}
        </TabsTrigger>
        <TabsTrigger value="book">
          {t("publicPages.contactPage.tabBookCall")}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="message" className="mt-6">
        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </TabsContent>
      <TabsContent value="book" className="mt-6">
        <BookingWidget isSignedIn={isSignedIn} rescheduleId={rescheduleId} />
      </TabsContent>
    </Tabs>
  );
}
