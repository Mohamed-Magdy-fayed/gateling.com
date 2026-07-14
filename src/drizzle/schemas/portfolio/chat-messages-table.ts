import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { id } from "@/drizzle/schemas/helpers";

import { ChatConversationsTable } from "./chat-conversations-table";

export const chatMessageDirectionValues = ["inbound", "outbound"] as const;
export type ChatMessageDirection = (typeof chatMessageDirectionValues)[number];
export const chatMessageDirectionEnum = pgEnum(
  "chat_message_direction",
  chatMessageDirectionValues,
);

export const chatMessageDeliveryStatusValues = [
  "pending",
  "sent",
  "failed",
  "received",
] as const;
export type ChatMessageDeliveryStatus =
  (typeof chatMessageDeliveryStatusValues)[number];
export const chatMessageDeliveryStatusEnum = pgEnum(
  "chat_message_delivery_status",
  chatMessageDeliveryStatusValues,
);

export const ChatMessagesTable = pgTable(
  "chat_messages",
  {
    id,
    conversationId: uuid()
      .notNull()
      .references(() => ChatConversationsTable.id, { onDelete: "cascade" }),
    direction: chatMessageDirectionEnum().notNull(),
    text: text().notNull(),
    deliveryStatus: chatMessageDeliveryStatusEnum().notNull().default("pending"),
    wapilotMessageId: varchar({ length: 128 }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("chat_messages_conversation_id_idx").on(table.conversationId),
    index("chat_messages_created_at_idx").on(table.createdAt),
  ],
);

export type ChatMessage = typeof ChatMessagesTable.$inferSelect;
export type NewChatMessage = typeof ChatMessagesTable.$inferInsert;
