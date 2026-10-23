import "server-only";

import { TRPCError } from "@trpc/server";

import type { getT } from "@/features/core/i18n/server";

import type { BotGuardAction, BotGuardFields } from "../lib/rules";
import { BOT_GUARD_MESSAGE_KEYS, checkHumanSubmission } from "./guard";

type Translate = Awaited<ReturnType<typeof getT>>["t"];

/**
 * tRPC wrapper for `checkHumanSubmission`: throws a translated error the
 * public forms show as-is, and returns the client IP for callers that log it.
 */
export async function requireHumanSubmission(
  action: BotGuardAction,
  fields: BotGuardFields,
  t: Translate,
): Promise<{ ip: string }> {
  const result = await checkHumanSubmission(action, fields);
  if (result.ok) return { ip: result.ip };

  throw new TRPCError({
    code: result.reason === "rate_limited" ? "TOO_MANY_REQUESTS" : "FORBIDDEN",
    message: t(BOT_GUARD_MESSAGE_KEYS[result.reason]),
  });
}
