/**
 * Row caps shared by server-side list/export code. A plain module (no
 * React) so server code imports it by path, never through the client
 * `index.ts` barrel.
 */
export const EXPORT_ROW_LIMIT = 50_000;
