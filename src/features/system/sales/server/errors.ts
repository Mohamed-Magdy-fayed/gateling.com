import { TRPCError } from "@trpc/server";

/**
 * Domain errors the sales service throws, each carrying the lead it concerns.
 * The service stays transport-free; the router maps these to tRPC codes so a
 * client (the admin UI or an agent) can tell "not found" from "not allowed"
 * without parsing a message.
 */
export type SalesErrorCode = "SALES_LEAD_NOT_PROSPECT" | "SALES_DO_NOT_CONTACT";

const TRPC_CODE: Record<SalesErrorCode, TRPCError["code"]> = {
  SALES_LEAD_NOT_PROSPECT: "NOT_FOUND",
  SALES_DO_NOT_CONTACT: "PRECONDITION_FAILED",
};

export class SalesError extends Error {
  readonly appCode: SalesErrorCode;
  readonly leadId: string;

  constructor(appCode: SalesErrorCode, leadId: string) {
    super(`${appCode}: lead ${leadId}`);
    this.name = "SalesError";
    this.appCode = appCode;
    this.leadId = leadId;
  }
}

/** Re-throws a `SalesError` as the matching `TRPCError`; anything else passes through. */
export function toTRPCError(error: unknown): unknown {
  if (!(error instanceof SalesError)) return error;
  return new TRPCError({
    code: TRPC_CODE[error.appCode],
    message: error.message,
    cause: { appCode: error.appCode, leadId: error.leadId },
  });
}
