import { db } from "@/drizzle";
import { WebhookEventsTable } from "@/drizzle/schema";
import { env } from "@/env/server";
import {
  createMetaWebhookHandler,
  handleMetaVerification,
} from "@/integrations/meta/webhook";

/**
 * Meta webhooks (WhatsApp Cloud API; Messenger/Instagram later).
 *
 * Capture only: every signed delivery is stored verbatim in `webhook_events`
 * and acknowledged. Processing (normalise → match lead → thread) is a later
 * step that replays unprocessed rows, so nothing received now is lost.
 * Unsigned or wrongly signed requests never reach the database.
 */
export function GET(request: Request): Response {
  return handleMetaVerification(
    new URL(request.url),
    env.META_WEBHOOK_VERIFY_TOKEN,
  );
}

export const POST = createMetaWebhookHandler({
  appSecret: env.META_APP_SECRET,
  onDelivery: async ({ object, payload, payloadHash }) => {
    await db
      .insert(WebhookEventsTable)
      .values({ source: "meta", object, payload, payloadHash })
      .onConflictDoNothing({ target: WebhookEventsTable.payloadHash });
  },
});
