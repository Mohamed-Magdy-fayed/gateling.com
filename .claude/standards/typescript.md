# Standard: TypeScript

## Types

1. **No `any`** — explicit or implicit. Use `unknown` + narrowing at boundaries; `// @ts-expect-error` with a reason over `// @ts-ignore`; never a bare cast to silence a real error.
2. **Infer, don't restate.** Types flow from Zod schemas (`z.infer`), Drizzle tables (`$inferSelect`), and function returns. Hand-written interfaces duplicating a schema are drift waiting to happen.
3. **Model states, not flags.** Discriminated unions over boolean soups: `{ status: 'loading' } | { status: 'error'; error: E } | { status: 'ready'; data: T }`.
4. `strict: true` always; treat compiler errors as design feedback, not obstacles.

## Functions & modules

- Return early; keep happy path at minimum indentation.
- Prefer pure functions for logic — IO at the edges makes testing cheap.
- Narrow parameter types: take what you use (`Pick<User, 'id' | 'role'>`), not the whole entity.
- `readonly`/`as const` for data that shouldn't mutate; avoid mutating inputs.

## Async & errors

- No floating promises: `await`, return, or explicitly `void` with a reason.
- Expected failures are values (typed results / framework error types); `throw` is for the unexpected. Never `catch` just to log-and-rethrow at every layer — handle once at the boundary that can act.
- `Promise.all` for independent awaits; sequential awaits only for real dependencies.

## Naming & style

- Names say intent, not type: `activeMembers`, not `userArray2`.
- Follow the project's existing formatter/linter config without argument.
- Comments explain constraints the code can't (*why*), never narrate the line below.
