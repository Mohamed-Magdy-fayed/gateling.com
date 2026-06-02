# /new-entity

Scaffold a complete, production-ready admin entity for Gateling Solutions following the full entity blueprint.

## Canonical example

**Always read the `users` feature first** before generating any code for a new entity. It is the gold-standard implementation of every layer:

```
src/features/system/users/
  admin/
    components/
      user-form-dialog.tsx
      users-grid-filters.tsx
      user-info-dialog.tsx
      user-row-actions.tsx
      users-bulk-actions.tsx
      users-table-columns.tsx
    users-table-page.tsx
    index.ts
  server/
    schemas.ts
    queries.ts
    mutations.ts
    router.ts
    types.ts
  index.ts
```

Study its patterns, naming conventions, and wiring before proceeding.

---

## Phase 0 — Mandatory Intake

**Do not write a single line of code until all 13 questions are answered.**

If the user's request does not answer all of these, ask them in a single message and wait:

1. What business role does this entity play?
2. Is it global, branch-aware, or future-branch-aware?
3. Does it need CSV import?
4. Does it need CSV export?
5. Does the table need row selection?
6. Is this a definition/reference page or a transactional page? (determines client vs server table mode)
7. Which filters should appear? (at minimum: status if applicable, date range if transactional)
8. Which row actions are required? (e.g. activate, deactivate, archive, restore, duplicate)
9. Does it need bulk actions? If yes, which ones?
10. Should the info dialog be audit-only? (default: **yes**)
11. Does it need a public or landing-page presence?
12. Should it be demo-visible and seeded?
13. Any custom fields, relationships, or business rules to know about?

Once all answers are collected, confirm the full feature set back to the user in a summary before proceeding.

---

## Phase 1 — Database Schema

**File:** `src/drizzle/schemas/system/<entity>-table.ts`

Requirements:
- Include soft-delete fields: `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deletedAt`, `deletedBy`
- Define indexes and foreign keys
- Export through `src/drizzle/schema.ts`

After creating the file:

```bash
npm run db:generate
npm run db:migrate
```

---

## Phase 2 — Registry Entry

**File:** `src/features/system/registry/entities.ts`

Add a full `SystemEntityRegistryItem`. Every field is required:

```ts
{
  slug: "<entity>",
  route: "/<entity>",
  screenKey: "<ENTITY>_SCREEN",
  icon: <LucideIcon>,
  navLabelKey: "nav.<entity>",
  breadcrumbLabelKey: "breadcrumb.<entity>",
  titleKey: "<entity>.title",
  leadKey: "<entity>.lead",
  branchScope: "global" | "branch-aware" | "future-branch-aware",
  infoView: "audit-only",
  supportsImport: boolean,
  supportsExport: boolean,
  supportsRowSelection: boolean,
  supportsBulkActions: boolean,
  filters: ["status", ...],
  rowActions: ["edit", "delete", ...],
  bulkActions: [...],
  showInDashboard: boolean,
  seedProfiles: ["all"],
}
```

---

## Phase 3 — Server Modules

**Directory:** `src/features/system/<entity>/server/`

Create all of these:

| File | Purpose |
|---|---|
| `schemas.ts` | Zod input schemas — use `translationKey()` for all error messages, never literal English |
| `queries.ts` | list / detail / export query functions |
| `mutations.ts` | create / update / delete / toggle / bulk mutation functions |
| `router.ts` | tRPC procedures composing the above functions (`protectedProcedure` / `adminProcedure`) |
| `types.ts` | Row type and DTO types inferred from Drizzle + Zod |
| `import.ts` | Only if import was requested in intake |

Rules:
- No inline business logic in the router — compose from queries/mutations
- `schemas.ts` Zod error messages must be i18n keys (e.g. `"forms.validation.required"`) via `translationKey()` from `src/features/core/i18n/global`

---

## Phase 4 — tRPC Wiring

1. Create `src/integrations/trpc/routers/<entity>.ts` — import and re-export the entity router
2. Add it to `src/integrations/trpc/routers/root.ts`

---

## Phase 5 — Admin UI

**Directory:** `src/features/system/<entity>/admin/`

Always create:

```
admin/
  components/
    <entity>-form-dialog.tsx      ← overlay form (see form pattern below)
    <entity>s-grid-filters.tsx    ← business-relevant filters from intake
    <entity>-info-dialog.tsx      ← audit-only by default
    <entity>-row-actions.tsx      ← only actions confirmed in intake
    <entity>s-table-columns.tsx   ← table column definitions
  <entity>s-table-page.tsx
  index.ts
```

Conditionally create:
- `components/<entity>s-bulk-actions.tsx` — only if row selection + bulk actions requested
- `components/<entity>s-import-button.tsx` — only if import requested
- `components/<entity>s-export-button.tsx` — only if export requested

