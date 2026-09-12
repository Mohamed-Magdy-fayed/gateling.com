/**
 * Vitest stand-in for the `server-only` guard. The real package throws when
 * imported outside a React Server Component graph, which is exactly what a
 * unit test is; aliasing it lets `server-only` modules be tested as plain
 * functions without dropping the guard in production.
 */
export {};
