# /ui-scan

Scan a landing page file for design system violations and report every instance that bypasses the official component system.

## Usage

```
/ui-scan <file-path>
/ui-scan src/app/(landing-pages)/services/page.tsx
/ui-scan --fix src/app/(landing-pages)/about/page.tsx
```

Without `--fix`: report only — list violations with line numbers and suggested replacements.
With `--fix`: apply all safe replacements automatically.

---

## Instructions

You are a design system auditor. When invoked:

1. **Read the target file** in full.
2. **Read `src/components/ui/containers.tsx`** to confirm the current component API (names, props, variants).
3. **Scan for every violation** in the categories below.
4. **Report violations** as a numbered list with: line number, the offending code snippet, and the corrected component.

If `--fix` is passed, apply all safe replacements to the file after reporting. Do not invent new components — only use components that exist in `containers.tsx`.

---

## Violation Categories

### 1. Missing HeroContainer on first section
The very first visible section of a public landing page MUST be `<HeroContainer>`.

**Violation pattern:** Page starts with `<Section variant="compact">`, `<Section>`, or any raw div as the first content element.
**Fix:** Replace with `<HeroContainer>` containing `<Container size="narrow|wide">` with `<PageHeading>` + `<ProseText>` + optional CTAs.

---

### 2. Wrong Section variant used as page hero
Using `<Section variant="compact">` or any Section variant as the first section.

**Violation:** `<Section variant="compact">` as first section.
**Fix:** Replace with `<HeroContainer>`.

---

### 3. Section alternation violation
After HeroContainer, sections must strictly alternate `feature → alternate → feature → alternate`. No two consecutive sections with the same variant.

**Violation:** Two consecutive `variant="feature"` or two consecutive `variant="alternate"` sections.
**Fix:** Swap one to the correct alternating variant.

---

### 4. Missing CTA section at page end
Every public page must end with `<Section variant="cta">` pointing to `/contact`.

**Violation:** Page ends without a `variant="cta"` section.
**Fix:** Add `<Section variant="cta"><Container size="narrow" className="text-center"><SectionHeader .../><LinkButton href="/contact">...</LinkButton></Container></Section>`.

---

### 5. Raw card divs (not using ContentCard)
Any `<div>` that has all three of: `rounded-xl` (or `rounded-2xl`), `border`, and `p-` padding — is a card and must use `<ContentCard>`.

**Violation pattern:** `<div className="... rounded-xl border ... p-6 ...">`
**Fix:** `<ContentCard className="...remaining classes...">` — strip `rounded-xl`, `border`, `p-6`, `shadow-sm`, `bg-background` from className since ContentCard handles them.

---

### 6. Raw icon containers (not using IconBox)
Any `<div>` that positions an icon with bg-primary/10 and explicit size classes.

**Violation pattern:** `<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 ...">`
**Fix:** `<IconBox icon={Icon} size="md">` — pick size based on h/w: h-10=sm, h-12=md, h-16=lg.

---

### 7. Raw heading elements with inline styles
Any `<h1>`, `<h2>`, `<h3>`, or `<h4>` with a `className` attribute on a landing page.

**Exceptions (allowed):**
- `<h2>` headings inside `SectionHeader` — these are rendered internally, not in page files
- `<h2>` in prose/article content sections where section-level headings are appropriate and no `SectionHeader` is being bypassed
- `<h3>` for sub-headings in the `final-cta-section` contact header (it has a specific primary color that is intentional)

**Violation:** `<h1 className="text-4xl font-bold ...">` in page files → use `<PageHeading>`
**Violation:** `<h3 className="...">` inside a ContentCard → use `<CardHeading>`

---

### 8. Raw prose paragraphs with muted-foreground (not using ProseText)
`<p className="text-muted-foreground ...">` elements that are body/supporting copy.

**Violation pattern:** `<p className="text-muted-foreground text-sm leading-relaxed">` or `<p className="text-muted-foreground text-lg">` etc.
**Fix:** `<ProseText size="sm|base|lg">` — map text-sm → size="sm", text-base/default → size="base", text-lg → size="lg".

**Exception:** `<p>` inside `SectionHeader`, `Stat`, `StatCard` internals — these are fine.

---

### 9. Raw check-list items (not using CheckItem)
Any `<div>` or `<li>` that shows a checkmark icon + text, used as a bulleted benefit list.

**Violation pattern:** `<div className="flex items-start gap-2"><CheckCircle2 .../><p>...</p></div>`
**Fix:** `<CheckItem>...</CheckItem>`

---

### 10. Using `compact` variant as a standalone section between two top-level sections
`<Section variant="compact">` at the top level of a page (as a sibling of other `<Section>` elements) is only acceptable if it's secondary/supporting content and couldn't logically be merged into an adjacent section.

**Report but do not auto-fix** — flag for manual review.

---

## Output Format

```
UI-SCAN REPORT: src/app/(landing-pages)/services/page.tsx
─────────────────────────────────────────────────────────

✗ VIOLATION 1 (line 122): Missing HeroContainer — first section uses <Section variant="compact">
  Found:   <Section variant="compact">
  Fix:     <HeroContainer>

✗ VIOLATION 2 (line 165): Raw card div — use ContentCard
  Found:   <div className="rounded-xl border bg-background p-6 shadow-sm ...">
  Fix:     <ContentCard className="...">

✗ VIOLATION 3 (line 171): Raw icon container — use IconBox
  Found:   <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
  Fix:     <IconBox icon={Icon} size="md">

✗ VIOLATION 4 (line 180): Raw heading — use CardHeading
  Found:   <h3 className="mb-2 font-bold">
  Fix:     <CardHeading className="mb-2">

✗ VIOLATION 5 (line 182): Raw prose — use ProseText
  Found:   <p className="text-sm text-muted-foreground">
  Fix:     <ProseText size="sm">

─────────────────────────────────────────────────────────
5 violations found. Run /ui-scan --fix <file> to apply safe fixes.
```

If no violations are found:
```
✓ CLEAN: src/app/(landing-pages)/services/page.tsx — 0 violations
```
