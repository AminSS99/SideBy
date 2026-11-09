# Progress, evidence and decisions

Last updated: 2026-10-27. This ledger does not upgrade prior reports into current deployment proof.

## Current evidence

| ID | Item | State | Evidence / limit | Next action |
| --- | --- | --- | --- | --- |
| HIST-01 | PWA follow-up and auth-repair release | Remote state verified; not merged | GitHub API on 2026-10-27: PR #165 CLOSED, mergedAt null, closed 2026-10-25; head 62885b9. Current main 7b68aee; production SHA not checked | Prepare authorized repair against current main; do not treat green closed PR as shipped |
| HIST-02 | Migration 019 uniqueness and atomic runner | Historically reported real DB verified | Prior ledger/probes and commit d63d881; no DB contacted this turn | Confirm per intended deployment environment |
| HIST-03 | Physical iPhone auth crash | Pending | Prior render-loop reproduction/fix; no physical-device pass supplied | Same-device signup/sign-in and crash-repro run |
| HIST-04 | Full physical iPhone/PWA QA | Pending | Browser emulation and headless media do not close hardware/keyboard/install checks | Run full hardware checklist |
| PM-001 | Product program | Delivered as local documentation | Strategy, contracts, launch, design, security, scale, thirty feature hypotheses, roadmap and protocol | Review/admit first batch |
| ENG-001 | Static artifact verifier | Implemented, focused tests executed | Five native node regression tests and eight static checks pass on existing local dist; build provenance unknown, no runtime readiness claim | Wire into selected release artifact/CI after path review |
| RES-001 | Primary-source discovery | Initial research complete | Exa + TinyFish, linked official pages, limited sample | User interviews and task-based comparison |
| BASE-001 | Current local working-tree gates | Passed locally | Project/API typecheck, full ESLint and 25 Vitest files / 185 tests passed on this dirty checkout; not current remote-main or browser/device proof | Validate isolated proposed merge separately |

## Decisions

- ADR-P01: Use SnapSolve ecosystem for product language and Core for technical authority; avoid speculative renaming.
- ADR-P02: Keep central billing/workspace/security ownership; product updates deploy independently under versioned contracts.
- ADR-P03: Use mobile-first design assumption pending analytics, with desktop evidence workbench retained.
- ADR-P04: Keep 25 new-feature candidates/month and report actual admitted/shipped count; no count inflation or automatic quality waiver.
- ADR-P05: Reuse existing primitives/animation ownership, inspect selected third-party source rather than importing all libraries.
- ADR-P06: Treat library names “ShotCM” and separate SideBy/Rallia iOS coordination as unresolved naming/context, not installation or rename instructions.

## Top risks

| Risk | Severity | Owner | Mitigation / unblock |
| --- | --- | --- | --- |
| Auth crash still in production | Critical if still deployed | Web release owner | Confirm SHA, same-device proof, safe repair rollout |
| Shared-identity verification provenance | High, review hypothesis | Core + SideBy | Trace email_verified callers/enforcement and test account linking |
| Legacy paid fallback or stale permissions | High | Core + SideBy | Central entitlement/authorization matrix |
| Dirty-tree/release branch drift | High | Release owner | Isolated merge artifact and evidence by SHA |
| Cost blow-up at large cohorts | High | Backend/operations | Admission, budget stop, durable workers and provider quotas |
| UI effects hurt iPhone responsiveness | Medium | Design/web | Measured motion and static fallback |
| Monthly feature quota exceeds capacity | High | Product owner | Candidate slate, estimates, work-in-progress caps and transparent shortfall |
| Competing undocumented roadmaps | Medium | Product owner | This index links authorities; archive only after reconciliation |

## Append after every execution

Date; batch ID; expected user outcome; actual files/commits; environment/SHA; executed checks; results; evidence; user-visible change; cost impact; unresolved risk; roadmap impact; next batch. Append actual facts, not automatic “all complete” claims.

## 2026-10-27: current release discrepancy and local auth increment