### Table mode rule
- Definition/reference entities (services, branches, categories) → **client mode** data table
- Transactional entities (orders, bookings, leads, payments) → **server mode** data table

### Form dialog pattern (overlay forms)
Every `*-form-dialog.tsx` must follow this layout:
1. `DialogContent` with `className="gap-0 overflow-hidden p-0"` + width class
2. `DialogHeader` — title + description, `shrink-0`
3. `ScrollArea` wrapping `OverlayFormBody` — fields stay here (scrollable)
4. `DialogFooter` with cancel button + `OverlayFormSubmitButton` (fixed, outside scroll)

Use `useId()` for `formId`, wire `OverlayFormBody` + `OverlayFormSubmitButton` with the same `formId`.

Source primitives: `src/components/forms/overlay-form.tsx`  
Reference: `src/features/system/users/admin/components/user-form-dialog.tsx`

### Action bar rule
If row selection is enabled, the action bar **must** contain real bulk actions — never an empty bar. If there are no meaningful bulk actions, remove row selection instead.

---

## Phase 6 — Route

**File:** `src/app/(system-pages)/<entity>/page.tsx`

Thin route only — no business logic:

```tsx
import { HydrateClient, prefetch, trpc } from "@/integrations/trpc/server";
import { EntityTablePage } from "@/features/system/<entity>/admin";

export default async function EntityPage() {
  await prefetch(trpc.<entity>.list.queryOptions(defaultInput));
  return (
    <HydrateClient>
      <EntityTablePage />
    </HydrateClient>
  );
}
```

---

## Phase 7 — i18n (bilingual)

Add keys to **both** files in the same change — never one without the other:

- `src/features/core/i18n/global/en.ts`
- `src/features/core/i18n/global/ar.ts`

Required key groups:
- `nav.<entity>` — sidebar nav label
- `breadcrumb.<entity>` — breadcrumb label
- `<entity>.title` + `<entity>.lead` — page header
- `<entity>.columns.*` — table column headers
- `<entity>.form.*` — form field labels, placeholders, descriptions
- `<entity>.actions.*` — row action labels

Arabic copy must be proper Arabic, not transliterated. Use RTL-safe layout classes (`ms-`, `me-`, `ps-`, `pe-`) not directional (`ml-`, `mr-`).

---

## Phase 8 — Seed (if demo-visible)

If intake confirmed demo-visible, add a seed function in `src/drizzle/seed/`. Use realistic Egypt/MENA-relevant fake data (Egyptian names, Cairo addresses, EGP amounts where applicable). Register the function in `src/drizzle/seed/cli.ts`.

---

## Phase 9 — Verify

```bash
npm run typecheck && npm run build
```

Both must pass with zero errors before declaring the entity complete.

---

## Definition of Done

The entity is **not complete** until every item is checked:

- [ ] Feature set explicitly confirmed with user (intake Phase 0)
- [ ] Database table exists with all audit fields
- [ ] Migrations generated and applied (`db:generate` + `db:migrate`)
- [ ] Entity registered in `src/features/system/registry/entities.ts`
- [ ] Admin route exists at `src/app/(system-pages)/<entity>/`
- [ ] Permissions work via `screenKey`
- [ ] Nav and breadcrumb labels resolve in both EN and AR
- [ ] Audit info dialog follows the agreed mode
- [ ] Meaningful entity filters are present (not just global search)
- [ ] Table mode matches entity type (client for definition, server for transactional) with justification if overridden
- [ ] Row actions match exactly the agreed action set from intake
- [ ] Row selection includes the action bar when selection is enabled
- [ ] Import/export implemented if requested in intake
- [ ] Full bilingual copy in both `en.ts` and `ar.ts`
- [ ] Seed story defined if demo-visible
- [ ] Form dialogs use the overlay form pattern (scrollable body, fixed footer)
- [ ] `npm run typecheck && npm run build` passes clean

---

## Quick reference: key files

| What | Where |
|---|---|
| Registry (source of truth) | `src/features/system/registry/entities.ts` |
| tRPC root router | `src/integrations/trpc/routers/root.ts` |
| Drizzle schema barrel | `src/drizzle/schema.ts` |
| Shared form hook | `src/components/forms/hooks.tsx` |
| Overlay form primitives | `src/components/forms/overlay-form.tsx` |
| i18n global EN | `src/features/core/i18n/global/en.ts` |
| i18n global AR | `src/features/core/i18n/global/ar.ts` |
| Seed CLI | `src/drizzle/seed/cli.ts` |
| Full pattern reference | `docs/entity-blueprint.md` |
