# SideBy launch progress — 13 November 2026

This is a focused launch-readiness update, not certification of every feature or a complete security audit. The changes below are local and have not been deployed by this pass.

## Fixed in this pass

- Authentication preserves the selected comparison visibly through sign-in and signup. A shared destination parser confines continuation to actual `/app` routes, normalizes paths, and rejects external destinations, backslashes, control characters, and misleading prefixes such as `/application`.
- Clerk receives the validated continuation as its forced redirect. Already signed-in visitors use the same destination rules.
- Missing or unavailable authentication renders a visitor-facing recovery panel, with retry and exploration actions. Provider setup instructions stay out of the product flow. Email/password labels have improved contrast and readability.
- Framer Motion components now share the user's reduced-motion preference. The decorative authentication canvas skips drawing on mobile and with reduced motion, pauses when the document is hidden, and caps pixel density at 2.
- The public eligibility endpoint validates its configurable global cap as a nonnegative safe integer. Malformed settings fall back to 60 rather than silently bypassing admission checks. Zero remains a deliberate stop.
- Public validation failures no longer return internal provider/store exception messages. Store unavailability returns a retryable 503.
- Compatible Browserslist and transitive Zod patches are pinned through pnpm overrides. The direct Zod 3 dependency remains unchanged because its AI schema adapter requires a planned migration.
- Removed the obsolete, tracked `frontend/package-lock.json`. CI and the README use pnpm and its committed lockfile. Removing a stale lockfile does not itself fix vulnerabilities in the installed dependency graph.
- Hardened client IP extraction (`route-guard.ts`, `comparisons/validate.ts`, `consent.ts`, `integrations/slack.ts`) to prefer platform-set headers (`x-vercel-forwarded-for`, `x-real-ip`, `cf-connecting-ip`) over caller-spoofable `x-forwarded-for`.
- Fixed cross-tenant analytics leak in `GET /api/usage?type=quality` (`usage.ts`): org admins now require an active `orgId` and every query filters strictly to `comparisons.clerkOrgId`; unscoped global telemetry is restricted to `SIDEBY_PLATFORM_ADMIN_USER_IDS`.
- Moved `requireAuth` ahead of `withRateLimit` in `POST /api/chat` (`chat.ts`) when Clerk auth is enabled so unauthenticated requests cannot burn rate-limit storage before receiving `401`.
- Capped active unrevoked API keys to 20 per user/org (`api-keys.ts`) and sanitized `Content-Disposition` export filenames (`comparisons/[id]/actions.ts`).
- Reduced mass-launch polling & DB read amplification: skipped `loadPublishEvidence` in `GET /api/comparisons/:id` until `status === "completed"` with a result, added progressive backoff + jitter and visibility pausing to `ComparisonDetailPage.tsx`, and slowed hidden-tab polling to 4.5s visibility-gated checks in `ComparisonsPage.tsx`.
- Added a global active comparison concurrency guard (`MAX_GLOBAL_ACTIVE_COMPARISONS`, default 25) and completion-triggered queue drain in `job-engine.ts` (`runComparisonJob` and `drainQueuedComparisonJobs`), keeping deferred jobs in `"queued"` status without incrementing `retryCount`.
- Moved `requireAuth` and Zod validation ahead of `withRateLimit` across `POST /api/comparisons/:id`, `POST /api/comparisons/:id/public-snapshot`, `POST /api/source-feedback`, and `POST /api/knowledge/upload` (plus fixed unauthenticated `401` status handling on `POST /api/comparisons/:id`).
- Added burst rate limits on OpenAI-embedding `POST /api/knowledge/search` (`KNOWLEDGE_SEARCH_RPM`, default 30), Clerk email-sending `POST /api/team` invitations (`TEAM_INVITE_PER_MIN`, default 20), and public DB-heavy `GET /api/comparisons/by-slug/:slug` (`PUBLIC_SLUG_RPM`, default 120, failing open if KV storage is unavailable so public reads stay up).
- Hardened motion/GSAP & accessibility across `FactCard.tsx` (GPU `scaleX` gauge, keyboard/touch-visible Copy button), `EntityFactPanel.tsx`, `DecisionIntelligencePanel.tsx`, `RunTelemetryPanel.tsx`, `RadarChartPanel.tsx`, `Compare.tsx`, `ComparisonDetailPage.tsx`, `AmbientOrbs.tsx` (visibility pause/resume), and `ResearchPreviewCard.tsx` (visibility pause + `aria-live="off"` for decorative ticker).
- Extracted `deriveEvidenceGaps` out of `EvidenceGapPanel.tsx` into `evidenceGaps.ts`, clearing the last ESLint `react-refresh` warning.
- Replaced `lucide-react` across all 102 frontend files with `@/components/icons` (`BespokeIcons.tsx` + `@phosphor-icons/react`), crafting 10 editorial duotone SVG marks (`Sparkles`, `WandSparkles`, `GitCompare`, `GitCompareArrows`, `Scale`, `Bot`, `SearchCheck`, `FileCheck2`, `BookOpenCheck`, `ChartNoAxesCombined`) and removing `lucide-react` from `package.json`.

