import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { id } from "@/drizzle/schemas/helpers";

export const chatConversationStatusValues = ["open", "closed"] as const;
export type ChatConversationStatus =
  (typeof chatConversationStatusValues)[number];
export const chatConversationStatusEnum = pgEnum(
  "chat_conversation_status",
  chatConversationStatusValues,
);

export const ChatConversationsTable = pgTable(
  "chat_conversations",
  {
    id,
    code: varchar({ length: 8 }).notNull(),
    visitorToken: varchar({ length: 64 }).notNull(),
    visitorName: varchar({ length: 255 }).notNull(),
    status: chatConversationStatusEnum().notNull().default("open"),
    lastMessageAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("chat_conversations_code_idx").on(table.code),
    uniqueIndex("chat_conversations_visitor_token_idx").on(table.visitorToken),
    index("chat_conversations_last_message_at_idx").on(table.lastMessageAt),
  ],
);

export type ChatConversation = typeof ChatConversationsTable.$inferSelect;
export type NewChatConversation = typeof ChatConversationsTable.$inferInsert;
