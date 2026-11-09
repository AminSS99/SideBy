# SideBy iOS — product, engineering, and builder execution plan

> **Strategy update, 2026-10-19:** The product owner has chosen a Swift 6.4+ / SwiftUI-only, iOS 26+ target. The React Native recommendation below is historical and no longer the target architecture. Preserve its audit and ongoing R3 evidence review; use `SIDEBY_SWIFTUI_26_PRODUCT_PLAN.md` for new implementation planning. Existing B00–B02 acceptance statuses do not change until the incoming report is reviewed.

Revision 5 · 2026-10-13 · Owner: product owner + coordinating AI

## 1. Mandate and definition of success

Build a first-class iPhone experience for source-backed decisions inside the SnapSolve ecosystem. SideBy helps a person compare alternatives, inspect evidence, make a decision, and retain that decision in their shared workspace. The iOS app is a client of the existing product and backend, with the same identity links, workspace authority, subscription, permissions, and durable records.

Aim for Apple editorial and design-award quality through usefulness, craft, inclusion, responsiveness, and trust. Awards and editorial placement are external outcomes, not deliverables we can guarantee. More effects and more features alone will not establish that quality.

**Recommended architecture:** retain React Native + Expo, replace weak interaction foundations, adopt native iOS navigation/materials where supported, and add small native modules only for demonstrated gaps. Do not begin with a SwiftUI rewrite. Native Liquid Glass is already accessible from this stack. Reconsider only after a measured prototype proves an important requirement cannot be achieved reliably.

**Primary journey:** select workspace → enter two alternatives and context → submit a real research job → understand progress → read verdict → inspect cited support and uncertainty → save/organize/share → reopen the same record on the web.

**Delivery boundary for this revision:** this is a code-based audit and execution specification. No app implementation, production deployment, billing change, database migration, device interaction test, or measured performance capture was performed for this document.

## 2. Repository map and source of truth

| Area | Actual location | Builder rule |
| --- | --- | --- |
| React Native app | `/Users/aminsobor/Documents/antigravity/excited-volta` | Main mobile implementation target; package name `sideby-mobile`. |
| SideBy product/web/backend | `/Users/aminsobor/Dev/SideBy` | Read `AGENTS.md`, current backend routes, and deployment checklist before changing contracts. |
| Web/API package | `/Users/aminsobor/Dev/SideBy/frontend` | Vite/React frontend and Vercel API dispatch; `api/_routes` contains current route handlers. |
| Browser phone prototype | `/Users/aminsobor/Dev/SideBy/prototypes/sideby-ios-black-titanium` | Visual reference only; it has its own `AGENTS.md`. It is not the native app. |
| SnapSolve repository | `/Users/aminsobor/Dev/SnapSolve` | Candidate ecosystem authority implementation; inspect current route/config ownership before edits. No full Core audit performed here. |
| This plan and coordination records | `/Users/aminsobor/Dev/SideBy/docs/ios` | Canonical plan, builder instructions, task state, and returned evidence. |

Priority when sources disagree: current code and verified runtime behavior → `AGENTS.md` / current deployment configuration → current ecosystem launch gates → older roadmaps. `SNAPSOLVE_MASTER_PLAN.md` explicitly marks itself historical for launch configuration. Do not infer current infrastructure from its old expansion plans.

Preserve the existing mobile and web working trees. Mobile currently has almost all application files untracked, including `.env`; its Git history shows only an initial commit. The web repository also has extensive existing changes. A fresh worktree from HEAD will not include those uncommitted files. Do not reset, clean, overwrite, blindly stash, or run `git add .`. The first builder must establish a reviewed source baseline without committing secrets. Add `.env` protection while retaining `.env.example`.

## 3. Original observed baseline (revision 1; retained as history)

Read: mobile routes/providers/API/schema/theme/components/tests/Maestro flows, web agent guide, current workspace/ecosystem/comparison route implementations, ecosystem launch plan. Source paths below are relative to the mobile root unless prefixed `web:`.

