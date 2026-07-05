# Standard: APIs (tRPC / Route Handlers)

## Contract design

1. Procedures named by intent: `orders.cancel`, not `orders.update({ status })`. One procedure, one business action.
2. Input **and** output schemas explicit (Zod). Output schemas prevent accidental over-fetch leaking fields to the client.
3. Return domain results, not ORM rows: select the fields the client needs; never spread a table row containing sensitive columns.
4. Pagination on every list endpoint from day one (cursor-based by default). Unbounded lists are a production incident on a timer.

## Security in every procedure

- Auth middleware determines *who*; the procedure body still verifies *whether* — ownership/role check against the resource, server-side, every time. Client-supplied IDs are claims, not facts.
- Mutations are idempotent where retries are possible (jobs, webhooks) — idempotency keys or upserts.
- Rate limiting on auth endpoints, expensive queries, and anything sending email.

## API evolution

- Additive changes are free; breaking changes (rename, type change, removal, semantic change) require: deprecation note, both shapes supported through a transition, consumers migrated, then removal. For external consumers, this is an RFC-level decision.
- Never repurpose an existing field's meaning — add a new field.

## Errors

- Typed error codes (`TRPCError` codes / proper HTTP status), stable and documented in the procedure. Messages safe for users; details (stack, query) only in server logs.
- Validation failures return field-level errors the form layer can render.

## Background work

- Anything not needed for the response (emails, sync, heavy processing) goes to the job queue (Inngest). The procedure enqueues and returns; the job is idempotent and retried by the platform.
- Webhook handlers: verify signature, enqueue, return 200 fast. Processing happens in the job.