Read-only GitHub/API and remote-ref checks establish PR #165 is closed **without merge**, head `62885b9a6f6fffc44884e056cfaaea87655cfa72`; remote main is `7b68aee771453cd970a6f528992cd328b345d02e`. The last two validate runs on the old PR head succeeded on October 19; they are historical results for that head. Source at current remote main still computes the live user with cachedUser in its memo dependencies, unconditionally sets cachedUser from that object, and constructs a fresh session object. This is source evidence of the known render-loop pattern, not a new physical-device reproduction or current-production inspection.

Local d63d881 already contains the cached-user breaker, but missed stable session identity. Added identity memoization by user ID and restored the prior regression suite in a new local test file. Before patch: 1 failed/3 passed (session-reference test). After patch: 4/4 passed; targeted ESLint passed. Both halves must accompany any repair against remote main. This local increment alone is not a complete remote-main hotfix. No commits, pushes, migrations or deployments performed.

Validation update: `pnpm run typecheck`, `pnpm lint`, and `pnpm test` passed in the local frontend checkout (25 files, 185 tests). Five native artifact-checker regression cases passed separately. Documentation link verification found zero missing local links; thirty feature cards are present. Browser E2E and physical-device checks were not executed for this increment. Existing ErrorBoundary tests emit expected simulated chunk-error diagnostics while passing.

Fresh production-mode Vite build with `VITE_ENABLE_TEST_AUTH=false` passed into a temporary directory; the new static checker passed all eight checks on that artifact. Workbox reported 73 precache entries / 2797.16 KiB. Temporary build cleaned up. This bypassed sitemap generation deliberately and does not establish live browser/auth behavior. See [dated validation](13_VALIDATION_2026-10-27.md).

## 2026-10-27: WEB-UI-001 — development continues with testing deferred

User explicitly instructed proceeding with development without testing for now. Implemented mobile marketing menu, a shared bottom notice layout, measured toast clearance, and portal-based cookie settings. Preserved existing transitions/dark palette and unrelated working-tree changes. Status: **implemented locally, unverified**. No tests, typecheck, lint, build, browser or physical-device checks were run for this UI batch. Previous green results do not apply to it. No commit, push, merge, migration or deployment performed. See [batch record](14_MOBILE_NAVIGATION_AND_NOTICES.md) for deferred verification.

## 2026-10-27: larger batch cadence

User requested faster development through large tasks rather than step-by-step handoffs. Added WEB-BATCH-02 with six coordinated work packages and 23 substantial implementation tasks, including four decision-feature extensions. This is an execution brief, not implemented feature work. Testing remains deferred under the existing instruction; no merge/deployment is authorized by this brief.

## 2026-10-27: finishing pass — publication privacy + request isolation (unverified)

Status: **implemented locally, unverified** under the standing deferred-testing instruction. No checks run; nothing committed/pushed/merged/deployed; PR #174 untouched.

Repairs: (1) Publication privacy v2 — eligibility no longer trusts the stored JSON's `provenance` (nothing server-side ever stamped it). Classification now derives only from pipeline-written evidence: completed `ai_runs` + per-fact citations in `comparison_facts` (+ payload agreement, complete verdict, retrievable sources). `loadPublishEvidence` in `sideby.ts` feeds publish (422 + reasons), the detail endpoint (`publishEligibility` shown in the share modal), and every public by-slug read (fail-closed 404; fixtures only via trusted hash + cited claims; served `provenance` server-set). (2) Request isolation v2 — in-flight GET sharing is anonymous-only: authenticated reads never coalesce (token fingerprinting removed), credential errors never enter a shared bucket (own request, own outcome). Adversarial suites authored, unexecuted: `api/_lib/__tests__/public-eligibility.test.ts`, `src/lib/__tests__/api-identity-isolation.test.ts`. Matrix + consolidated checklist updated in [19_WEB_BATCH_04](19_WEB_BATCH_04.md).

Residuals (documented in code): anonymous in-flight window (a caller authenticating mid-flight may receive the in-flight anonymous response); pre-gate public records failing classification stop serving (intended); CDN effect of no-store unverified.

## 2026-10-27: WEB-BATCH-04 — implementation pass (unverified)

