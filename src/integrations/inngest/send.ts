import { inngest } from "./client";

type SendPayload = Parameters<typeof inngest.send>[0];

/**
 * Enqueue an event without failing the caller. The mutation already
 * succeeded; a lost event is a degraded-but-handled situation that must be
 * visible in the logs — a silent catch here hid a fully broken Inngest
 * connection for weeks.
 */
export async function sendEventSafely(
  payload: SendPayload,
  context: Record<string, unknown>,
): Promise<boolean> {
  try {
    await inngest.send(payload);
    return true;
  } catch (error) {
    console.warn("[inngest] event send failed", {
      ...context,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