| Priority | Finding and evidence | Consequence / required response |
| --- | --- | --- |
| P0 | `src/api/comparisons.ts` synthesizes completed jobs, scores, winners, confidence, and invented source URLs when creation fails. Failed detail fetch can return an unrelated demo. Follow-up failure produces an unsupported answer. | Remove production fallback fabrication before polishing. Failed research must remain failed; examples need an explicit isolated mode and persistent label. |
| P0 | History falls back to demos even on an authentic empty response; `sources.ts` inserts demo sources; `usage.ts` turns failures into apparently available free quota. | Distinguish empty, unavailable, offline cache, and examples. Never imply known entitlement or remaining quota when resolution failed. |
| P0 | `QueryProvider.tsx` uses one global persistence key; history/sources/usage/detail keys contain no user/workspace identity. Local jobs also use one storage key. | Risk of showing prior-account/workspace data; no exploit was executed. Scope storage and keys, cancel in-flight requests, clear sensitive state on sign-out/switch/revocation. |
| P0 | `toggleFavorite` and `submitFeedback` return `true` without a request; export ignores JSON format and constructs Markdown locally. | Implement real existing server contracts and confirmed state/rollback; distinguish a local share from server export. |
| P1 | No mobile workspace/session/entitlement provider is present. Creation submits only `query` though backend accepts workspace/project IDs. | Add ecosystem context before claiming one-workspace behavior. Verify local-to-canonical workspace mapping. |
| P1 | `LiquidGlass.tsx` and `GlassSurface.tsx` already use `expo-glass-effect` with availability checks, plus blur fallback. They also add dark fills/gradients/borders. | Glass is present in code, but appearance and hierarchy need a device review. Consolidate material policy; reduce decorative layers and glass on reading surfaces. |
| P1 | Active tab layout uses `expo-router/ui` with `expo-glass-tabs`; `CustomTabBar.tsx` is a separate implementation not imported by that layout. | Audit active dependency behavior and compare against Expo Router native tabs. Do not spend time polishing an inactive bar. |
| P1 | `ContenderComparisonScrubber.tsx` translates a divider; the two fixed-width evidence wings do not change with its position. It has generic default advantage copy. | Give manipulation a real information outcome or remove it. Never default to unsupported research claims. |
| P1 | Compare screen and research orb start indefinite `withRepeat` loops without explicit cancellation in those effects. Reduced-motion handling exists in some components. | Centralize motion policy and stop work on blur/background/reduced-motion changes; profile energy impact before asserting a leak or frame problem. |
| P1 | Source aggregation fetches up to ten comparison details serially and covers a limited slice of history. | Prefer an authorized paginated source query; interim bounded concurrency and cache reuse. Disclose scope instead of calling a partial list global. |
| P1 | `app.json` forces dark mode and disables tablet support. Typography includes many small uppercase captions. History/source content uses fixed 120pt bottom padding. | Add semantic themes, content-size testing, and measured inset policy. Verify keyboard and dock overlap on devices. iPad is an explicit later decision. |
| P1 | `api/client.ts` accepts absolute endpoints while attaching the auth token, swallows token errors, lacks built-in timeout, and drops rate-limit headers. | Restrict authenticated requests to trusted API origin; fail explicitly; carry cancellation, error codes, and retry timing. No exploit was executed. |
| P1 | Sentry/PostHog dependencies are installed; no initialization/use found in the audited `app`/`src` search. | Verify config and introduce privacy-conscious runtime observability rather than treating installed packages as telemetry. |
| P1 | Maestro selectors reference older labels, and sign-in flow embeds a test-looking password. | Use stable IDs and injected test credentials. Existing flow files do not prove current journeys pass. |
| P2 | New York font selection and Clerk legacy Metro alias need runtime verification. | Record actual font rendering and auth compatibility; remove workarounds only after a verified replacement. |

### Checks actually executed

| Check | Result on 2026-10-09 |
| --- | --- |
| `pnpm typecheck` in mobile | Passed. |
| `pnpm exec jest --runInBand` in mobile | Passed: 4 suites, 14 tests. These are local tests/fixtures, not live-backend certification. |
| `pnpm exec expo install --check` | Failed compatibility check: patch drift across Expo and modules, including Expo 57.0.20 → expected ~57.0.27 and glass 57.0.1 → ~57.0.4. Recheck at execution time. |
| Toolchain | `xcodebuild -version`: Xcode 27.0, build 27A266a. |
| Initial test invocation | `pnpm test -- --runInBand` forwarded `--` as a test pattern and found no tests. Correct direct invocation above passed. |
| Native build / simulator / physical device / visual review / Instruments / live ecosystem | Not executed. |