Status: **implemented locally, unverified** under the standing deferred-testing instruction. No tests, typechecks, lint, builds, browser/device checks, or migrations run. Nothing committed, pushed, merged, or deployed; PR #174 untouched.

Implemented: public projection v2 (fact entity attribution restored; recursive verdict/taxonomy schemas with safe-URL/date/finite validation); server-authoritative publish eligibility (researched provenance + retrievable citations + complete verdict + sources; 422 with reasons; unknown provenance 404 at by-slug); noncached public reads (`private, no-store`) with copy matching; apiFetch coalescing narrowed to provably equivalent GETs with principal-fingerprint keys (signal/header/credential/Request reads are their own); Request method/header/CSRF semantics; React Query mutations no longer auto-retry; `useKeyboardInset` is now an editable-gated, rAF-coalesced estimated-occlusion estimate, shared via `<KeyboardSpacer />` on composer, follow-ups, uploads, settings, team, billing; receipt/matrix/quota data moved to shared react-query ownership (one request per comparison across mounted trees); choices freeze entity names at save with a validated response + sync lock; ScoreDetailDrawer audited version-consistent (no change). Completion matrix + deferred validation: [19_WEB_BATCH_04](19_WEB_BATCH_04.md). Ruling: server eligibility gates NEW publishes; already-public records are served through the v2 allowlist with provenance exposed, and unknown-origin rows stop being public.

Remaining explicit gaps: gap-derivation regression test still not authored (projection test updated to v2 instead); `recordedAgainst` remains a string tag; nested-scroll page audit beyond the six adopted forms open; CDN availability effect of no-store unverified in production.

## 2026-10-27: WEB-BATCH-03 — implementation pass (unverified)

Status: **implemented locally, unverified** under the standing deferred-testing instruction. No tests, typecheck, lint, build, browser or device checks were run. No commits, pushes, merges, migrations (none needed — jsonb marker, no schema change), deployments, or PR #174 changes. Both auth-loop fixes preserved.

Repairs vs WEB-BATCH-02 source review: ShareModal no longer publishes implicitly (explicit Publish; Copy/Open disabled while private; state reset on open); now on Radix dialog primitives. Public by-slug serves the shared `public-projection/v1` allowlist projection and fails safe; preview renders the same projection; cache honesty copy + s-maxage 300. Receipt: matrix winners no longer presented as user decisions (explicit choice recording with rationale via authorized endpoint); version binding from the versions API (no guessed labels); separated fetch states with abort + reset. Retries: safe-methods only, abort-aware backoff, no shortened Retry-After. Follow-ups: sync locks, validated responses, live quota from `/api/usage`, stale protection. Gaps: both-sides-absent/uncited/weak/contradiction precision, scores-not-probabilities, illustrative provenance called out. `useKeyboardInset()` primitive applied to composer + follow-up. SafePanel reset keys. One authored-but-unexecuted regression file (`publicComparison.test.ts`). See [17_WEB_BATCH_03](17_WEB_BATCH_03.md) for contracts, release notes and the deferred validation checklist.

Remaining explicit gaps: keyboard primitive not yet applied to uploads/settings/billing/team forms; ScoreDetailDrawer historical staleness unaudited; broader desktop-density/motion work beyond new surfaces untouched; `recordedAgainst` is a string tag, not a foreign key.

## 2026-10-27: WEB-BATCH-02 — implementation pass (unverified)

Status: **implemented locally, unverified** under the standing deferred-testing instruction. No tests, typecheck, lint, build, browser or device checks were run for this batch. No commits, pushes, merges, migrations or deployments performed. PR #174 untouched and still pending same-iPhone verification. Both auth-loop fixes preserved.

Implemented (real behavior, existing contracts):

