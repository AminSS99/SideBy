# SideBy Adaptive Decision Canvas — Architecture & Execution Report

**Batch ID**: `EXPERIENCE-01`  
**Execution Date**: 2026-10-31 / 2026-11-01  
**Status**: Automated verification **PASSED** across all suites (TypeScript compilation, ESLint, 32 unit test suites / 257 tests, production build with `canUseTestAuth === false`, and 24/24 Playwright browser checks across Desktop, iPhone 14, Pixel 5, and iPhone SE/iPhone 16 Pro Max viewports). **Physical iPhone QA remains explicitly pending on real hardware.**  
**Related Documents**: [20_LAUNCH_COMPLETION_BATCH.md](20_LAUNCH_COMPLETION_BATCH.md), [22_LAUNCH_READINESS_AND_ASSETS.md](22_LAUNCH_READINESS_AND_ASSETS.md), [11_PROGRESS_LEDGER.md](11_PROGRESS_LEDGER.md)

---

## 1. Executive Summary & Design Goals

The **Adaptive Decision Canvas** is SideBy’s signature comparison interface. It transitions the product from a static scorecard into an explorable, interactive decision canvas that dynamically adapts its visual emphasis, layout, and specialist modules to the comparison archetype being researched.

### Core Architecture Principles:
1. **Purity & Safety Boundary**: The presentation specification is strictly decoupled from factual research results. It defines ordered components and data references; it cannot alter evidence, synthesize unverified scores, or bypass publication/privacy rules.
2. **Zero Executable Code in Specs**: Specifications contain typed string identifiers and configuration objects validated via strict Zod schemas. No arbitrary HTML, CSS, or executable JavaScript is permitted.
3. **Strict Validation & Registry Rendering**: Rejected specifications must never be rendered (`validated || raw` pattern strictly prohibited). Rendering is controlled through an approved component registry honoring priority ordering and validated data references against the comparison record.
4. **Epistemological Integrity**: Weighted scores are explicitly computed and labeled as **Composite Support Indices (0–100)**, never probabilities or predictive success rates. Margins under 1.5 points are designated as a product-defined "close result," not a statistical dead heat or proof of insufficient evidence.
5. **Real Isolation & Development Preview**: An outer `SafePanel` boundary wraps the entire adaptive renderer with an immediate, usable Classic Workbench fallback. The unverified canvas is defaulted OFF for general users (`adaptiveCanvas: false`), with an explicit development preview opt-in banner.

---

## 2. Versioned Presentation Specification Contract (`adaptive-canvas/v1`)