Passing types/tests does not close P0 behavior gaps. Existing contract fixtures were not independently established as current live payloads.

### Revision 3 coordinator review update

B01/B02 implementation/design work was submitted, but acceptance is reopened for B00/B01/B02. Current checks pass: TypeScript, 5 Jest suites/45 tests, and Expo package compatibility. Package drift and `.env` ignore protection are improved; `pnpm ios` now invokes `expo run:ios`. The original findings above are historic, not a claim that all original code remains unchanged.

Remaining blockers include successful text/Markdown decoding, refresh/retry acknowledgement handling, schema/usage truthfulness, authoritative and race-safe mutations, complete cancellation, explicit examples and partial-source states. The submitted screen spec conflicts with the approved three-tab/two-input/semantic-theme/native-glass approach. Supplied simulator PNG is blank; existing logs show build failure, and no reviewed source manifest was supplied. Simulator review inventory shows iOS 27.0; target 17.0 does not establish runtime 17.0.

Use `reviews/2026-10-09_B01_B02_REVIEW.md` for exact evidence and `NEXT_BUILDER_INSTRUCTIONS.md` for repair assignments. The submitted report and earlier ledger/spec are archived under `reviews`. Do not start dependent B03 implementation from the builder's self-accepted ledger. B03 discovery/interface proposal can proceed read-only.

### Revision 4 coordinator review update

As of 2026-10-12, the current mobile code passes typecheck and 66 Jest tests. A dated Xcode build log reports success and a simulator screenshot shows the composer, resolving the earlier blank-screen observation. The 117-file hash manifest matches current files. These are meaningful B00/B01 improvements.

Acceptance remains open: the source is still largely untracked, the successful iOS scene/bundle fix lives in ignored generated files, and Expo now flags five patch updates. Account UI can show an unknown quota as “Unlimited”; the Sources UI drops partial-fetch status; favorite/cache behavior lacks screen-level proof; the detail screen overstates source verification; and the design spec still calls a custom bar native tabs and asserts unmeasured AAA contrast. Live staging tenancy/entitlement journeys are unverified. Use `reviews/2026-10-12_CURRENT_WORK_REVIEW.md` and `NEXT_BUILDER_INSTRUCTIONS.md` revision 4 for exact follow-up. Original baseline and revision 3 observations above remain historical evidence.

### Revision 5 coordinator review update

As of 2026-10-13, typecheck, 93 Jest tests, and Expo compatibility pass. A 78-file source archive matches its hash manifest, a build log reports success, and an unobstructed simulator screenshot shows the composer. The plugin and code changes close several revision 4 gaps, but its post-change clean generated build was not rerun. Usage still shows “Active” for a known inactive backend status, staging favorite/export/entitlement journeys are unrun, and the native-tabs/device contrast comparison is unrun. The canonical design spec still contains stale material/AAA claims. B00/B01/B02 remain NEEDS_REVISION; use `reviews/2026-10-13_R2_COORDINATOR_REVIEW.md` and `NEXT_BUILDER_INSTRUCTIONS.md` revision 5. Earlier revision sections are historical snapshots.

## 4. Ecosystem architecture and contracts

```text
SideBy iOS (Clerk session, local UI/cache)
  -> authenticated SideBy API (permissions, jobs, quotas, persisted comparisons)
      -> SideBy Neon / Redis / AI and research providers
      -> signed server-to-server SnapSolve Core integration
          -> canonical workspace, membership/product access, plan/entitlements
          -> central subscription lifecycle and ecosystem events
SideBy web -> same SideBy API and records
```

Core signing credentials, database access, AI keys, payment secrets, and Clerk secret keys stay on servers. Mobile receives only public configuration, short-lived user credentials, and authorized views. Email alone never proves identity linkage. A SideBy workspace ID may differ from a canonical SnapSolve workspace ID; model both explicitly and never interchange them in API calls.

The current web guide describes Clerk, Neon/Drizzle, Upstash, Vercel, and SnapSolve Core with central Dodo billing. This plan preserves that authority. It does not assert that every cross-product journey already works.

### Contract inventory to freeze in B01/B03