- A1: `NotFound` now mounts the shared `MarketingNav` (all marketing/legal pages verified to use it; 404 was the gap).
- A2: `ScrollToTop` is navigation-type aware — POP restores per-path positions; PUSH/REPLACE still starts at top.
- A3: `StickyDecisionBar` sits above the coordinated `--sideby-toast-offset` instead of a hardcoded 5.75rem gap.
- A4: prompt and document deletes now require confirmation and surface failure (previously silent unconditional deletes); matrices/team already had confirmations.
- B1/B2: bracket composer labels + 44px targets; two-entity composer gained optional Priorities and Non-negotiables fields, persisted in the accountable draft (register.ts validator extended with typed keys) and folded verbatim into the submitted brief's context segment.
- C1: research loader shows real elapsed time, current server step, a truthful "research runs server-side; page reconciles" note, and a failed-step state that preserves gathered evidence.
- C3: sources show retrieval dates.
- D1: new `DecisionReceiptPanel` (question, context, AI recommendation vs user's recorded decision from saved matrices, evidence links, version/date, copy). User decision is never implied when none is recorded.
- D2: weights panel gains unavailable state (no scoreable dimensions), plain-language delta explanation vs balanced weights, and restore-original-weights. Originals preserved; nothing mutates stored scores.
- D3: new `EvidenceGapPanel` deriving missing/weak/contradictory evidence from the actual record; follow-up questions go through the existing rate-limited follow-up endpoint with usage implications stated; nothing fires automatically.
- D4: ShareModal previously published to a non-existent route (`/api/comparisons/:id/publish`); now uses the real visibility endpoint, shows explicit public/private state with revocation, and previews exactly the public record (verdict, category outcomes, sources) that the public serializer serves. Private notes/uploads are excluded by construction (separate endpoints).
- E1: new reusable `SafePanel` failure containment (Sentry-tagged, retry, no internals in UI), applied to score chart + consensus panels on desktop and mobile.
- E2: `ApiError` carries `Retry-After` (parsed, honored with bounded delay); new `describeApiFailure` unifies offline/timeout/401/403/429/5xx copy; adopted by the gap panel.
- E3: billing page states central SnapSolve authority explicitly; entitlement-load failure is an honest unavailable state with retry (no plan shown, nothing granted or revoked).
- F3: new dialogs/panels carry labels, descriptions, roles; consent dialog audit-verified exemplary.

Audited as already-sound (no change): E4 notification/install states; AppShell entrance (mount-only, reduced-motion aware); consent dialog focus ownership; notice stack coordination from WEB-UI-001.

Partial / not done in this pass: A2 per-form keyboard-reachability audit on every app screen; C2 verdict/desktop density beyond the existing 8/4 layout and TableOfContents; C4 history beyond existing filters/search/favorites (verified present); F1/F2 no additional motion or desktop layout changes beyond A3; D1 receipt version label derives from historical version list (+1) and should be confirmed against the live versioning contract during review.

Deferred validation plan for this batch: typecheck + lint, unit tests (incl. new panel derivation logic), production build, browser checks at 320/390/430px + desktop, share/visibility round-trip against a preview, gap follow-up round-trip with rate-limit state, PWA two-build update re-check, reduced-motion pass, physical iPhone pass (still gated on hardware). New migrations: none authored; no schema change was needed (decision matrices and versions storage already existed).

## 2026-10-27: WEB-BATCH-02 submitted; WEB-BATCH-03 specified

Executor submitted implemented/unverified status with explicit partial packages. Read-only review of receipt, gap follow-up, sharing, public by-slug and retry source found integrity/privacy/retry mismatches; no test or runtime failure reproduction was performed. Added a 21-task finishing batch. Testing remains deferred by the user's existing instruction, and local work is independent of the physical-device gate on PR #174. No merge, deploy or test execution performed during this review.

## 2026-10-27: WEB-BATCH-03 submitted; completion contracts reviewed

Executor reports partial/unverified implementation with no gates run. Read-only source review identified dropped public fact entity, unrestricted nested verdict/taxonomy, missing implemented private-provenance publish guard, cache/revocation copy mismatch, URL-only GET coalescing/cancellation semantics, and keyboard disabled-state handling. Added WEB-BATCH-04 as a large completion brief. No tests, builds, lint, typecheck, browser/device checks, commits, merges or deployments performed in this review.

## 2026-10-30: launch acceleration

User requested faster development ahead of Product Hunt/social launch. Consolidated remaining work into LAUNCH-01: safety boundaries, incomplete existing workflows, private marketing preparation and one validation handoff. Draft launch copy authored without posting. Read-only review confirms generic anonymous coalescing still resolves credentials again at dispatch; completed pipeline telemetry plus citations still does not independently establish public-input privacy. No tests, builds, browser checks, commits, merges, migrations, paid research or deployments performed. Testing remains deferred under the existing instruction.

## 2026-10-30: LAUNCH-01 — consolidated execution completed (unverified)

Status: **implemented locally, unverified** under the standing deferred-testing instruction. No tests, builds, lint, typecheck, browser, or physical-device checks were executed. No commit, push, merge, remote migrations, paid research, or deployments performed; PR #174 (web authentication hotfix) remains separated and untouched pending physical iPhone verification.

Completed in this continuous execution:
- **Track 1 (Safety boundaries)**:
  - Public privacy boundary v3: `public-eligibility.ts` enforces server-authoritative `input_scope = 'public'` for dedicated public snapshots; records derived from private briefs fail closed as `not-public-input` (no regex or field-stripping bypass). Citation correspondence enforces parsed, normalized URL equality (`normalizeCitationUrl`) across protocol, lowercase host (preserving ports via `URL.host`), path, and sorted queries, eliminating substring matching on unrelated domains and preventing different ports from comparing equal. Authored regression suite in `public-eligibility.test.ts` verifying port-isolation and confidential brief input with valid public citations.
  - Credential race in request sharing eliminated: in-flight request coalescing removed from `apiFetch`; requests dispatch independently with caller's own token and retry policy; authored test suite in `api-identity-isolation.test.ts` covering token change before dispatch, cookie-only identity, lookup error isolation, and independent cancellation.
- **Track 2 (User journeys & integrity)**:
  - Snapshot generation pipeline & review: In `public-snapshot.ts`, replaced fire-and-forget scheduler with Vercel `waitUntil` matching comparison creation. In `ShareModal.tsx`, prominently displays exact option names extracted from private brief with an explicit approval checkbox and warning before triggering snapshot generation; direct API requests require `{ confirmed: true }`.
  - Mobile/desktop keyboard & layout: Integrated `KeyboardSpacer` into `ChatPage.tsx`; removed duplicate bottom spacer from `<main>` in `AppShell.tsx` to preserve shared layout bottom-nav clearance.
  - History continuation: Added bounded initial window (12 items) with continuation button in `ComparisonsPage.tsx` to prevent unbounded list rendering on mobile while keeping all records accessible.
  - Truthful loader & survival claims: Updated `ResearchLoader.tsx` copy to truthfully describe server research reconciliation and recovery without claiming every job survives every deploy/termination.
  - Decision receipts: Updated `DecisionReceiptPanel.tsx` copy to clearly state point-in-time snapshot references rather than implying a relational database foreign key binding; frozen entity names preserved.
  - Strict server validation of JSONB mutations: Defined explicit supported result contract in `api/_routes/decision-matrices.ts` using `.strict()` (rejecting `.passthrough()` and unknown fields) while explicitly supporting `scoreA`, `scoreB`, `winner`, `recordedAs`, `rationale`, `recordedAgainst`, `choiceEntities`, `scores`, `normalizedScores`, and `categoryWinners`, enabling UI save actions without arbitrary payload injection.
  - Optional-panel isolation: Wrapped all remaining optional workbench panels (`FeatureMatrixPanel`, `DecisionMatrixPanel`, `WatchlistPanel`, `TeamNotesPanel`, `RunTelemetryPanel`, `FollowUpPanel`) in `SafePanel` with stable reset keys across desktop and mobile layouts.
  - Authored missing regression coverage: Created `frontend/src/components/Comparison/__tests__/EvidenceGapPanel.test.ts` with comprehensive unit tests for `deriveEvidenceGaps` across all 5 gap types and clean baselines.
  - Central SnapSolve reconciliation: Reconciled billing and checkout routes to authoritative SnapSolve catalog (`Flow`, `Pulse`, `Core`, `Orbit`); no local paid fallback or silent elevation.
- **Track 3 (Truthful launch assets)**:
  - Authored `docs/product-program/22_LAUNCH_READINESS_AND_ASSETS.md` covering the exact capability matrix vs copy boundaries, deterministic non-sensitive comparison demo fixture (Next.js vs Remix, labeled illustrative), 7 capture targets, availability failure boundaries, calibrated support routing & issue triage, and local Free tier configuration (5 comparisons, 10 follow-ups, 3 refreshes, 10 exports/day) with external Cockpit billing delegation.
- **Track 4 (Consolidated validation handoff)**:
  - Migration 020 recorded as **required and unapplied** (`neon/migrations/020_comparison_publication_scope.sql`). Migration-before-code deployment ordering documented in `DEPLOYMENT.md`, `DEPLOYMENT_CHECKLIST.md`, Document 22, and this ledger to prevent runtime column errors.
  - Corrected validation command instructions: enter `frontend/` once; sequential commands run inside workspace without repeating `cd frontend`; `pnpm run typecheck` covers both Vite app and API serverless routes.
  - Staged combined validation command/fixture matrix ready for future coordinator authorization. Release candidate ready for coordinator review.

## 2026-10-31: EXPERIENCE-01 — Adaptive Decision Canvas implemented (unverified)

Status: **implemented locally, unverified** under standing deferred-testing instruction. No tests, builds, lint, typecheck, browser, or physical-device checks executed. PR #174 (web authentication hotfix) untouched; migration 020 remains unapplied.

Completed in this execution:
- **Presentation Specification (`presentation-spec.ts`)**: Versioned contract (`adaptive-canvas/v1`) specifying archetypes (`software-services`, `products-devices`, `general`), visual modules, supported interactions, and visual emphasis with strict Zod validation. Zero executable code/HTML in specs.
- **Rules-Based Archetype Planner**: Classifies comparison based on structured taxonomy, query keywords, and dimension cues, arranging appropriate modules and highlights.
- **Trade-off & Simulation Engine (`tradeoff-engine.ts`)**: Pure deterministic calculation of composite support indices (0–100, strictly not probabilities), dead-heat detection (< 1.5 pts threshold), plain-language winner shift explanations (`explainWinnerShift`), and multi-scenario sensitivity simulation ("What would change the outcome?").
- **Interactive Canvas UI (`InteractiveTradeoffCanvas.tsx`)**: Priority sliders (1–5x), quick-tunes, live composite index bars, dead-heat notices, delta synthesis, and baseline reset.
- **Outcome Simulator UI (`OutcomeSimulatorPanel.tsx`)**: Sensitivity explorer distinguishing priority re-weighting, assumption testing, and targeted research inquiries.
- **Evidence Focus Modal (`EvidenceFocusModal.tsx`)**: Accessible deep inspection for claims and citations, with responsive `vaul` bottom sheet drawer on mobile and Dialog on desktop, keyboard trap and Escape support, and clear evidence support score labeling.
- **Specialist Matrix (`ArchetypeSpecMatrix.tsx`)**: Architecture & API matrix for software, hardware specs for devices, multi-attribute scorecard for general.
- **Progressive Research Experience**: Enhanced `ResearchLoader.tsx` with explicit Option A vs Option B badges, real wall-clock elapsed time, server step task descriptions, and honest recovery explanations.
- **Feature Flag & Safe Containment**: Implemented zero-dependency `featureFlags.ts` supporting URL, localStorage, and environment variables; wrapped all canvas modules in `SafePanel` with instant toggle back to Classic Workbench.
- **Document 23 & Authored Regression Tests**: Created `docs/product-program/23_ADAPTIVE_DECISION_CANVAS.md`, `presentation-spec.test.ts`, `tradeoff-engine.test.ts`, and `featureFlags.test.ts` (unexecuted).

## 2026-11-01: EXPERIENCE-01 — Combined validation & automated verification executed

Status: **Automated validation PASSED across all suites.** Local working tree verified clean for types, lint, unit tests, production build, and browser E2E. PR #174 (web authentication hotfix) untouched; migration 020 remains unapplied; physical iPhone QA remains explicitly pending on real hardware.

Executed checks & verified results:
1. **TypeScript Compilation**: `pnpm run typecheck` (`tsc -b && tsc --noEmit -p api/tsconfig.json`) exited with code 0. Resolved scoping-helper types using `ComparisonData["dimensions"]` and `ComparisonSource[]`, framer-motion transition typing, SafePanel fallback prop, and API follow-up response shapes.
2. **ESLint**: `pnpm lint` passed with 0 errors across all frontend and API code. Hoisted view mapping in `AdaptiveDecisionCanvas.tsx` to satisfy exhaustive-deps cleanly.
3. **Targeted Regression Suites**: 7 suites / 80 tests passed with code 0:
   - `presentation-spec.test.ts` (13 tests): verified archetype classification with word boundary checks for short keywords, schema validation, module priority ordering, and scoping helpers.
   - `tradeoff-engine.test.ts` (8 tests): verified finite score handling, $[0, 100]$ index clamping, close result threshold wording ($< 1.5$ pts), normalized weighted contributions, and $+10$ pt sensitivity shift.
   - `featureFlags.test.ts` (6 tests): verified default OFF behavior for general users and URL/localStorage opt-in.
   - `public-eligibility.test.ts` (14 tests): verified strict citation URL matching with port preservation (`URL.host`) and confidential brief protection.
   - `api-identity-isolation.test.ts` (7 tests): verified CSRF reset isolation, unshared in-flight requests, and cancellation.
   - `EvidenceGapPanel.test.ts` (4 tests) & `ai-adapter.test.ts` (28 tests): passed cleanly.
4. **Full Unit Test Suite**: `pnpm test` passed 32/32 test files and 257/257 unit tests in Vitest.
5. **Production Build**: `pnpm run build` completed in 4.70s. Sitemap generated (22 URLs), SEO validation passed, and PWA service worker precaching 73 entries (2990.19 KiB). Verified that `canUseTestAuth === false` in compiled production bundles (`rt(void 0) === "true"` inlines `false`).
6. **Playwright E2E Suite (`frontend/e2e/adaptive-canvas.spec.ts`)**: Strengthened suite with 24/24 tests passing across Desktop Chromium (1280x800), Mobile Safari (iPhone 14 emulation 390x844), and Mobile Chrome (Pixel 5):
   - Desktop Priority Tuning: Actively adjusted priority sliders from 3x to 5x with `ArrowRight`, asserted exact `aria-valuenow="5"`, weight pill `"5x"`, and verified mathematical recalculation of Composite Support Index (80.5 baseline shifting to 82.3).
   - Evidence Modal: Non-conditionally triggered citation inspection, verified modal opening, validated authentic HTTP/HTTPS link regex (`toMatch(/^https?:\/\//)`), and verified Escape key dismissal.
   - Round-Trip Weight Survival: Verified tuned weights survive toggling to Classic Workbench and returning to Adaptive Canvas; tested "Restore Baseline" resets slider to 3x and score to baseline.
   - Full Archetype Coverage: Verified all 3 archetypes: `software-services` (`"Software & Architecture"`), `products-devices` (`"Hardware & Specifications"` with extracted unit badges: `2000 nits`, `2050 nits`, `3582 mAh`, `4700 mAh`), and `general` (`"Multi-Criteria Decision"`).
   - Reduced Motion: Verified `prefers-reduced-motion: reduce` sets transitions to $\le 0.01\text{s}$ and snaps score bar widths instantaneously upon keypress.
   - Viewport Containment: Verified iPhone SE (320px), iPhone 14 (390px), and iPhone 16 Pro Max (430px) contain sliders, tabs, and synthesis cards with zero horizontal overflow (`bodyScrollWidth <= windowWidth + 5`).
7. **Visual Inspection**: Inspected 8 locator-scoped screenshots in `audit-screenshots/adaptive-canvas/` covering 320px, 390px, 430px, and 1280px with explicit dark container backgrounds.
8. **Explicitly Pending Hardware Checks**:
   - Physical iPhone hardware testing remains pending (raw touch responsiveness, dynamic address bar collapse/expansion, and native iOS virtual keyboard occlusion).
   - Migration 020 (`neon/migrations/020_comparison_publication_scope.sql`) remains unapplied and must precede any future production deployment.
   - Strictly no commits, pushes, merges, deployments, or public postings were made.
