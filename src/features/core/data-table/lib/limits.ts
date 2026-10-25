/**
 * Row caps shared by server-side list/export code. A plain module (no
 * React) so server code imports it by path, never through the client
 * `index.ts` barrel.
 */
export const EXPORT_ROW_LIMIT = 50_000;

/**
 * Sales pipeline export cap. Lead rows are wide (names in two scripts,
 * addresses, notes), so the cap is sized to keep one tRPC response well
 * under the serverless body limit rather than matching `EXPORT_ROW_LIMIT`.
 */
export const SALES_EXPORT_ROW_LIMIT = 5_000;

/** Most ids one bulk mutation accepts; bulk work runs in one transaction. */
export const BULK_ACTION_LIMIT = 100;