Inspect `web:frontend/api/[...path].ts`, the handlers listed below, `api/_lib/snapsolve-core.ts`, `db-auth.ts`, and web workspace/auth contexts. Capture redacted staging responses and build adapters from those exact shapes. Do not invent headers, filters, or URLs unsupported by the dispatcher.

| Capability | Current route / code evidence | Mobile action |
| --- | --- | --- |
| Ecosystem context | `POST /api/ecosystem/session`, `_routes/ecosystem-session.ts` | Resolve authenticated linkage/session state; define timeout, unavailable, mismatch, and recovery behavior. |
| Workspaces/projects | `/api/workspaces`, `/api/projects`, `_routes/workspace.ts` | Verify supported methods/query filters; list/select authorized containers, retain local and canonical IDs. |
| Create research | `POST /api/comparisons`, `_routes/comparisons/index.ts` | Send validated query plus authorized `workspaceId`/`projectId`; preserve server ID/status. |
| List/detail | `GET /api/comparisons`, `GET /api/comparisons/:id` | Verify pagination/filter/visibility behavior and legacy result adapters; do not assume workspace filtering exists. |
| Organize/favorite | `POST /api/comparisons/:id/manage` | `{action:'organize', isFavorited, folder?, tags?}`; verify response envelope, authorization, and rollback. |
| Refresh/retry | Same `/manage` route | Explicit user action; real running/failed states and usage invalidation. |
| Follow-up/export | `POST /api/comparisons/:id/actions` | Existing `follow-up` and `export` actions, with `question` or `format`; validate actual response and content type. |
| Feedback | `POST /api/comparisons/:id` | Validated rating 1–5/correction/source report; only acknowledge confirmed persistence. |
| Usage | `GET /api/usage` | Verify entitlement/limit semantics including unlimited and unavailable states; use server reset time. |
| Publishing | `:id/visibility` handler exists | Inspect before exposing public links; explicit user publication and no private fields in public payloads. |
| Source library | Mobile currently derives from histories | Decide whether to extend shared backend with authorized pagination; do not falsely promise an existing endpoint. |
| Billing/account management | Web checkout/portal routes exist | Verify mobile eligibility/presentation before enabling any purchase or external checkout control. |

Required integration scenarios: same record visible on web/mobile; two accounts on one device; two workspaces; owner/member/outsider; revoked member while cached/offline; workspace link unavailable; expired token; quota exhausted; plan changed/cancelled; Core unavailable. Server authorization is mandatory even when UI/cache is scoped.

Cache design: keys begin with stable authenticated user + selected SideBy workspace + project scope + capability/version. Gate queries until auth and workspace resolution are settled. Use a provider boundary that disposes old clients/persisters or an equivalent verified lifecycle. On switching/sign-out, cancel requests before purge/unmount, prevent late responses repopulating old views, and clear follow-up/local draft state. Do not persist usage as authority. Persist only an approved minimal subset of private research; AsyncStorage is not an encrypted document vault. Define retention, offline disclosure, deletion, and revocation policy before shipping private offline briefs.

## 5. iOS product structure and control placement

Keep three top-level destinations initially: **Compare**, **History**, **Sources**. Workspace selection belongs in the top navigation area, with account/settings accessible consistently. Do not add a competing ecosystem navigation dock. A small account destination can expose shared plan status and access to other products through verified handoff links.