## Verification

- 431 tests passed across 64 files (`pnpm test`, all mocked unit/integration suites, including `src/components/icons/__tests__/icons.test.tsx`).
- Typecheck (`tsc -b && tsc --noEmit -p api/tsconfig.json`), lint (`eslint .`: 0 errors, 0 warnings), and production build (`pnpm run build`) passed.
- 24 focused browser checks passed across desktop Chromium, mobile Chromium, and mobile WebKit: comparison input/context, suggestions, exclusions, incomplete inputs, sign-in redirects, signup continuation, external destination rejection, and reduced-motion particles.
- Updated local sign-in recovery UI inspected at 390 and 1440 CSS pixels; no horizontal overflow. Authentication keys were deliberately absent locally to exercise the fallback. This does not mean production authentication is down.
- The live public homepage and sign-in screen were inspected. Google and email authentication controls rendered; no account was signed in and no paid research was initiated during this pass.
- The pnpm production dependency audit changed from 4 high / 13 moderate / 1 low / 0 critical to 1 high / 12 moderate / 1 low / 0 critical. These are advisory counts, not confirmed exploitable app defects. Some findings belong to build tooling pulled into the dependency graph.

## Still needs attention, in priority order

1. **Zod migration.** The remaining high advisory affects direct Zod 3.25.76. Migrate schemas and the output-contract adapter deliberately, with validation tests and real model-output checks; do not force an incompatible major-version override.
2. **Measured research capacity.** No concurrent-generation capacity was measured here. Before broad promotion, use staging to test increasing concurrency, provider throttling, database pressure, recovery after interruption, completion time, and spend. The configured caps are admission budgets, not demonstrated throughput.
3. **Report quality across categories.** Eligibility acceptance is different from producing an accurate report. Recheck fresh TV, phone, car, country, education, and software reports; inspect model/year/region, category-specific criteria, missing evidence, source support, and the resulting verdict. Verify follow-up, export, refresh, retry, and reopening against those results.
4. **Payments and access.** Verify the SnapSolve checkout, portal, entitlement synchronization, cancellation, and rejection of legacy paid-access fallback with dedicated test accounts. These were not exercised here.
5. **Repository release protection.** GitHub reports `main` as unprotected. Select required CI checks, deletion/force-push restrictions, and the appropriate PR policy before relying on a public contribution workflow.
6. **Provider controls.** Confirm previously exposed credentials were revoked and provider-side spending limits are active. Neither revocation nor external budget configuration was verified here.
7. **International landing experience.** The English homepage's product film has Russian on-screen text. English caption tracks exist, but an English visual cut or clearer localization would better serve an international launch.
8. **Deployment verification.** Deploy the reviewed changes and rerun the auth continuation and validation checks against that deployment. Local browser tests do not establish the deployed state.

GitHub showed 143 open dependency alerts before these local changes: 103 against the stale npm lock, 30 against the pnpm lock, 8 against the iOS prototype lock, and 2 against the legacy Java backend. GitHub will reassess only after changes are published and its dependency graph updates. These counts must not be described as 143 production frontend vulnerabilities.
