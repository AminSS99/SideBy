# SideBy combined UX and accessibility audit

Date: 2026-07-31

## Scope

- Local current build: desktop landing and mobile landing/composer.
- Live production: one public comparison URL currently emitted by the sitemap.
- Target: clear, usable, responsive core decision flow with WCAG 2.2 AA behavior.

## Step 1 — Desktop landing

Screenshot: `01-desktop-landing-viewport.png`

Health: Good foundation.

Strengths:

- Strong and distinctive visual hierarchy.
- The product promise and primary task are clear.
- The form fields have visible labels and useful examples.
- Desktop composition, spacing, and grouping are coherent.

Risks:

- Secondary and tertiary copy is frequently very low contrast.
- The page asks users to trust “source backed,” “primary,” and “auditable” claims before showing a concrete sample result or methodology.
- The hero combines brand story, proof points, a form, validation, templates, and example cards; this becomes dense when states expand.

## Step 2 — Mobile landing

Screenshot: `02-mobile-landing.png`

Health: Needs repair.

Strengths:

- Headline scales well and retains the desktop identity.
- Fields remain full-width and touch targets are generally large.
- The primary task is still understandable.

Risks:

- The fixed five-icon marketing navigation covers the lower portion of the comparison card and primary CTA.
- The hero consumes most of the first viewport before the user reaches the full task.
- “Open workbench” becomes an unlabeled visible icon; it has an accessible name, but visual meaning is weak.
- Low-contrast labels and supporting copy are harder to read on a small screen.

## Step 3 — Filled mobile composer

Screenshot: `03-mobile-form-filled.png`

Health: Blocked by overlap.

Strengths:

- Focus styling is visible.
- Validation gives category, confidence, and an actionable suggestion.
- The enabled CTA is visually strong.

Risks:

- The bottom navigation overlaps the enabled CTA and the content immediately below it.
- Validation expansion causes the primary action to move under the fixed layer.
- There is no shared safe-area/keyboard/fixed-layer layout contract.
- The `96% fit` value implies precision whose definition is not visible.

## Step 4 — Live public comparison

Screenshot: `04-mobile-public-comparison-error.png`

Health: Broken.

Observed behavior:

- `https://sideby.ink/compare/react-vs-vue-2024`, which is emitted into the production sitemap, reaches the global error boundary.
- Visible error: `TypeError: Cannot read properties of undefined (reading 'flatMap')`.
- The current renderer assumes `result.categories` exists; legacy/partial result JSON is not normalized.

Risks:

- A public acquisition and sharing surface is unavailable.
- Raw implementation detail is exposed to the user.
- Reload is unlikely to repair a deterministic data-shape failure.
- The page claims the error was logged but gives no incident/reference ID.

## Highest-impact changes

1. Add a versioned result schema and compatibility normalizer, then repair/backfill every sitemap comparison.
2. Remove the mobile fixed-navigation collision and add shared safe-area/fixed-layer tokens.
3. Add Mobile Chromium and Mobile WebKit core-flow tests.
4. Make axe tests fail on violations; current tests only assert that the violations result is an array.
5. Add a rendered production smoke test for public comparison pages.
6. Replace raw error messages with stable error codes and incident IDs.
7. Raise meaningful text contrast and verify keyboard/focus/zoom behavior.

## Evidence limits

- Authenticated app screens were not captured in this audit because the current browser session did not have a user login, and the audit did not transmit credentials or bypass authentication.
- Screenshot inspection cannot prove screen-reader behavior, complete keyboard behavior, or WCAG compliance.
- The desktop full-page capture was rejected because browser stitching duplicated animated/sticky regions; only the stable viewport capture is accepted.
- Code and automated-test findings inform the product roadmap, but only the four accepted screenshots above are visual audit evidence.