| Screen | Layout and controls | Essential states |
| --- | --- | --- |
| First run / sign-in | Explain source-backed decisions in one sentence; native-feeling auth; restore intended destination after login. Explicit examples may be explored separately. | Loading auth, credential error, cancellation, recovery, guest/example distinction. |
| Compare | Workspace selector and title; two clear labeled inputs; swap between them; context below; compact optional examples; one prominent Compare action near the task. Stack inputs at larger text sizes. | Draft, focused input, keyboard, invalid/same alternatives, pending submission, quota denial, offline. |
| Research | Preserve compared entities and server job identity; readable current stage, elapsed time, last update, safe exit back to history. Motion is secondary. | Queued/running/completed/failed/stalled where contracts support them; reconnect/resume. No fake exact percent or cancel button without backend support. |
| Verdict | Entity names, concise recommendation, rationale and uncertainty; criteria; expandable evidence; follow-up entry; overflow for export/refresh/report. | Partial evidence, ties, contradictory sources, unavailable confidence, stale result, no winner. |
| Evidence | Claim → supporting passage/summary → source title/domain/date → open source/report. Maintain source-to-claim identifiers. | Missing URL, stale source, broken link, unavailable excerpt. Only supported claims receive verification labels. |
| History | Search/filter, useful dates/project labels, favorite affordance, tap for detail. Swipe actions supplement visible actions. | Real empty, paginating, cached/stale, offline, load failure, refresh, mutation rollback. |
| Sources | Scope visible: workspace/project or recent comparisons; search/filter; source detail and associated comparisons. | Real empty, limited aggregation, pagination, inaccessible/invalid link, partial failure. |
| Account/workspace | Profile, workspace/role, shared plan/usage, appearance/accessibility settings, support/privacy/deletion, sign-out. | Core unavailable, no memberships, sync pending, revoked access, unknown usage. |
| Sheets | Native form/action sheets for edit, follow-up, brief actions; label/close and appropriate detents. | Keyboard growth, scroll to focused field, interactive dismissal, unsaved edits, large text. |

Placement rules: one owner for each safe-area inset; calculate scroll/footer clearance from actual navigation geometry, not universal 120pt padding. Keep last list row, action, and source reachable above dock/home indicator. Keyboard-visible actions clear the keyboard without double-applying its inset. Do not create fake status/home bars inside the native app. Preserve native swipe-back, scroll-to-top, interruption, and sheet-dismiss behavior. Target at least 44×44pt interactive hit areas, including small icons. Avoid multiple prominent CTAs on one screen.

Typography/theme: system body styles and semantic roles, comfortable reading sizes, dynamic scaling, multiline layout, and no fixed-height text cards at accessibility sizes. Validate the actual serif font rather than assuming a font name resolves. Keep copper/cyan as consistent A/B accents, with text/shape labels conveying the same distinction. Add system/light/dark support with semantic surface/text/separator colors. Reserve texture for subtle branding where it does not compete with evidence.

## 6. Native Liquid Glass strategy

Use glass for navigation and floating controls; keep evidence, long text, and data comparison surfaces quiet and readable. This matches Apple's content/control hierarchy; see [Apple Liquid Glass overview](https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass) and [adoption guidance](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass).

