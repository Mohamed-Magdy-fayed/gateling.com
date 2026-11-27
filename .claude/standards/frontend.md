# Standard: Frontend (React / Next.js / Accessibility / UI Performance)

## Component model

1. **Server components first.** `"use client"` only when hooks/interactivity demand it, and as low in the tree as possible.
2. Data fetching on the server (RSC or route loaders); client fetch only for genuinely dynamic post-load data.
3. State lives at the lowest level that needs it. URL is state too — filters, tabs, and pagination belong in searchParams, not useState.
4. Derive, don't sync: no `useEffect` mirroring props into state; compute during render.
5. Hooks, keys, the RSC boundary and React security follow `~/.claude/rules/ecc/react/` (`hooks.md`, `patterns.md`, `security.md`). In short: stable non-index keys for lists that change, cleanup in every effect, no `dangerouslySetInnerHTML` without sanitizing, validate URL schemes on user-supplied `href`, and `rel="noopener noreferrer"` on `target="_blank"`.

## Design system

- Use the component system (shadcn/ui + project components) — never raw-div reimplementations of `Card`, `Alert`, `Badge`, `Dialog`.
- Semantic color tokens only (`primary`, `destructive`, `muted`, project-defined `warning`/success) — no hardcoded palette classes.
- `className` additions minimal: layout/spacing only, not restyling the component.
- **Theme-flipping tokens never sit on a fixed surface.** A section that keeps one colour in both themes (`bg-primary`, a brand colour, an image or gradient) takes only its paired tokens for children (`text-primary-foreground`, or `bg-primary-foreground text-primary` for an inverted button). `bg-background`, `bg-card`, `text-foreground` and `text-muted-foreground` flip with the theme, so they pass in one mode and fail contrast in the other. (Found live 2026-11-27: the homepage final CTA's main button was orange-on-dark-brown in dark mode.)

## i18n & RTL (gate — see quality-gates.md)

- Every user-visible string via `t('key')`; keys added to **all** locale files in the same change.
- Logical CSS properties only: `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-` — never `ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-` for layout.
- Icons implying direction (arrows, chevrons) get RTL handling.

## Accessibility (part of implementation, not a pass afterward)

- Semantic elements first (`button`, `nav`, `label`+input); ARIA only where semantics can't express it.
- Full keyboard path: focus visible, focus trapped in modals and returned on close, Escape closes overlays.
- Images: meaningful `alt` or `alt=""`; form fields: programmatic labels; errors: announced, not color-only.

## Performance

- Lists: stable keys, virtualize past ~100 rows, paginate at the source.
- Images through the framework image component with sizes; no layout shift.
- Measure before memoizing — `useMemo`/`memo` are for proven hot paths, not decoration.
- Client bundle: heavy, below-the-fold, or rarely-used components load dynamically.

## Forms

- Project form stack (TanStack Form via `useAppForm()` + Zod). Field components use `useFieldContext()`.
- Zod messages are i18n keys. Submit states: pending disabled, errors shown inline, success feedback explicit.
- Overlay forms: scrollable body, fixed footer with the submit button.