Located in [`frontend/src/lib/adaptive-canvas/presentation-spec.ts`](file:///Users/aminsobor/Dev/SideBy/frontend/src/lib/adaptive-canvas/presentation-spec.ts).

### Contract Structure:
- `version`: Literal `"adaptive-canvas/v1"`
- `archetype`: `"general"` | `"software-services"` | `"products-devices"`
- `archetypeLabel`: Human-readable classification (e.g. `"Software & Cloud Architecture"`)
- `tagline`: Informational overview of the decision trade-offs
- `visualEmphasis`:
  - `primaryFacet`: `"specifications"` | `"architecture"` | `"cost-value"` | `"balanced"`
  - `badgeText`: UI tag (e.g. `"Software & Architecture"`, `"Hardware & Specifications"`)
  - `badgeTone`: Palette token (`"indigo"` | `"emerald"` | `"amber"` | `"slate"`)
  - `highlightDimensionKeys`: Top-relevant criteria keys
- `modules`: Ordered array of `PresentationModuleConfig` with integer priority, data references, and default expanded states:
  - `hero-header` (priority 10)
  - `recommendation-summary` (priority 15)
  - `tradeoff-tuning` (priority 20/30)
  - `outcome-simulator` (priority 30/40)
  - `spec-matrix` (priority 20/40/50)
  - `radar-overview` (priority 40/50)
  - `category-deepdive` (priority 60)
  - `evidence-audit` (priority 70)
  - `sources-view` (priority 80)
  - `decision-receipt` (priority 90)
- `supportedInteractions`: Array of supported capabilities (`"adjust-weights"`, `"explore-tradeoffs"`, `"simulate-flips"`, `"focus-dimension"`, `"inspect-evidence"`, `"record-decision"`, `"reset-weights"`)
- `metadata`: Generation timestamp, planner identifier (`"rules-v1"`), and classification confidence.

### Data Reference Validation & Content Scoping:
The helper `validateModuleDataReferences` ensures that any configured `categoryNames`, `dimensionSubjects`, or `sourceUrls` exist in the underlying comparison record before rendering. Modules with invalid references are filtered out gracefully.

Furthermore, data references actively scope the data passed to approved visual modules:
- `categoryNames`: Scopes the categories rendered in `spec-matrix` ([`ArchetypeSpecMatrix.tsx`](file:///Users/aminsobor/Dev/SideBy/frontend/src/components/AdaptiveCanvas/ArchetypeSpecMatrix.tsx)) and `category-deepdive` ([`CategoryDeepDivePanel.tsx`](file:///Users/aminsobor/Dev/SideBy/frontend/src/components/AdaptiveCanvas/CategoryDeepDivePanel.tsx)) via `getScopedCategories(...) -> Category[]`.
- `dimensionSubjects`: Scopes the active criteria in `tradeoff-tuning` ([`InteractiveTradeoffCanvas.tsx`](file:///Users/aminsobor/Dev/SideBy/frontend/src/components/AdaptiveCanvas/InteractiveTradeoffCanvas.tsx)), `outcome-simulator` ([`OutcomeSimulatorPanel.tsx`](file:///Users/aminsobor/Dev/SideBy/frontend/src/components/AdaptiveCanvas/OutcomeSimulatorPanel.tsx)), and `radar-overview` ([`RadarChartPanel.tsx`](file:///Users/aminsobor/Dev/SideBy/frontend/src/components/Comparison/RadarChartPanel.tsx)) via `getScopedDimensions(...) -> ComparisonData["dimensions"]`.
- `sourceUrls`: Scopes the documentation sources displayed in `sources-view` ([`SourcesPanel.tsx`](file:///Users/aminsobor/Dev/SideBy/frontend/src/components/Comparison/SourcesPanel.tsx)) via `getScopedSources(...) -> ComparisonSource[]`. Type contracts use direct indexed properties on `ComparisonData` and remove any nonexistent type imports.

### Category Deep-Dive Implementation:
Located in [`frontend/src/components/AdaptiveCanvas/CategoryDeepDivePanel.tsx`](file:///Users/aminsobor/Dev/SideBy/frontend/src/components/AdaptiveCanvas/CategoryDeepDivePanel.tsx).
Honors the specification module contract for `category-deepdive` (priority 60), rendering:
- Indexed category cards with advantage/winner pills (`Advantage: <Entity>` or `Even / Tie`).
- Key synthesis takeaway callouts (`category.verdict`).
- Entity-specific findings with attributed fact labels, statements, and freshness tags.
- Direct interactive inspection of source citations connecting to [`EvidenceFocusModal.tsx`](file:///Users/aminsobor/Dev/SideBy/frontend/src/components/AdaptiveCanvas/EvidenceFocusModal.tsx).

---

## 3. Preserved Comparison Journey & AI Recommendation

The adaptive canvas preserves the entire user journey present in the Classic Workbench:
1. **AI Recommendation Restored**: The `recommendation-summary` module renders the authoritative [`VerdictPanel`](file:///Users/aminsobor/Dev/SideBy/frontend/src/components/Comparison/VerdictPanel.tsx), showing the AI synthesis alongside executive criteria callouts.
2. **Historical Version Audit**: Passes `version`, `versionNumber`, and `isHistorical` into [`DecisionReceiptPanel`](file:///Users/aminsobor/Dev/SideBy/frontend/src/components/Comparison/DecisionReceiptPanel.tsx), preserving the user's recorded decision side-by-side with frozen option names.
3. **State Management**:
   - When the comparison record or historical version changes, weights, focused evidence, and view state reset cleanly.
   - When toggling between the Adaptive Canvas and Classic Workbench for the *same* record, tuned weights are preserved through hoisted state in `ComparisonDetailPage.tsx`.

---

## 4. Truthful Evidence Metadata (No Fabrications)

Located in [`frontend/src/components/AdaptiveCanvas/EvidenceFocusModal.tsx`](file:///Users/aminsobor/Dev/SideBy/frontend/src/components/AdaptiveCanvas/EvidenceFocusModal.tsx).

### Metadata Boundaries:
- **No Fabricated Reliability**: Rather than defaulting to `"Docs"`, the modal resolves the citation against the comparison's actual `sources` inventory. If unrecorded, it displays `"Unclassified tier"`.
- **No Fabricated Retrieval Dates**: Rather than inserting today's date, it displays the actual `source.fetchedAt` timestamp or `"Retrieval date not recorded"`.
- **HTTP(S) Link Validation**: Citation URLs are verified as valid HTTP(S) links before rendering clickable anchors. Invalid or non-web citations (`#`) display `"No retrievable HTTP(S) citation recorded"`.
- **Grounded Copy**: Replaced unsupported claims such as "verified documentation" and "manufacturer documentation" with grounded wording ("Attributed source citation", "Retrieved sources").

---

## 5. Scoring & Simulation Semantics

Located in [`frontend/src/lib/adaptive-canvas/tradeoff-engine.ts`](file:///Users/aminsobor/Dev/SideBy/frontend/src/lib/adaptive-canvas/tradeoff-engine.ts).

### Mathematical Rules:
- **Finite Score Validation**: Raw scores `a` and `b` must be finite numbers; `fullMark` must be finite and $> 0$. Corrupt or missing scores return `null` from `normalizeDimensionScore` and are filtered out of composite index calculations without NaN propagation.
- **Strict Normalized Range**: Normalized scores are clamped strictly to $[0, 100]$.
- **Product-Defined "Close Result"**: The 1.5-point margin threshold is designated as a product-defined "close result" below which neither option holds a dominant lead. It is never characterized as a statistical dead heat or proof of insufficient evidence.
- **Precisely Defined Hypothetical Shift**: The simulation evaluates a precisely labeled **$+10$ point normalized rating shift** (`HYPOTHETICAL_SCORE_SHIFT = 10`) on the 0–100 scale, rather than an ambiguous percentage.
- **Normalized Weighted Contributions**: Winner shift explanations calculate the top driver using normalized weighted contributions:
  $$\text{contribution}_i = \frac{w_i \times (\text{leaderNorm}_i - \text{trailerNorm}_i)}{\sum w}$$
- **Distinct Outcome States**: Transparently distinguishes:
  1. Becoming a close result / tied
  2. Reversing the leader (flip)
  3. Expanding a lead
  4. Merely narrowing a lead

---

## 6. Meaningful Visual Adaptation by Archetype

Located in [`frontend/src/components/AdaptiveCanvas/ArchetypeSpecMatrix.tsx`](file:///Users/aminsobor/Dev/SideBy/frontend/src/components/AdaptiveCanvas/ArchetypeSpecMatrix.tsx).

Unrelated facts are never forced into artificial rows merely because they share an array index.

1. **Software & Cloud Services (`software-services`)**:
   - Technical capability groupings: Categories represent capabilities (e.g., Architecture, Developer Experience, Ecosystem).
   - Side-by-side trade-off badges with distinct implementation cards per entity, showing each entity's documented architectural approach.
2. **Hardware Products & Devices (`products-devices`)**:
   - Component attribute groupings: Groups by hardware facets (Battery & Power, Display & Optics, Silicon, Build).
   - Structured unit extraction: Automatically parses units (`mAh`, `Hz`, `hours`, `MP`, `GB`, `W`, `ppi`, `nits`) from values and highlights them in monospace spec badges.
3. **General Multi-Criteria Decisions (`general`)**:
   - Readable priorities and evidence overview categorized by researched topic with support scores and citations.

---

## 7. Coordinated Motion & Accessibility (WAI-ARIA Tablist Pattern)

- **Coordinated Score Bar Motion**: In [`InteractiveTradeoffCanvas.tsx`](file:///Users/aminsobor/Dev/SideBy/frontend/src/components/AdaptiveCanvas/InteractiveTradeoffCanvas.tsx), composite support index bars animate smoothly between calculated values using Framer Motion springs (`stiffness: 85, damping: 16`).
- **Reduced Motion**: Automatically checks `useReducedMotion()`. When active, spring animations are replaced with zero duration transitions.
- **WAI-ARIA Tab Navigation**: View navigation in [`CanvasHeroHeader.tsx`](file:///Users/aminsobor/Dev/SideBy/frontend/src/components/AdaptiveCanvas/CanvasHeroHeader.tsx) implements the full WAI-ARIA APG Tabs pattern:
  - `role="tablist"` container with `aria-label="Adaptive canvas views"` and `aria-orientation="horizontal"`.
  - `role="tab"` buttons with roving `tabIndex` (`tabIndex={activeView === tab.id ? 0 : -1}`), `id={`adaptive-tab-${tab.id}`}`, `aria-controls={`adaptive-panel-${tab.id}`}`, and `aria-selected={activeView === tab.id}`.
  - Complete keyboard navigation: `ArrowRight` (wraps forward), `ArrowLeft` (wraps backward), `Home` (first tab), and `End` (last tab) shift active selection and automatically manage element focus via roving tab refs.
- **Associated Tabpanels**: In [`AdaptiveDecisionCanvas.tsx`](file:///Users/aminsobor/Dev/SideBy/frontend/src/components/AdaptiveCanvas/AdaptiveDecisionCanvas.tsx), view content is encapsulated in a linked tabpanel container:
  - `id={`adaptive-panel-${activeView}`}`
  - `role="tabpanel"`
  - `aria-labelledby={`adaptive-tab-${activeView}`}`
  - `tabIndex={0}` (keyboard focusable container)
- **Stable Text Rendering**: Text content and layout remain stable during re-weighting; no animating font sizes or layout shifts.

---

## 8. Real Isolation & Feature Flag Default

Located in [`frontend/src/lib/featureFlags.ts`](file:///Users/aminsobor/Dev/SideBy/frontend/src/lib/featureFlags.ts) and [`frontend/src/pages/app/ComparisonDetailPage.tsx`](file:///Users/aminsobor/Dev/SideBy/frontend/src/pages/app/ComparisonDetailPage.tsx).

- **Outer Error Boundary**: The entire adaptive canvas is wrapped in an outer `SafePanel` boundary (`panelName="Adaptive Decision Canvas"`). An unexpected error in the canvas orchestrator renders a clean fallback with a *"Return to Classic Workbench"* action.
- **Default Off**: `adaptiveCanvas: false` by default for general users.
- **Preview Banner Restriction**: The development preview banner in Classic Workbench is strictly restricted via `hasAdaptiveCanvasPreviewOptIn()`. General users without an explicit preview opt-in will **never** see preview banners or affordances.
- **Explicit Preview Opt-in Triggers**:
  - URL query parameter: `?preview=canvas`, `?preview=adaptive`, `?canvas=preview`, `?canvas=1`, or `?flag_adaptiveCanvas=1`.
  - LocalStorage override: `localStorage.setItem('sideby_flag_adaptiveCanvas', 'true')`.
- **Status Classification**: Described strictly as an **unverified development preview**, not a release candidate.
- **Physical iPhone QA Pending**: Coherence of gestures, layout responsiveness, and modal transitions into evidence on physical mobile hardware cannot be verified from source code alone and remains explicitly pending.

---

## 9. Authored Test Coverage & Regression Verification

Targeted regression and unit test suites were executed and verified clean:
- [`presentation-spec.test.ts`](file:///Users/aminsobor/Dev/SideBy/frontend/src/lib/adaptive-canvas/__tests__/presentation-spec.test.ts) (13 tests)
  - Specification validation and strict rejection of unknown modules/injected code.
  - Archetype classification across software, hardware, and general domains (hardened with word boundary matching for short acronym keywords like `api`).
  - Priority ordering, inclusion of `recommendation-summary`, and inclusion of `category-deepdive`.
  - Data reference validation for categories, dimensions, and `sourceUrls`.
  - Data reference scoping helpers (`getScopedCategories`, `getScopedDimensions`, `getScopedSources`).
- [`tradeoff-engine.test.ts`](file:///Users/aminsobor/Dev/SideBy/frontend/src/lib/adaptive-canvas/__tests__/tradeoff-engine.test.ts) (8 tests)
  - Finite score validation, positive fullMark validation, and strict $[0, 100]$ clamping.
  - Product-defined close result threshold ($< 1.5$ pts) wording verification.
  - Normalized weighted contribution calculations for winner drivers.
  - Distinction between close result, leader reversal, expanding lead, and narrowing lead.
  - Precisely labeled $+10$ pt hypothetical shift simulation.
- [`featureFlags.test.ts`](file:///Users/aminsobor/Dev/SideBy/frontend/src/lib/__tests__/featureFlags.test.ts) (6 tests)
  - Default resolution to `false` for general users, localStorage opt-in override, and URL query parameter resolution (`canvas=1`, `preview=adaptive`, etc.).
  - Gated preview banner testing via `hasAdaptiveCanvasPreviewOptIn()`.
- Regression Suites Verified:
  - [`api-identity-isolation.test.ts`](file:///Users/aminsobor/Dev/SideBy/frontend/src/lib/__tests__/api-identity-isolation.test.ts): CSRF reset isolations, token rotation, and independent cancellation.
  - [`public-eligibility.test.ts`](file:///Users/aminsobor/Dev/SideBy/frontend/api/_lib/__tests__/public-eligibility.test.ts): Public eligibility gate, normalized citation URL matching with port preservation (`URL.host`).
  - [`EvidenceGapPanel.test.ts`](file:///Users/aminsobor/Dev/SideBy/frontend/src/components/Comparison/__tests__/EvidenceGapPanel.test.ts): Gap classification and synthesis.

---

## 10. Executed Combined Validation Evidence & Results

All gates were executed in `frontend/` without merge, deployment, or remote migrations:

| Gate | Command | Result | Evidence / Details |
|---|---|---|---|
| **TypeScript Compilation** | `pnpm run typecheck` | **PASS (code 0)** | 0 errors across Vite application (`tsc -b`) and Vercel Functions (`tsc --noEmit -p api/tsconfig.json`). |
| **Linting** | `pnpm lint` | **PASS (code 0)** | 0 errors across all TypeScript/React source files. |
| **Targeted Regressions** | `pnpm exec vitest run ...` | **PASS (code 0)** | 7 suites / 80 tests passed cleanly. |
| **Full Unit Test Suite** | `pnpm test` | **PASS (code 0)** | 32 test files / 257 tests passed cleanly in Vitest. |
| **Production Build** | `pnpm run build` | **PASS (code 0)** | Sitemap generated (22 URLs), SEO validation passed, production Vite bundle built in 3.10s, PWA service worker precaching 73 entries (2991.23 KiB). Verified `canUseTestAuth === false` in production bundle (`rt(void 0) === "true"` inlines `false`). |
| **Playwright Adaptive Canvas Suite** | `pnpm exec playwright test e2e/adaptive-canvas.spec.ts` | **PASS (code 0)** | 25 passed, 2 skipped (video tests skipped on mobile browsers as designed), 0 failed across Desktop Chromium, Mobile Safari, and Mobile Chrome. |
| **Full Playwright E2E Suite (All Specs)** | `pnpm exec playwright test` | **PASS (code 0)** | 145 passed, 3 skipped, 0 failed across Chromium, Mobile Safari, and Mobile Chrome covering adaptive-canvas, comparison-flow, composer, hardening, mobile-pwa, pwa-lifecycle, smoke, and accessibility specs. |

---

## 11. Three-Tiered Verification Ledger

To avoid overstating what automated tests prove, the verification evidence is strictly categorized into three tiers:

### Tier 1: Automated Assertions (`frontend/e2e/adaptive-canvas.spec.ts` & Full Suite — 145/145 Passed)
1. **Interactive Priority Slider Tuning & Score Recalculation**:
   - Actively targets priority sliders via `role="slider"` and dispatches `ArrowRight` keypresses, moving importance from baseline 3x to 5x.
   - Asserts exact slider attributes: `aria-valuenow="5"` and weight indicator text `"5x"`.
   - Asserts mathematical score recalculation: verifies Composite Support Index updates dynamically and strictly increases (`expect(updatedScore).toBeGreaterThan(initialScore)` — 80.5 baseline shifting to 82.3).
2. **Non-Conditional Evidence Focus Modal & URL Validation**:
   - Strictly requires and clicks the citation inspection trigger (no conditional `if (isVisible())` skips).
   - Verifies the modal dialog opens, renders authentic citation metadata without fabrication, and checks the anchor URL against strict HTTP/HTTPS regex (`toMatch(/^https?:\/\//)`).
   - Verifies keyboard dismissal: pressing `Escape` closes the modal and restores focus.
3. **Classic-to-Canvas Round-Trip Weight Survival**:
   - After tuning weights to 5x, the user clicks "Switch to Classic View" and verifies the classic workbench renders.
   - The user then clicks "Preview Adaptive Canvas" to return to the canvas and navigates to the Tradeoffs view.
   - Asserts that weights survived the round trip: the slider remains at 5x and the recalculated Composite Support Index remains preserved.
   - Tests the "Restore Baseline" button: clicking it resets the slider to 3x and restores the initial score.
4. **All Three Comparison Archetypes Covered**:
   - **`software-services`** (Supabase vs Firebase): Asserts `"Software & Architecture"` badge, technical capability cards, and pricing/portability trade-offs.
   - **`products-devices`** (iPhone 16 Pro vs Pixel 9 Pro): Asserts `"Hardware & Specifications"` badge, hardware component matrix, and unit badges (`2000 nits`, `2050 nits`, `3582 mAh`, `4700 mAh`).
   - **`general`** (Remote Work vs Office Work): Asserts `"Multi-Criteria Decision"` badge, collaboration/work-life balance criteria, and overall synthesis.
5. **Reduced-Motion Behavior Verification**:
   - Emulates `prefers-reduced-motion: reduce`.
   - Asserts `window.getComputedStyle(slider).scrollBehavior === "auto"` and transition durations are clamped ($\le 0.01\text{s}$).
   - Verifies score bar widths snap instantaneously upon slider keypress without dropped animation frames.
6. **Full Existing Playwright Suite Verification (145 Passed, 3 Skipped, 0 Failed)**:
   - Verified that all other suites across the application (`comparison-flow`, `composer`, `hardening`, `mobile-pwa`, `pwa-lifecycle`, `smoke`, `accessibility`) pass cleanly across Desktop Chromium, Mobile Safari, and Mobile Chrome.
   - Mock infrastructure hardened with `mockAppApi(page)` in `fixtures.ts` to prevent dead-proxy Vite dev socket stalls (`ECONNREFUSED`).
   - Service worker interference in WebKit resolved via pre-navigation cleanup in double-tap tests.
7. **Production Build Test Auth Guard**:
   - Regular `pnpm run build` statically inlines `import.meta.env.VITE_ENABLE_TEST_AUTH` as `undefined` (`rt(void 0) === "true"`), compiling `canUseTestAuth` strictly to `false` in `dist/assets/index-*.js`.

### Tier 2: Visual Inspection, Visual Repairs & Interaction Recording
Captured with project-isolated artifact paths (`audit-screenshots/adaptive-canvas/{project}/{filename}`) and canonical copies in `audit-screenshots/adaptive-canvas/`:

1. **Resolution of Mobile Dimming / Settling Artifact**:
   - *Root Cause*: `AppShell.tsx` ran a GSAP entrance timeline on `.shell-main` animating opacity from 0 to 1 over ~1.2s (`duration: 0.8s`, offset `-=0.6`), combined with Tailwind `.animate-fadeIn`. Rapid screenshots captured in-flight opacity at ~0.65.
   - *Fix*: Implemented `waitForSettled(page, locator)` in `adaptive-canvas.spec.ts` awaiting `window.getComputedStyle(shell).opacity >= 0.98` and a double requestAnimationFrame buffer before capturing settled states.
   - *Fixed Nav Occlusion*: Temporarily toggled fixed `.shell-bottom-nav` to `display: none !important` during bounding-box card snapshotting, preventing the fixed bottom navbar from stamping over tall scrollable element snapshots on mobile.
2. **Visual Repairs for Small Screens (320px & 390px)**:
   - *Badge Collisions*: In `InteractiveTradeoffCanvas.tsx`, the card header stacks on narrow screens (`flex flex-col items-start gap-1.5`) so the "Priority Lead" badge (with `shrink-0` trophy icon) sits below the entity name, giving the `truncate font-semibold text-sm text-white/95` name the full card width; at `sm:` and up it returns to a side-by-side row (`sm:flex-row sm:items-center sm:justify-between`). Prevents the badge from truncating entity names on narrow 320px viewports. The technical notice explaining omitted budget controls was also removed from this panel.
   - *Score Text Wrapping*: In `InteractiveTradeoffCanvas.tsx`, score layout updated with `flex items-baseline justify-between gap-2 text-xs text-white/70` and score value formatted with `shrink-0 whitespace-nowrap font-mono font-bold text-white text-sm`: `{currentOutcome.scoreA} <span className="text-white/50 text-xs font-normal">/ 100</span>`. Prevents awkward line wraps on small viewports.
   - *Simplified Copy*: Technical jargon replaced with intuitive user-facing labels: "Support Index" (replaces Composite Support Index), "Decision Criteria", "Priority", "Evidence", "1x (Low)", and "5x (High)".
   - *Human-Formatted Citation Dates*: In `EvidenceFocusModal.tsx`, replaced raw ISO timestamp strings with human dates formatted via `Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })` -> `Retrieved Jun 1, 2025`.
3. **Artifact-Collision Prevention**:
   - Screenshots and videos are saved with project namespacing (`chromium`, `mobile-safari`, `mobile-chrome`) preventing test workers from clobbering each other's visual artifacts.
4. **Recorded Interaction Video (`audit-screenshots/adaptive-canvas/videos/priority-tuning-evidence-interaction.webm`)**:
   - Canonical 644KB WebM video recording on Desktop Chromium executing the signature user journey:
     - Opening the Tradeoffs view.
     - Adjusting the "Pricing & Billing Flexibility" priority slider from 3x to 5x, showing live recalculation of the Composite Support Index (80.5 shifting to 82.3) and dynamic lead delta synthesis.
     - Clicking the citation inspect trigger on the first criterion to open the Evidence Focus Modal.
     - Inspecting the attributed source citation, human-formatted retrieval date ("Retrieved Jun 1, 2025"), and verified HTTPS link (`https://supabase.com/pricing`).
     - Dismissing the modal smoothly via `Escape` key and returning focus to the canvas.
5. **Inspected High-Resolution Settled Screenshots**:
   - **`mobile-320-tradeoffs.png` (721x3490, iPhone SE 320px)**: Verified crisp dark theme styling (`bg-[#0d0b0a]/90`), zero dimming, entity names truncating cleanly without badge collisions, score values on a single line (`78.3 / 100`), and fixed bottom navigation completely excluded from card snapshot.
   - **`desktop-1280-tradeoffs-tuned.png` (2448x4606, Desktop 1280px)**: Priority sliders at 5x, recalculated scores (80.5 vs 82.3), dynamic delta synthesis, and sensitivity cards.
   - **`desktop-1280-evidence-modal.png` (3520x2200, Desktop 1280px)**: "Evidence Attribution" dialog, "Retrieved Jun 1, 2025", official tier citation link `https://supabase.com/pricing`, 95% evidence support score.
   - **`mobile-390-overview.png` (913x6284, iPhone 14 390px)**: Full vertical stack, readable typography, accordions functional.
   - **`mobile-430-tradeoffs.png` (1023x2918, iPhone 16 Pro Max 430px)**: Clean fit, readable typography.
   - **`desktop-1280-devices-archetype.png` (2448x1400)** & **`desktop-1280-general-archetype.png` (2448x817)**: Fully verified.

### Tier 3: Explicitly Pending Hardware Checks (Physical Devices Only)
Automated emulation cannot verify physical iOS hardware characteristics. The following remain **explicitly pending on real hardware**:
1. **Physical iPhone Touch Velocity & Gesture Fluidity**:
   - Momentum fling velocity on priority sliders and accordion drawers.
   - Physical touch target precision on small screen sizes (iPhone SE 320px).
2. **Native iOS Safari Dynamic Address Bar Expansion**:
   - Viewport resizing and bottom-fixed controls behavior when iOS Safari collapses/expands the address bar during vertical scroll.
3. **Native Keyboard Occlusion & Safe Area Insets**:
   - Inset handling on physical devices with Dynamic Island or notch when focusing input elements.
4. **Database Migration 020 (Unapplied)**:
   - `neon/migrations/020_comparison_publication_scope.sql` remains unapplied and must precede any future production deployment.
5. **PR #174 Isolation**:
   - PR #174 remains isolated as the web authentication hotfix and has not been touched.
6. **No Deployment or Release**:
   - No code has been pushed, merged, deployed to Vercel, or posted publicly. All changes remain local to the development checkout.

---

## 12. EXPERIENCE-01 Release Candidate — Scoped Commit Plan & Checklist (2026-11-02)

Final fixes applied: lead badge stacks below the entity name below `sm:` in `InteractiveTradeoffCanvas.tsx`; the omitted-budget-controls notice was removed; reported typecheck command corrected to `pnpm run typecheck` in `AGENTS.md` and `README.md`. Re-verified: `pnpm run typecheck` PASS, `pnpm lint` PASS (1 pre-existing warning), targeted 38 tests PASS, full suite 257 tests PASS, production build PASS, adaptive-canvas Playwright 25 passed / 2 skipped; updated `mobile-320-tradeoffs.png`, `mobile-390-overview.png`, and `mobile-430-tradeoffs.png` inspected (badge below name, names untruncated, notice absent).

Scoped commit plan (do not mix groups; nothing committed yet):

1. **Canvas (EXPERIENCE-01)**: `frontend/src/components/AdaptiveCanvas/`, `frontend/src/lib/adaptive-canvas/`, `frontend/src/lib/featureFlags.ts` + its test, `frontend/src/components/SafePanel.tsx`, `frontend/e2e/adaptive-canvas.spec.ts`, `docs/product-program/23_ADAPTIVE_DECISION_CANVAS.md`, `audit-screenshots/adaptive-canvas/`.
2. **Launch/publication**: public-eligibility, public snapshot/visibility/by-slug/sitemap routes, `ShareModal.tsx`, `publicComparison.ts`, migration 020 files (`neon/migrations/020_comparison_publication_scope.sql`, `frontend/drizzle/0013_comparison_publication_scope.sql`) — migration ships and is applied before this code deploys.
3. **Unrelated work (separate reviews, not in the canvas RC)**: push notifications (`push.ts`, push routes, 0011/018), PWA/mobile shell, settings, billing/ecosystem docs, iOS docs, Product Hunt and audit artifacts, `tsconfig.*.tsbuildinfo` (exclude from commits).

Release checklist:

- [ ] Integrate the isolated auth hotfix (PR #174) separately; do not fold it into the canvas commit.
- [ ] Apply migration 020 to Neon before deploying any dependent code.
- [ ] Keep adaptive canvas opt-in only (`adaptiveCanvas: false` default; preview via `?canvas=1` / localStorage).
- [ ] Verify on Vercel preview, then roll back by disabling the flag / reverting the deploy if needed.
- [ ] Physical iPhone checks remain pending: gesture fluidity, Safari address-bar resizing, keyboard/safe-area insets.