1. Consolidate `LiquidGlass` and `GlassSurface` behind one material policy with explicit roles: navigation/control/material fallback/opaque content. Remove unsupported claims that gradients implement optical refraction.
2. Prefer system native tabs/navigation/sheets where the installed Expo stack supports required behavior. Spike Expo Router native tabs against the active `expo-glass-tabs` route before replacement. Preserve routes, selected/reselected behavior, scroll restoration, safe area, labels, and deep links.
3. For the installed SDK 57 family, verify `expo-router/unstable-native-tabs` against installed exports/types. Current latest docs also describe SDK 58's `expo-router/native-tabs`; do not paste a newer import into this app. See [Expo native tabs](https://docs.expo.dev/router/advanced/native-tabs/).
4. For custom controls use actual `expo-glass-effect` availability checks and native effect; fallback to a readable platform material or opaque surface. Capability checks must avoid crashes and respect accessibility. Where supported, group adjacent custom effects with `GlassContainer` rather than stacking unrelated overlays. See [Expo GlassEffect](https://docs.expo.dev/versions/latest/sdk/glass-effect/).
5. Remove excessive dark tint/gradient/shadow layers after comparing on device. Test content moving under glass; a screenshot of an opaque dark rectangle cannot establish dynamic glass quality.
6. Test tab/screen fade animations containing glass: Expo documents that zero opacity on glass or a parent can prevent rendering. Use supported native effect animation or a verified composition, after checking installed version support.
7. Honor Reduce Transparency and Increase Contrast with explicit legible material policy and runtime updates. Reduce Motion uses stable transitions. Verify iOS 26+ and a supported pre-26 release if that remains within the chosen deployment target.
8. Small native SwiftUI/UIKit modules are an escalation path for a bounded platform capability. Document module API, availability guards, fallback, cleanup, and build ownership. SwiftUI `glassEffect` snippets are not TSX components.

Choose minimum OS after dependency/toolchain validation and product reach analysis. Do not silently raise it to force glass. Confirm behavior on the current shipping OS as well as the iOS 26 baseline.

## 7. Motion and haptic specification

Every animation must explain causality, spatial relationship, direct manipulation, or progress. Start with existing Reanimated/gesture infrastructure. Do not add Skia, another animation engine, or shader effects without a measured requirement.

| Interaction | Desired behavior | Reduced motion / fallback | Completion criterion |
| --- | --- | --- | --- |
| Press | Subtle scale/tint, immediate acknowledgement, cancellable drag | Tint/state change | No action on cancelled press; one haptic maximum for intended action. |
| Swap A/B | Short spatial exchange with labels/values staying associated; preserve context/focus intentionally | Instant swap | Values actually swap; rapid taps cannot desynchronize labels and data. |
| Tab / push / back | Native navigation behavior and interruptible transitions | Platform reduced-motion behavior | No doubled navigation, broken back gesture, lost tab state, or disappearing glass. |
| Research | One restrained stage transition based on real server updates | Static stage and textual status | Stop loops offscreen/background/completion; never animate false completion. |
| Verdict arrival | Reveal summary before optional detail; small hierarchy cue | Immediate content | No repeated celebration on polling/cache refresh; focus announcement once. |
| Evidence expansion | Smooth local expansion preserving reading position | Instant expansion | No overlap, scroll jump, truncated text, or focus loss. |
| Comparison control | Change active criterion/evidence focus or proportion with explicit semantics | Buttons/segmented selection | Visible information changes with input; VoiceOver equivalent; vertical scroll wins when appropriate. |
| History swipe | Native-feeling reveal, clear confirmation and rollback if needed | Visible menu buttons | Permissions enforced and server failure restores state. |
| Sheet/keyboard | Native presentation and interactive dismissal | Platform behavior | Focused input and submit remain visible through keyboard/content-size changes. |

Initial tuning proposal: press response ~80–140ms; local disclosure ~180–280ms; swaps ~220–320ms. Springs use existing tokens where suitable; numbers are hypotheses, not performance measurements. Avoid global entrance cascades and animation on every polling update. Prefer transform/opacity for ordinary content; glass opacity has the special caveat above. Avoid per-frame React state or per-pixel JS haptics. Throttle haptics by semantic milestones; do not buzz on every scroll or trigger both wrapper and handler feedback.

Create a shared motion/accessibility hook combining screen focus, AppState, Reduce Motion, and user preference. Cancel running shared-value animations on policy changes/unmount and reset to stable states. Check live setting changes rather than only launch defaults.

## 8. Performance, reliability, and observability

Proposed initial budgets, to ratify against a real Release-build baseline:

| Measure | Initial target | Method |
| --- | --- | --- |
| Input/press acknowledgement | p95 under 100ms locally | Device recording/signposts; separate network time. |
| Cold start to usable local shell | p95 under 2s on selected oldest supported test device | At least 10 Release launches; report splash and auth/network separately. |
| Core scroll/gesture workload | Sustain display cadence with <1% missed frame opportunities in a defined 30s script | Instruments on 60Hz and ProMotion hardware; respect adaptive refresh/Low Power Mode. |
| Frame workload | Aim within 16.7ms at 60Hz / 8.3ms at 120Hz when active | CPU/GPU/hitch evidence; these are frame budgets, not guaranteed refresh rates. |
| Memory | No monotonic retained-memory growth after 20 compare/detail/history cycles | Allocations/Leaks and settled checkpoints; set absolute cap after baseline. |
| Idle/background | No decorative loop or foreground polling after blur/background | Energy/CPU/network trace. |
| Network resilience | One user submission produces one intended job despite double tap/reconnect | Integration tests and server IDs; server idempotency contract required for safe retry. |
| Source library | Bounded work and stable pagination | Network trace/query cache; no sequential detail waterfall across a large library. |

Use physical devices and Release builds for acceptance. Simulator/Debug numbers are diagnostic only. Record device, OS, build SHA/patch, thermal state, Low Power Mode, dataset, network profile, script, sample count, and p50/p95. Keep AI research latency separate from UI latency; show server stages rather than promising instant research.

Preserve existing FlatList virtualization in history/sources. Profile long detail documents before switching to SectionList/FlatList. Use stable IDs, bounded page sizes, cache reuse, cancellation, and image downsampling as applicable. Avoid assuming memoization everywhere is an optimization. Wire TanStack online/focus handling to verified NetInfo reachability/AppState and gate queries on identity readiness. Current running-job polling already checks offline/background; extend only where evidence shows gaps, with bounded backoff/jitter and terminal-state stop.

Add request timeouts, cancellation, Retry-After handling, and structured errors without automatic expensive mutation replay. Never treat validation/schema/auth failure as usable research. Unknown server shapes should trigger a recoverable compatibility state and redacted diagnostics.

Initialize Sentry/PostHog only with approved configuration and privacy settings. Capture timings, job-stage failures, error codes, app version, and anonymous/appropriate tenant correlation. Exclude tokens, private query text, evidence excerpts, email, and payment details by default. Suggested funnel: draft started → real job accepted → completed → evidence opened → decision saved. Derive success from persisted server events, not button taps. Define error boundary, crash recovery, support route, and sensitive-log redaction.

## 9. Feature sequencing

| Priority | Scope | Dependency / value |
| --- | --- | --- |
| P0 | Honest research states, real persistence, scoped identity/cache, shared workspace integration | Makes core product trustworthy. |
| P1 | Native navigation/material policy, keyboard/insets, themes, Dynamic Type/VoiceOver, useful motion, measurable performance | Establishes daily-use craft and accessibility. |
| P1 | Real favorites/folders/tags, scoped search, citations, source reports, Markdown/JSON export, stable deep-link reopening | Completes decision workflow using existing contracts where supported. |
| P2 | Decision notes/briefs, version history and diffs, freshness/refresh indicators, project organization | Inspect existing backend notes/version/diff contracts before adding new storage. |
| P2 | Universal Links/web handoff, Share Extension intake, Spotlight/App Intents/Shortcuts for saved decisions | Each needs scoped authorization, privacy, native build validation, and an independently useful journey. |
| P2 | Opt-in research completion notifications, optional Live Activity | Requires real job event delivery/APNs, background/privacy review, no invented progress; separate from web PWA push. |
| P3 | Widgets, richer collaborative decision review, iPad layouts, selective cross-product handoff | Prioritize only after retention/workflow evidence. Widgets must avoid exposing private briefs on lock screen by default. |
| Deferred | Cosmetic rewards/ranks, omnipresent particles, 3D orbs, redundant dashboards, mobile-specific subscriptions | Do not compete with decision usefulness or duplicate ecosystem authorities. |

Choose P2 work based on observed repeated use and user feedback. No award-directed feature checklist should expand scope before P0/P1 pass.

## 10. Builder team and dependency graph

The coordinating AI maintains this plan and the ledger; builders implement bounded tickets. Human owner forwards reports and chooses material product tradeoffs. Builders do not deploy, alter billing, run production migrations, or publish public content as a side effect of a UI ticket.

| ID | Owner role | Assignment and file ownership | Depends on | Acceptance gate |
| --- | --- | --- | --- | --- |
| B00 | Runtime/build builder | Mobile baseline, `.gitignore`, package/lock compatibility, test tooling, development-build reproducibility | None | Reviewed source inventory; no secrets committed; repeatable install/types/tests/native build evidence. |
| B01 | API/trust builder | Mobile `src/api`, schemas/adapters/API tests; remove fake success; contract inventory | B00 | Failure/empty/schema/auth/quota tests; no silent demo fallback; real favorites/feedback/export verified. |
| B02 | Product designer | Screen/state inventory and design specification/screenshots; no production code edits | B00 baseline | Compare→evidence journey, material hierarchy, small/large text, light/dark, all key states specified. |
| B03 | Ecosystem builder | Mobile auth/query/network providers and new workspace context; coordinated backend contract changes only | B01 inventory | Two-account/two-workspace isolation, revocation, server access tests, shared record on web/mobile. |
| B04 | Native shell builder | Mobile root/tab layouts, common material/navigation components, semantic themes | B00, B02, B03 context interface | Native-tab spike decision, correct insets/keyboard, glass/fallback/accessibility device evidence. |
| B05 | Interaction builder | Compare/history/sources/detail components and motion/haptics; consumes frozen API/provider/material interfaces | B01, B02, B03, B04 | Useful real interactions; cancellation/reduced-motion/scroll/VoiceOver parity; no fabricated copy. |
| B06 | Quality/performance builder | Tests/Maestro, Release profiling, accessibility matrix, telemetry validation | Integrated B01–B05 | Recorded budgets and full journey results; fixes assigned by root cause. |
| B07 | Release builder | Release configuration/docs/assets and candidate verification | B06, no P0/P1 blockers | Signed candidate, privacy/account lifecycle, entitlement and purchase-policy review, rollback/recovery evidence. |

B01 and B02 can run concurrently after baseline, but shared edits must wait for interface ownership. B04/B05 must not simultaneously rewrite the same screens or theme files. Use separate tracked patches/branches only after B00 captures the current application source. Assign one integrator for shared files; do not merge by copying whole directories.

Acceptance requires source diff + tests + relevant runtime evidence. A builder's statement of completion alone does not close a ticket.

## 11. Release and quality gates

- No fabricated production research, claims, confidence, citations, usage, or mutation acknowledgement.
- Canonical ecosystem workspace/plan authority preserved; server permissions tested; no cross-account/cache leakage; stale paid status cannot grant access.
- One complete real staging journey works on web and iPhone with the same persisted record. Test error/retry/expired-session behavior and broken sources as well as the happy path.
- Compare/history/sources/detail/account fit small/large phones, home indicator, keyboard, large text, and long localized strings. Do not declare language support without translation QA.
- VoiceOver order, meaningful labels, adjustable/alternative comparison controls, accessible sheets/errors, reduced motion/transparency, contrast, and non-color distinctions pass.
- iOS 26 native glass and current shipping OS behavior verified; older supported OS has a readable fallback. Android/web changes receive smoke coverage if retained targets.
- Release profiling meets agreed budgets or documents accepted tradeoffs with evidence; no known major crash, privacy, auth, data-integrity, or blocked-primary-journey defect remains.
- Account deletion/recovery, privacy policy, support, data export/retention, and permission-purpose copy are real and reachable. Only request permissions for implemented user benefits.
- One ecosystem subscription remains the authority. Before implementing a purchase/paywall/external checkout journey, verify current storefront-specific App Store rules and decide whether native purchases are needed and how receipts map to Core. Do not assume web Dodo checkout is universally valid in an iOS app. See [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), especially payments and account rules; this is a release investigation, not a legal conclusion.
- Store screenshots/icon/preview show actual shipped interactions and accurately labeled examples; no award claims. Prepare editorial story around evidence-driven decisions and native craft after quality gates pass.

Rollback: tag a verified candidate, retain prior signed build/configuration and migration compatibility, use staged distribution, and document disabling expensive research or optional visual features. Native module changes need a rebuilt binary; an OTA update must not assume unavailable native capabilities. Define runtime-version/update policy before enabling OTA delivery.

## 12. Coordination loop and unresolved decisions

Read `BUILDER_RUNBOOK.md` for commands/prompts and `EXECUTION_LEDGER.md` for status/report format. On each returned builder report the coordinating AI must inspect evidence, identify contract conflicts/regressions, update ticket state and this plan's revision/change log, and issue the next bounded instruction. Preserve historic evidence; supersede it rather than silently rewriting results.

Outstanding decisions are discovery tasks, not permission blockers for code inspection: source baseline ownership; minimum OS/device matrix; canonical/local workspace mapping and server filter support; private offline data policy; example-mode scope; native tabs vs existing dependency; exact shared entitlement semantics; mobile purchase model; notification value; performance budgets after baseline. The relevant builder supplies a recommendation and evidence. Escalate only product/irreversible changes that need the owner.

### Change log

- Revision 1, 2026-10-09: created from code audit and local checks; established P0 trust/ecosystem work before native polish, with builder sequence and evidence gates. Implementation tickets remain open.

- Revision 3, 2026-10-09: coordinator reviewed submitted B01/B02 report and B00 artifacts; verified passing local gates, reopened acceptance on concrete gaps, preserved submitted evidence, and issued B00-R1/B01-R1/B02-R1 instructions. Builder ledger revision 2 was not coordinator acceptance.

- Revision 4, 2026-10-12: independently reran 66 tests/typecheck/Expo check, inspected build and rendered UI evidence, verified 117 manifest hashes, and narrowed B00/B01/B02 follow-up to reproducibility, honest UI states, and platform validation.
