# /add-pixel-events

Add Meta Pixel event tracking to any website. Works on any stack. The agent analyzes
the site's actual pages and user flows to determine what is worth tracking, then
implements events using the typed utility pattern.

---

## Phase 0 — Check existing pixel setup

Search the codebase for any existing pixel integration:

```bash
grep -r "fbq\|facebook.*pixel\|meta.*pixel\|facebookPixelId" src/ --include="*.tsx" --include="*.ts" --include="*.js" -l
```

Then determine:
1. Is the pixel script injected anywhere? (look in root layout, `_providers`, `_app`, `_document`)
2. Is there a pixel ID configured? (env var, admin settings, hardcoded)
3. Does a typed pixel utility exist? (search for `trackPixelEvent` or similar)

---

## Phase 1 — Set up pixel injection (if missing)

### 1a — Pixel ID storage

Choose the appropriate pattern for this project:

**Option A — Admin-configurable (preferred for CMS-style apps):**
- Store the pixel ID in a settings/config table in the database
- Create an admin UI field to enter/update the ID
- Fetch it server-side and pass to the layout

**Option B — Environment variable (simpler):**
- Add `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` to `.env` and env schema
- Read it directly in the layout

### 1b — Script injection

Inject the pixel script in the root layout or providers file. Use `next/script` with
`strategy="afterInteractive"`:

```typescript
{pixelId && (
  <Script
    id="fb-pixel"
    strategy="afterInteractive"
    dangerouslySetInnerHTML={{
      __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');fbq('track','PageView');`,
    }}
  />
)}
```

`PageView` fires automatically on every page load from this one script.

### 1c — Typed utility

Create `src/lib/meta-pixel.ts` (adapt path to this project's lib convention):

```typescript
declare global {
  interface Window {
    fbq: (
      action: "track" | "trackCustom" | "init",
      event: string,
      params?: Record<string, unknown>,
    ) => void;
  }
}

export function trackPixelEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", eventName, params);
}

export function trackCustomPixelEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("trackCustom", eventName, params);
}
```

---

## Phase 2 — Analyze the site to determine what to track

**Do not use a generic event list. Read the actual codebase first.**

Explore the following and build a prioritized event map:

1. **List all public/user-facing routes** — what pages exist?
2. **Find all form submissions** — contact, signup, newsletter, checkout, inquiry, etc.
3. **Find all CTA buttons** — "Get Started", "Book a Call", "Buy Now", external links, WhatsApp
4. **Find key page views** — product/service/portfolio detail pages, pricing pages
5. **Find any tool interactions** — calculators, configurators, quizzes
6. **Find auth flows** — registration, login

For each interaction, select the most appropriate Meta standard event:

| Interaction type | Standard event |
|-----------------|----------------|
| Form submit (lead/inquiry) | `Lead` |
| Newsletter / email signup | `CompleteRegistration` |
| Account registration | `CompleteRegistration` |
| View a product/service/portfolio detail | `ViewContent` |
| Click a contact channel (WhatsApp, phone, email) | `Contact` |
| Tool CTA that leads toward purchase/contact | `InitiateCheckout` |
| Purchase / payment confirmed | `Purchase` |
| Add to cart | `AddToCart` |
| Anything that doesn't fit above | `trackCustomPixelEvent` with a descriptive name |

Produce a prioritized event table before writing any code:

```
Priority | Event name | Trigger | File/Component
---------|-----------|---------|---------------
Critical | Lead      | Contact form submit | ...
Critical | Contact   | WhatsApp click | ...
High     | ...
```

Present this table and confirm with the user before implementing.

---

## Phase 3 — Implement events

For each event in the approved list:

### Client components (forms, buttons)
Import the utility and call in the appropriate callback:

```typescript
import { trackPixelEvent } from "@/lib/meta-pixel";

// in onSuccess / onClick:
trackPixelEvent("Lead", { content_name: "Contact Form" });
```

### Server components (page views)
Create a null-rendering client component that fires on mount:

```typescript
// src/components/general/pixel-view-event.tsx
"use client";
import { useEffect } from "react";
import { trackPixelEvent } from "@/lib/meta-pixel";

interface Props { contentName: string; contentType: string; }

export function PixelViewEvent({ contentName, contentType }: Props) {
  useEffect(() => {
    trackPixelEvent("ViewContent", { content_name: contentName, content_type: contentType });
  }, []);
  return null;
}
```

Drop `<PixelViewEvent contentName={...} contentType={...} />` into the server page JSX.

### After implementing all events — run type and build validation

```bash
npm run typecheck && npm run build
```

Fix any TypeScript errors before proceeding to verification. Do not skip this step.

---

## Phase 4 — Verification

1. Start the dev server and open DevTools → Network → filter `connect.facebook.net`
2. Perform each tracked action and confirm the event request fires with correct params
3. Use Meta Events Manager → Test Events (business.facebook.com) — enter the site URL,
   walk each flow, confirm events appear in real time with correct names and parameters

---

## Checklist

- [ ] Pixel ID storage configured (admin setting or env var)
- [ ] Pixel script injected in root layout / providers
- [ ] `PageView` fires on every page
- [ ] `src/lib/meta-pixel.ts` utility exists
- [ ] All critical events implemented
- [ ] All high-priority events implemented
- [ ] `npm run typecheck && npm run build` passes with no errors
- [ ] Events verified in browser DevTools Network tab
- [ ] Events verified in Meta Events Manager Test Events tool