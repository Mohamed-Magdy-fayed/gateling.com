CREATE TYPE "public"."chat_conversation_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."chat_message_delivery_status" AS ENUM('pending', 'sent', 'failed', 'received');--> statement-breakpoint
CREATE TYPE "public"."chat_message_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TABLE "chat_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(8) NOT NULL,
	"visitorToken" varchar(64) NOT NULL,
	"visitorName" varchar(255) NOT NULL,
	"status" "chat_conversation_status" DEFAULT 'open' NOT NULL,
	"lastMessageAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversationId" uuid NOT NULL,
	"direction" "chat_message_direction" NOT NULL,
	"text" text NOT NULL,
	"deliveryStatus" "chat_message_delivery_status" DEFAULT 'pending' NOT NULL,
	"wapilotMessageId" varchar(128),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_chat_conversations_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "chat_conversations_code_idx" ON "chat_conversations" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_conversations_visitor_token_idx" ON "chat_conversations" USING btree ("visitorToken");--> statement-breakpoint
CREATE INDEX "chat_conversations_last_message_at_idx" ON "chat_conversations" USING btree ("lastMessageAt");--> statement-breakpoint
CREATE INDEX "chat_messages_conversation_id_idx" ON "chat_messages" USING btree ("conversationId");--> statement-breakpoint
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages" USING btree ("createdAt");