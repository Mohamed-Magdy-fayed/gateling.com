"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactTabs } from "./contact-tabs";

type Props = {
  isSignedIn: boolean;
  initialTab: "message" | "book";
  rescheduleId: string | null;
  formTitle: string;
  formDescription: string;
};

export function ContactFormCard({
  isSignedIn,
  initialTab,
  rescheduleId,
  formTitle,
  formDescription,
}: Props) {
  const [tab, setTab] = useState<"message" | "book">(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">{formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <ContactTabs
          isSignedIn={isSignedIn}
          tab={tab}
          onTabChange={setTab}
          rescheduleId={rescheduleId}
        />
      </CardContent>
    </Card>
  );
}
