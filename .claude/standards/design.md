# Standard: Visual Design & UX Craft

Working code with amateur visuals is a failed deliverable. This standard defines
the visual bar; `standards/frontend.md` defines correctness. Both apply to all UI.

## Layout & hierarchy

1. **One spacing scale.** Tailwind steps only, used consistently: related items close (`gap-2/3`), groups separated (`gap-6/8`), sections distinct (`py-12/16`). Random per-element pixel-pushing is the #1 amateur tell.
2. **Every screen has one focal point.** The primary action/content is visually dominant; everything else recedes. Two competing CTAs means the hierarchy is undecided.
3. Constrain line lengths and content width (`max-w-*`); center page shells; never let text run edge-to-edge on wide screens.
4. Align to a grid: edges line up vertically and horizontally. Mixed alignments within a section are a defect.

## Typography & color

- Maximum ~4 type sizes per screen, with clear roles (page title, section heading, body, caption). Weight and color create hierarchy before size does.
- Body text is `foreground` on `background`; secondary text is `muted-foreground` — never gray-on-gray you have to squint at. Contrast per a11y rules is the floor, not the goal.
- Semantic tokens carry meaning (destructive, warning, primary); decoration doesn't get random palette colors.

## States are the design (where amateur UIs fail)

Every view ships all of these, styled, not defaulted:
- **Empty:** an explanation + the action to fill it — never a bare "No data" or a blank region.
- **Loading:** skeletons matching the eventual layout for content; spinners only for actions. No layout shift when data lands.
- **Error:** human message + retry path, in the layout — not a raw error string or a dead page.
- **Overflow:** long names, 0 items, 1 item, 1000 items, tiny screens, RTL — check what actually breaks.

## Interaction feel

- Everything clickable looks clickable and responds: hover, focus-visible, active, disabled states on all interactive elements (design-system components give you these — another reason to use them).
- Async actions acknowledge instantly: pending state on the button that was pressed, success/error feedback (toast or inline) always.
- Motion: subtle and purposeful (`transition-colors`, small reveals); nothing bounces, nothing takes >300ms.

## The verification gate (mandatory for UI work)

**Interactive browser tools are banned** (Chrome automation, preview, screenshots,
snapshots — kernel non-negotiable 7). UI verification has exactly two channels:

1. **Playwright script** (`playbooks/playwright.md`): the feature's key flows and
   states assertable by script — which forces testable markup (roles, labels,
   test-ids, all states reachable). If a state can't be reached by a script, that's
   a design defect: add the route/param/fixture that makes it reachable.
   The script asserts structure and states (element present, state rendered,
   flow completes at mobile + desktop viewports), not pixels.
2. **Human UI/UX checklist**: a test-case list delivered to the user in the done
   summary — the human is the design reviewer. Format per case:
   `Screen/flow → steps → what to look at → what "good" looks like`.
   Cover: the happy path end-to-end (a guided run-through of the app), each
   empty/loading/error state, mobile width, and RTL if the app ships it. Order
   the list as a walk through the app, so executing it top-to-bottom is a full tour.

Before handing over, self-check the *code* against this standard (spacing scale,
hierarchy, states present, tokens not palette classes) — the checklist is for
judgment calls only a human eye settles, not for defects you could catch by reading.
