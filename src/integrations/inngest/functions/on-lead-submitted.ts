import { eq } from "drizzle-orm";

import { db } from "@/drizzle";
import { LeadsTable } from "@/drizzle/schema";
import { escapeHtml } from "@/features/system/bookings/lib/format";
import { sendMail } from "@/integrations/email";
import { inngest, leadSubmittedEvent } from "../client";

export const onLeadSubmitted = inngest.createFunction(
  { id: "on-lead-submitted", triggers: [leadSubmittedEvent] },
  async ({ event }) => {
    const lead = await db.query.LeadsTable.findFirst({
      where: eq(LeadsTable.id, event.data.leadId),
    });

    if (!lead) return { skipped: true };

    const name = escapeHtml(lead.name);
    const email = escapeHtml(lead.email);
    const company = lead.company ? escapeHtml(lead.company) : "—";
    const phone = lead.phone ? escapeHtml(lead.phone) : "—";
    const message = escapeHtml(lead.message);

    const attributionParts = [
      lead.source && `<strong>Source:</strong> ${escapeHtml(lead.source)}`,
      lead.utmSource &&
        `<strong>UTM Source:</strong> ${escapeHtml(lead.utmSource)}`,
      lead.utmMedium &&
        `<strong>UTM Medium:</strong> ${escapeHtml(lead.utmMedium)}`,
      lead.utmCampaign &&
        `<strong>UTM Campaign:</strong> ${escapeHtml(lead.utmCampaign)}`,
      lead.utmContent &&
        `<strong>UTM Content:</strong> ${escapeHtml(lead.utmContent)}`,
      lead.referrer &&
        `<strong>Referrer:</strong> ${escapeHtml(lead.referrer)}`,
    ].filter(Boolean);

    await sendMail({
      to: "info@gateling.com",
      subject: `New lead: ${name} (${company})`,
      html: `
        <h2>New Contact Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong></p>
        <blockquote>${message}</blockquote>
        ${attributionParts.length ? `<p>${attributionParts.join("<br/>")}</p>` : ""}
      `,
    });

    await sendMail({
      to: lead.email,
      subject: "We received your message — Gateling Solutions",
      html: `
        <h2>Thanks for reaching out, ${name}!</h2>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <p>— The Gateling Solutions Team</p>
      `,
    });

    return { notified: true };
  },
);
