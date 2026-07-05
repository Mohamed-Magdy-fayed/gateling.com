# Standard: Architecture & Code Organization

## Principles

1. **Boring by default.** New patterns, layers, and abstractions need a justification the current code can't satisfy. The second implementation of a pattern may copy; the third extracts the abstraction — never the first.
2. **Boundaries follow the domain,** not technology. Modules group by feature/capability (`orders/`, `billing/`), with technical layering inside them, not `controllers/` + `services/` silos at the top.
3. **Dependencies point inward.** UI → application logic → domain → infrastructure adapters. Domain logic never imports framework or IO specifics.
4. **Delete code.** Dead code, unused flags, and commented-out blocks are removed, not preserved. Git remembers.

## Folder organization (Next.js App Router projects)

```
src/
  app/            # routes only — thin pages composing features
  features/<x>/   # feature modules: components, server logic, queries for x
  components/ui/  # shared design-system primitives (shadcn)
  components/     # shared composite components
  server/         # tRPC routers, auth, db client, jobs
  lib/            # pure utilities (no IO, no framework imports)
  i18n/           # locale files
```
Adapt names to the existing project — consistency with the codebase beats
consistency with this listing.

## Rules

- A file exports one primary thing; helpers used by one file stay in it.
- Cross-feature imports go through the feature's public surface (its index), not deep paths into another feature's internals.
- Shared state and config have one owner module; no duplicate constants drifting apart.
- Circular imports are a design error — fix the boundary, don't suppress the warning.
- Decisions changing module boundaries, data flow, or external contracts get an ADR (`templates/adr.md`).
