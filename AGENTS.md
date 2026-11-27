<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Product

**Gateling Solutions** — B2B technology consulting portfolio at `gateling.com`.

Target clients: cafes, schools, retail, events businesses in Egypt and MENA.

Claude Code sessions are governed by [`.claude/CLAUDE.md`](.claude/CLAUDE.md) (routing, effort tiers, quality gates). This file is for other agent tools and for the product facts below.

## App conventions

- **Admin entities and CRUD**: follow [`docs/entity-blueprint.md`](docs/entity-blueprint.md)
- **Public landing pages**: follow [`docs/public-experience.md`](docs/public-experience.md)
- **SEO on every public page**: follow [`docs/seo-blueprint.md`](docs/seo-blueprint.md)
- **Background jobs**: follow [`docs/inngest-offload-policy.md`](docs/inngest-offload-policy.md) — any operation that does not require an immediate user response goes to Inngest.
- **Image uploads**: use `src/integrations/firebase/storage.ts` — no Cloudinary.

## Agent workflow (required)

The gates are in [`.claude/standards/quality-gates.md`](.claude/standards/quality-gates.md). In short:

- Run **`npm run build`** after substantive changes; fix type/build errors before finishing.
- Use normal file edits, not ad-hoc shell scripts, for source patches.
- Keep system screens aligned with entity blueprint and registry (`EntityPageHeader`, audit-only info dialogs, selection/action bar rules).
- **When you discover a repeatable mistake or convention, record it in the matching `.claude/standards/` file** so future sessions follow it.
- **Inline form/system notices**: use shadcn `Alert` with the proper variant (`default` vs `destructive`).

## Project appendix

- **Product:** Gateling Solutions portfolio + admin
- **Build command:** `npm run build`
- **Locales:** EN + AR (both required on every user-visible string)
- **Roles:** `super_admin` (root@gateling.com) / `admin` / `employee` / `customer`
- **Scoped?** branch-scoped for employees (`branchId`)
- **Domain-specific rules:**
  - No pricing page — pricing is client-specific
  - Three seeded case studies: Atelier, Gateling Cafe, Megz Courses
  - All images via Firebase Storage, not Cloudinary
  - All emails and external calls via Inngest background jobs, never inline
  - `super_admin` role cannot be deleted or demoted
