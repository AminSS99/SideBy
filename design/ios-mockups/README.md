# SideBy iOS design study

## Audit scope

The study reviews SideBy's public landing-to-comparison entry flow at desktop and 390 x 844 mobile sizes, then translates the product's core workflow into a native-feeling iOS direction. The current authenticated result flow was also inspected in source, but it was not treated as screenshot evidence because the local preview did not expose a signed-in comparison.

## Captured flow

1. **Desktop landing — healthy.** The split hero clearly pairs the promise with the comparison composer. Evidence, scoring, and auditability are visible without overwhelming the main action.
2. **Current mobile landing — needs focus.** The brand survives the responsive transition, but the large marketing headline pushes the actionable composer below most of the first viewport.
3. **Filled mobile comparison — mixed.** Validation feedback and the 96% fit signal build trust, but the form becomes tall and visually dense before the research action. The viewport also shifts after input focus, separating the task from the page header.

Screenshots are in `../ios-audit/`.

## Design language worth keeping

- Warm ink-black surfaces with copper, rose, and cyan accents.
- Editorial serif headlines paired with compact sans-serif product copy.
- Entity A/B color mapping: copper for A, cyan for B.
- Evidence-first language, visible confidence, and sources close to claims.
- Fine borders, soft radial glow, and restrained elevation instead of heavy glassmorphism.

## Highest-impact iOS changes

- Open directly on the decision composer; move marketing education to onboarding and empty states.
- Use a three-item bottom navigation: Compare, History, Sources. Keep advanced web tools out of the primary mobile navigation.
- Treat the eight-step pipeline as a useful live research trail with current step, remaining time, and newly found evidence.
- Make the verdict the top of the result screen, followed by the decision hinge and a compact score comparison. Keep cited sources persistently reachable.
- Keep body text at 15–17 pt, major controls at least 44 pt tall, and do not encode entity identity or completion state by color alone.

## Accessibility risks to verify in implementation

- Current muted copy and hairline borders may not maintain sufficient contrast on all OLED brightness levels.
- Copper/cyan A/B states need text labels and symbols in addition to color.
- Focus order, VoiceOver labels, Dynamic Type reflow, Reduce Motion behavior, and keyboard handling cannot be confirmed from screenshots alone.
- The persistent bottom action area should respect safe areas and remain reachable at larger text sizes.

## Generated mockups

1. `01-decision-desk.png` — comparison-first home with recent decisions and bottom navigation.
2. `02-research-trail.png` — transparent eight-stage research progress with live source previews.
3. `03-verdict-lens.png` — verdict-first result with compact A/B scores, decision hinge, and persistent sources action.

All three were generated with the built-in ImageGen workflow using the current mobile screenshots as visual references. The prompt set fixed the canvas to 390 x 844, preserved SideBy's warm ink/copper/rose/cyan system and editorial serif/sans pairing, prohibited device chrome, and assigned each mock a focused task: start a comparison, follow research, or inspect a verdict.

## Prompt set

- **Decision Desk:** Production-quality native iOS home for SideBy; make the two-option composer the hero, include decision context, one research CTA, two recent decisions, and Compare/History/Sources tabs. Preserve the current brand tokens and A/B color mapping; no marketing hero or device chrome.
- **Research Trail:** Production-quality native iOS progress screen for React vs Vue; show all eight pipeline stages, 5 of 8 progress, remaining time, live `react.dev` and `vuejs.org` evidence previews, and a notification action. Use one grouped process surface; no generic spinner or device chrome.
- **Verdict Lens:** Production-quality native iOS result screen for React vs Vue; show the recommendation, confidence, summary/scores/evidence control, three compact A/B score rows, a decision hinge, and persistent cited-sources action. No radar chart, generic dashboard, or device chrome.
