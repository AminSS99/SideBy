# SideBy next version: premium PWA and iPhone execution guide

Prepared: 2026-10-04
Status: implementation specification; no runtime changes are implied by this document.
Audience: the AI coding agent implementing the next SideBy release.
Repository: `/Users/aminsobor/Dev/SideBy`.

## 1. Mission

Make SideBy feel exceptional as a mobile web app and installed PWA: beautiful, responsive, dependable, and comfortable on iPhones. Preserve the recognizable visual identity and meaningful transitions while reducing unnecessary work. Quality means users can complete source-backed comparisons reliably, understand every state, and recover after interruptions.

This is a concrete engineering brief, not permission to rewrite the product wholesale. Deliver working code and evidence when asked to execute it. Do not stop at recommendations, mockups, or a checklist of proposed work.

### User intent and scope

- Ship a substantially better next version of the existing web application.
- Make iPhone browser and installed usage first-class experiences.
- Improve loading, rendering, interaction, storage, and network behavior.
- Preserve beauty, brand, transitions, citations, and research usefulness.
- Improve accessibility and installation discoverability.
- Maintain desktop and Android functionality.
- Preserve authenticated access, rate limits, billing authority, and data boundaries.

The phrase “we will not include that anymore” did not identify a feature or technology. It is an unresolved exclusion, not authorization to delete a feature. Before removing a capability, ask what it refers to. Continue independent improvements while that decision remains open. Do not infer that animations, billing, push, the extension, offline behavior, or any product route should disappear.

“Greatest PWA ever” is an ambition. Convert it into measured acceptance criteria; do not claim universal compatibility, native parity, or flawless operation without evidence.

## 2. Starting evidence from this checkout

These observations come from source inspection, not from a completed device audit. Recheck the files before modifying them because the working tree contains substantial ongoing changes.

| Area | Existing implementation | Required response |
| --- | --- | --- |
| Build | Vite, React 18, TypeScript, pnpm; SEO generation and validation in production build | Extend the existing toolchain |
| PWA | `frontend/vite.config.ts` uses `vite-plugin-pwa`, injectManifest, prompt registration | Improve existing lifecycle instead of adding a second worker |
| Manifest | `frontend/src/lib/pwa/manifest.ts` is the typed source of truth | Keep manifest generation centralized |
| Worker | `frontend/src/sw.ts` includes precaching, network-only API routing, asset caches, push handlers | Audit route registration and lifecycle in the production build |
| Registration | `frontend/src/lib/pwa/register.ts` has an update store and registration guard | Improve update recovery and observability |
| Installation | `useInstallPrompt.ts` and `InstallAppButton.tsx` depend on a native install event; button explicitly hides on iOS | Add a distinct manual installation help path after platform verification |
| Updates | `UpdatePrompt.tsx` renders a fixed bottom prompt | Integrate safe areas and other bottom surfaces |
| Shell | `AppShell.tsx` has mobile navigation, a bottom navigation animation, sticky header, gradients, GSAP and Framer Motion | Refine existing shell and preserve brand |
| Routes | `App.tsx` already lazy-loads many routes | Profile actual startup dependencies before changing splitting |
| Styling | `globals.css` includes reduced-motion rules and global overflow handling | Audit specificity and fix causes of overflow |
| Automation | `playwright.config.ts` currently configures Desktop Chrome | Add mobile and WebKit coverage with honest limitations |
| Research UI | Existing comparison components cover evidence, matrix, verdict, follow-ups, sources, export | Adapt those components instead of replacing research with decorative cards |
| Billing | AGENTS.md requires the SnapSolve Core entitlement bridge and central Dodo journey | Do not revive legacy local paid-access fallback |

Potential issues to investigate, not confirmed runtime bugs:

1. `sw.ts` passes a matcher and a `NavigationRoute` to `registerRoute`; verify this overload against installed Workbox types and behavior. Correct its routing semantics if invalid.
2. The navigation comment describes network-first behavior, but `createHandlerBoundToURL` serves the precached shell. Align actual policy and comments.
3. API path exclusions need coverage for `/api`, `/api/`, and relevant cross-origin API configuration. Do not allow SPA fallback or asset caching to capture private endpoints.
4. Precache globs include all matching built JavaScript assets; route splitting alone does not guarantee a small installation transfer.
5. Runtime image matching uses file extensions; inspect whether authenticated or signed assets can match.
6. Installation acceptance currently marks standalone true before independently confirming installation. Model accepted prompt and observed installed mode separately.
7. Fixed update prompts may overlap bottom navigation or the keyboard.
8. Global horizontal clipping may conceal layout defects.
9. Existing animation packages include GSAP, Framer Motion, and Motion. Measure actual duplicate runtime cost before consolidation.
10. A portrait manifest orientation is present. Evaluate accessibility and landscape behavior before deciding whether to retain it.

## 3. Rules for the implementing AI

Read root AGENTS.md and any more specific instructions before edits. Inspect git status first. Preserve existing work, including untracked PWA files. Do not reset, clean, overwrite broad files, or regenerate unrelated assets.

Use the existing TypeScript conventions. Avoid `any`. Use `apiFetch` and `buildApiUrl`, Sonner toasts, existing analytics helpers, Drizzle, authenticated route guards, and rate-limit middleware where applicable.

Do not install a framework replacement or introduce a native wrapper as a prerequisite. Do not migrate React, Vite, auth, database, or payment providers for this initiative without a separate justification and authorization.

Keep patches scoped. Make a baseline, implement a coherent phase, verify it, and record evidence. Investigate failing existing checks before blaming new code. Never mark an unrun device test as passed.

Treat current browser support as something to verify against primary documentation during implementation. Feature-detect capabilities at runtime. User-agent hints may tailor installation instructions but must not determine whether core comparison functionality works.

Do not commit credentials, screenshots containing private records, notification endpoints, real emails, or raw AI prompts with sensitive material.

## 4. Deliverables

1. Mobile layout and interaction improvements in the real application.
2. A robust PWA registration, installation, update, and offline lifecycle.
3. A preserved and documented motion system.
4. Performance improvements supported by before/after measurements.
5. Relevant unit, integration, browser, accessibility, and real-device evidence.
6. Release and rollback instructions for worker updates.
7. A final report listing changes, measured outcomes, failures, and limitations.

Suggested supporting documents:

- `docs/PWA_MOBILE_BASELINE.md`: routes, screenshots, network profile, metrics, defects.
- `docs/PWA_MOBILE_QA.md`: scenario results and physical-device observations.
- `docs/PWA_RELEASE_RUNBOOK.md`: update sequence, cache policy, rollback.

Create these as implementation proceeds; do not populate them with fabricated results.

## 5. Design preservation contract

Preserve SideBy's dark premium surfaces, warm accent colors, restrained gradients, strong hierarchy, distinctive research presentation, and existing expressive transitions. Confirm exact tokens from current brand configuration and CSS before choosing values.

Make mobile design deliberate rather than simply compressing desktop:

- Prioritize the user's current task and one primary action per surface.
- Keep verdict, compared entities, and citations easy to discover.
- Use readable spacing, consistent radii, and purposeful separators.
- Prefer fewer simultaneously visible controls over tiny controls.
- Maintain clear distinction between interactive, selected, disabled, and loading states.
- Keep long entity names and workspace labels legible through wrapping or intentional truncation with an accessible full label.
- Avoid making everything a translucent panel; reserve expensive effects for a few meaningful surfaces.
- Never replace real content with repeated placeholder statistics to make screenshots prettier.

Capture before/after screenshots with representative seeded data. Evaluate default, loading, error, empty, long-content, and populated states. Confirm desktop identity remains intact.

## 6. iPhone viewport and layout architecture

### Safe areas

Audit `frontend/index.html` for the viewport declaration and relevant app metadata. Use `viewport-fit=cover` only with proper safe-area handling. Keep user zoom enabled.

Create shared layout tokens for top and bottom safe areas, header height, navigation height, and overlay spacing. Apply each inset once at the owning shell edge. Do not repeatedly add the same inset inside nested components.

Ensure content can scroll beyond every bottom control. Reserve enough space for navigation, safe area, and contextual actions. Make update prompts and toasts participate in a shared overlay arrangement.

Test notched and non-notched layouts, landscape, browser toolbar expansion, installed mode, and devices with large text. No essential action may sit under the home indicator.

### Height and scrolling

Use dynamic viewport units where appropriate with a compatible fallback. Choose intentionally between a document-scrolling page and an app-height surface. Do not put every page in a fixed-height scrolling wrapper.

Prefer a single primary vertical scroll owner. Document why nested scrolling is necessary for a table or modal. Avoid scroll locking the entire document for ordinary navigation.

When a sheet opens, preserve the underlying scroll position. When it closes, restore position without jumping. Test Safari rubber-band behavior before adding broad overscroll rules.

Correct horizontal overflow at its source: flex children need `min-width: 0`; grid tracks need bounded sizing; tables need their own scroller; long URLs need suitable wrapping. Root clipping is not acceptance evidence.

### Keyboard

Make inputs comfortable to read and tap; evaluate at least 16px input text to avoid unwanted focus zoom in the targeted iPhone environments. Keep pinch zoom and accessibility scaling available.

Use `VisualViewport` only if CSS and ordinary document flow cannot solve a measured keyboard defect. Clean up listeners, coalesce updates, and avoid React state updates for every pixel during viewport animation.

Do not equate every viewport height change with a keyboard opening. Toolbars, orientation, and zoom also affect it. Preserve focus and scroll while the keyboard moves.

For a composer, keep input, error text, and submit action reachable. Decide whether bottom navigation hides during focused typing; preserve navigation access when typing ends. Never shrink all screen content into an unreadable strip.

Test typing, selection, paste, autofill, multiline growth, emoji, dictation where available, rotation while focused, and opening a sheet with an active keyboard.

## 7. Navigation and screen behavior

Use the existing shell and route map. Keep the primary navigation understandable with labels and adequate touch targets. Advanced navigation remains reachable without overwhelming the bottom bar.

Every route must work from a direct URL, browser Back/Forward, refresh, and installed launch. Preserve meaningful list scroll position when returning from a detail page. Do not replay a long shell entrance on every data update.

Mobile menus and drawers need focus management, accessible naming, close actions, route-change closure, and correct scroll lock cleanup. Do not hijack the platform edge-back gesture with custom swipe navigation.

A menu item must indicate the current route. Do not rely on color alone. Keep switching workspace visible and make the active workspace unambiguous.

Avoid automatic navigation when connectivity changes. Reconnection should refresh safe data and allow the user to continue their task.

## 8. Route-by-route requirements

| Surface | Mobile behavior | Acceptance evidence |
| --- | --- | --- |
| Marketing home | Attractive first screen, readable headline, clear comparison entry, deferred decorative work | Narrow and wide screenshots; measured startup |
| Auth | Usable Clerk flows, no clipped fields, readable errors, correct callback return | Browser and installed auth journey |
| Onboarding | Short comprehensible steps, draft preservation, keyboard-safe actions | Complete flow with interruption |
| Dashboard/history | Scannable cards, clear statuses, stable scroll, useful empty state | Long list and return navigation |
| Comparison composer | Comfortable entry, validation near fields, clear running state, duplicate prevention | Rapid double tap and slow request |
| Comparison detail | Verdict first, entities visible, sections navigable, sources accessible | Long comparison on small viewport |
| Evidence and sources | Readable citations, clear timestamps, manageable long links | Keyboard and screen-reader checks |
| Decision/feature matrix | Dedicated horizontal scroll with context; mobile summary only if equivalent evidence remains available | Many entities and dimensions |
| Charts | Responsive size, lazy loading, accessible textual interpretation | Data extremes and reduced motion |
| Follow-ups/chat | Composer above keyboard, controlled autoscroll, clear sending and failed states | Long conversation and reconnect |
| Uploads | Clear supported types, progress, cancellation where supported, failed upload recovery | Large/invalid file and network loss |
| Team/workspaces/projects | Reachable actions, scoped state, safe confirmation for destructive tasks | Switch workspace while request runs |
| Settings | Accessible preferences, installation help, notification capability state | Unsupported and denied states |
| Billing | Central checkout/portal links and entitlement correctness | Return/cancel/error journeys |
| Public comparison | Responsive read-only experience, citations, public/private boundaries | Anonymous direct URL and refresh |
| Export/share | Capability-aware share or download, graceful fallback | Browser and installed tests |
| Not found/error | Recoverable navigation, no blank app shell | Invalid route and chunk failure |

Do not remove data columns permanently to fit mobile. Prefer explicit disclosure, entity selection, or a scoped scroller. Document any simplified view and preserve access to the complete comparison.

## 9. Motion system

Inventory CSS, GSAP, Framer Motion, and Motion usage. Identify which owns each animated element. Avoid two systems fighting over the same transform or opacity.

Keep transitions while improving responsiveness:

- Initial content and controls become usable immediately.
- Press feedback: provisional target 80–140ms.
- Small state transitions: provisional target 140–220ms.
- Sheets and route transitions: provisional target 200–320ms.
- Hero or first-entry sequences can be longer only when they do not block tasks.
- Prefer transform and opacity over layout-affecting animation.
- Keep animated blur, large filters, and continuous full-screen effects out of the critical interaction path.
- Use `will-change` sparingly and remove it when unnecessary.
- Cancel animation work on unmount and stop decorative loops when hidden.
- Reduced-motion mode removes parallax and large spatial movements while preserving clear state feedback.

These are design targets, not mandates to rewrite every duration. Compare perceived quality and frame traces before replacing existing sequences.

Test fast repeated navigation, closing a sheet mid-animation, submitting during transitions, and opening an update prompt while another overlay is active. No invisible overlay may block input after animation ends.

## 10. Performance plan and budgets

Establish a reproducible baseline before optimization. Record commit/worktree state, production build, device/browser, network/CPU conditions, cache warmth, route, sample count, and tool version.

Distinguish first visit, repeat browser visit, installed cold launch, installed warm launch, and client-side navigation. Installing all assets can hide startup cost on repeat visits; report initial transfer separately.

Provisional targets to refine against baseline:

| Metric | Target | Measurement |
| --- | --- | --- |
| LCP | ≤2.5s at p75 where representative field data exists | Field telemetry, plus documented lab proxy |
| INP | ≤200ms at p75 where available | Field interactions; lab traces are supporting evidence |
| CLS | ≤0.1 | Field and scripted loading journeys |
| Critical startup JS | Aim ≤250KiB compressed; investigate >350KiB | Actual route dependency graph and network transfer |
| Critical CSS | Aim ≤60KiB compressed | Built output and request trace |
| Interaction feedback | Visible within 100ms for ordinary taps | Device recordings and traces |
| Transition frame pacing | Aim for smooth display cadence; investigate repeated >50ms tasks | Physical-device trace where possible |
| Layout overflow | Zero unintended root overflow at tested widths | DOM geometry and visual inspection |
| Duplicate mutation | Zero extra jobs for repeated submission of one intent | UI and server integration tests |

Do not claim field p75 from a few local runs. Report at least three comparable lab samples and median when using lab measurements; keep failures visible.

### Optimization order

1. Remove unintended request waterfalls and blocking initialization.
2. Verify route splitting and critical dependency imports.
3. Delay charts, exports, advanced panels, and other genuinely optional modules.
4. Reduce unnecessary rerenders and repeated transformations on large result data.
5. Optimize images, dimensions, font loading, and preload choices.
6. Reduce excessive filters and paint areas while preserving appearance.
7. Revisit worker precache size and installation timing.
8. Consolidate animation dependencies only if measured savings justify migration.

Preserve consent requirements for analytics. Do not defer error reporting so far that startup errors disappear. Keep sensitive information out of performance attributes.

Do not add memoization indiscriminately. Profile context updates and component commits. Virtualize only measured large-list bottlenecks and retain accessible navigation and focus.

## 11. Installation and launch

Preserve the typed manifest source and existing application identity. Changing manifest ID or origin can affect installed-app continuity; do not do it casually.

Verify generated manifest, icon dimensions, maskable safe zones, start URL, scope, display mode, MIME types, and Apple-related HTML metadata in the built and deployed application.

Separate capability states:

- Native install event available.
- Manual installation help appropriate.
- Running in installed display mode.
- Unsupported or constrained embedding context.
- Prompt in progress, consumed, dismissed, or accepted.

Add a quiet, user-invoked installation help entry for supported iPhone contexts. Verify current platform instructions from official sources at implementation time. Make help adapt to the browser rather than always showing a Safari-specific instruction. Do not promise one-tap native installation when the browser cannot provide it.

Keep dismissal respectful. Avoid repeated prompts on every route. Do not request notification permission as part of ordinary install help.

Installed launch must handle valid session, expired session, no network, unknown workspace, and onboarding. A shell that opens offline does not mean authenticated data is available offline.

## 12. Service worker and cache contract

Keep exactly one intended active registration for the app scope. Inspect legacy registrations and caches during migration. Do not delete unrelated origin caches.

Write and verify a cache policy table before changes:

| Resource | Default policy | Constraint |
| --- | --- | --- |
| Hashed public shell assets | Revisioned precache or bounded static cache | Budget installation transfer |
| SPA navigations | Explicit shell strategy with exclusions | Never intercept API/auth/provider routes incorrectly |
| Auth and private API | Network only | No token or private response cache |
| Mutations | Network only | Never replay automatically without deliberate idempotency |
| Public static images/fonts | Bounded cache after allowlist audit | Exclude signed/private resources |
| Public comparison data | Network by default | Offline storage needs a separate reviewed product contract |
| Checkout and portal | Network/provider flow | No cached entitlement assertions |

Path matching is insufficient for proving an asset is public. Check origin, endpoint, credentials, signatures, and response semantics. Restrict cross-origin caches to deliberately approved public hosts/resources.

Test cold install, worker unavailable, quota error, cache eviction, failed asset request, old/new worker coexistence, and offline navigation to a lazy-loaded route.

The broad precache glob may download every lazy chunk. Set a measured precache budget and intentionally decide which routes must open offline. If reducing precache, design an honest unavailable-screen state for uncached routes. Do not turn route splitting into broken offline navigation.

Network-only private API is the baseline. Do not add offline comparison storage just to improve a PWA score.

## 13. Updates, deploys, and rollback

Keep updates user-controlled. Never force a reload during text entry, upload, checkout return, or another critical action.

Before applying an update, preserve eligible local drafts and explain whether the page will refresh. Detect dirty state centrally or through a clear page contract. Avoid dumping private research into localStorage.

Update flow must cover discovery, dismissal, later reminder, activation, reload, failure, and retry. A failed update must not leave a permanently disabled button or a reload loop.

Handle lazy-chunk failures after deployment with a bounded recovery action. Persist dirty state first; offer a refresh. Do not reload indefinitely or interpret every network error as a stale build.

Two-tab test: tab A is old, tab B installs a new worker, tab A has unsaved text. Confirm no silent loss and no accidental duplicate submission.

Rollback needs a newly deployed build/worker that can supersede the faulty release. Browser caches and installed clients may lag behind a server rollback. Keep compatible APIs during rollout and record how the waiting worker becomes active.

## 14. Connectivity and research reliability

Treat browser online status as a hint. Distinguish disconnected, request timed out, unauthorized, rate limited, server failed, provider failed, and canceled.

Maintain truthful progress. Do not invent percent completion or claim a server-side job has stopped because the app is suspended. On foreground return, fetch the authoritative job state.

Audit current polling/query ownership. Use one active polling owner per job where possible, abort stale requests, back off safely, and suspend unnecessary polling while hidden. Resume by reconciling the job before continuing timers.

Preserve the existing research pipeline guardrails: cost, duration, searches, AI calls, and retry count. UI optimizations must not trigger additional AI jobs.

For comparison creation, follow-ups, refreshes, and exports:

- Disable or coalesce repeated UI submissions.
- Use server-side idempotency where retrying the same operation needs it.
- Scope an operation key to user, workspace, action, and payload intent.
- Do not reuse a key for a genuinely new request.
- Check authorization and usage caps before running expensive work.
- Return existing job state for a duplicate intent if supported.
- Preserve errors and retry affordances without fabricating success.

An app closed by the operating system cannot guarantee continuous client execution. Background research needs server durability; verify the existing engine/hosting contract before making background-completion claims.

Respect `Retry-After` on 429 responses. Do not automatically retry authenticated mutations when connectivity returns. Safe GET retries need bounded backoff and cancellation.

## 15. Drafts, identity, and privacy

Inventory what data is already persisted by React Query, browser storage, and the worker. Design draft preservation explicitly.

Prefer small, bounded, versioned draft records. State the retention policy, migration behavior, and clearing behavior. Consider an opt-in for sensitive query persistence.

Partition any persisted authenticated state by account and workspace. Clear or revoke access on sign-out, account change, membership removal, and workspace change. Avoid stale prior-workspace responses appearing after a switch.

API authorization remains the source of truth. Local storage must not grant access, membership, billing entitlements, or ownership.

Reauthenticate gracefully without losing eligible drafts. Do not expose private comparison content in unauthenticated cached HTML, notifications, or telemetry.

## 16. Push and notifications

Improve existing push behavior only after verifying current platform capabilities against official documentation. Essential comparison functionality must work when push is unavailable or denied.

Request permission only after an explicit user action with a clear benefit. Provide unsupported, denied, subscribed, unsubscribed, and expired-subscription states. Never repeatedly nag after denial.

Audit payload validation and notification-click validation independently. Resolve targets to the app origin, reject disallowed destinations, and require normal authorization after opening the target.

Use minimal notification content; avoid sensitive comparison details on the lock screen by default. Do not equate queued push delivery with a notification actually shown.

Verify server subscription ownership, unsubscribe behavior, stale endpoint removal, and account change. Respect the user's notification choice. Test deep links with open/closed app and expired auth.

## 17. Accessibility

Target WCAG 2.2 AA for relevant flows. Automated scans are necessary supporting checks, not proof of complete compliance.

- Use approximately 44×44 CSS-pixel touch targets for primary mobile controls; space adjacent controls adequately.
- Verify text and control contrast on actual translucent surfaces.
- Keep visible focus and a sensible tab sequence.
- Provide names for icon buttons and meaningful input labels.
- Use correct modal roles and focus management through existing primitives.
- Return focus to the opener after a sheet or dialog closes.
- Announce meaningful job-state changes without narrating every polling tick.
- Preserve content order when charts and matrices rearrange.
- Provide textual chart interpretation and accessible score context.
- Respect reduced motion, increased text size, and user zoom.
- Avoid motion-only, color-only, or hover-only communication.

Physically test VoiceOver on iPhone for composer, navigation, comparison verdict, citations, and a dialog. Document any untested flow honestly.

## 18. Billing and ecosystem guardrails

This initiative must preserve SnapSolve Core as entitlement authority. Verify central Dodo checkout and portal flows and account/workspace attribution.

Do not bring back legacy local subscription fallback to make offline billing appear available. Offline state cannot establish fresh paid entitlements. Preserve fail-safe behavior defined by the existing entitlement contract.

Do not retire a payment webhook as a side effect of a visual change. Follow the repository's existing migration and ownership plan if webhook retirement is separately in scope.

Test billing return URLs and session recovery in browser and installed mode. Avoid turning provider callback routes into precached SPA responses without verifying the routing contract.

## 19. Verification matrix

Use responsive widths of 320, 375, 390, 430, 768, and a representative desktop width. Include narrow landscape height and large accessibility text.

Browser automation should include Chromium desktop, mobile Chromium, and WebKit with suitable mobile viewport/touch configuration. Playwright WebKit is an engine test, not a substitute for a physical iPhone installed PWA.

Real-device coverage should include the current stable iPhone OS, the previous major OS if supported by product policy, and an older/slower supported device. Record actual models and versions rather than inventing them.

Required scenarios:

1. Anonymous first visit with cold cache.
2. Sign in, callback, onboarding, and return destination.
3. Create comparison; tap submit rapidly twice.
4. Long query, multiple entities, long names, and many dimensions.
5. Start research, background the app, return, and reconcile status.
6. Lose connection before submission, during request, and during polling.
7. API 401, 403, 429, 500, timeout, and malformed response.
8. Keyboard open during composer, follow-up, menu, and update prompt.
9. Rotate device and expand/collapse browser chrome.
10. Install help, dismissal, installed launch, and expired session.
11. Offline shell with no previously loaded private data.
12. Offline navigation to a route whose chunk is unavailable.
13. Deploy a new build with unsaved text and two open tabs.
14. Recover from missing lazy chunk without reload loops.
15. Sign out and switch accounts/workspaces with requests in flight.
16. Push unavailable, denied, subscribed, and stale subscription.
17. Notification deep link with expired authentication.
18. Share/export with unsupported capability fallback.
19. Reduced motion, keyboard-only operation, and VoiceOver.
20. Storage unavailable, quota exhausted, and worker registration failure.
21. Checkout/portal return and canceled checkout.
22. Direct public comparison URL and private-resource denial.

## 20. Commands and evidence

Run commands from `frontend/` unless a specific tool requires another directory. Check package scripts and installed versions before execution.

```sh
pnpm lint
pnpm exec tsc --noEmit
pnpm run typecheck:api
pnpm test
pnpm run build
pnpm run test:e2e
```

The frontend TypeScript command must be checked against the actual tsconfig layout; if it uses project references, run the command that actually checks application source and record it.

`test:e2e` uses a test-auth build. Verify production PWA behavior separately using a normal production build and isolated browser profile. Never publish an artifact with test authentication enabled.

Do not run database push/migration commands against production as routine QA. Use isolated fixtures and test environments. Inspect generated sitemap and other build changes before retaining them.

Add focused tests for changed behavior: lifecycle transitions, cache exclusions, install states, stale-response protection, duplicate mutation handling, and keyboard/layout regressions where automation is meaningful. Avoid tests that merely duplicate implementation.

Attach screenshots, representative traces, network totals, and concise test summaries to the QA document. Keep private information out of artifacts.

## 21. Ordered implementation phases

### Phase A — Baseline and decisions

Read instructions, inventory dirty files, inspect current PWA wiring and app shell, verify platform documentation, capture baseline screenshots and traces, and identify highest-impact defects. Resolve the unspecified removal before any feature deletion.

Exit gate: reproducible baseline, ranked defect list, design references, cache policy, and a scoped first patch.

### Phase B — Mobile foundations

Implement shared safe-area/layout tokens, scroll ownership, input sizing, overlay placement, and keyboard-safe composer behavior. Fix narrow-screen overflow and mobile menu accessibility. Preserve existing visual identity.

Exit gate: primary flows usable at all target widths; no clipped primary actions or broken desktop layout.

### Phase C — Lifecycle reliability

Improve installation capability states and iPhone guidance. Audit worker routing, cache boundaries, update dismissal/application, registration errors, and offline shell states. Preserve drafts safely.

Exit gate: production worker lifecycle tested, private APIs excluded, no silent draft loss, correct unsupported states.

### Phase D — Research continuity

Audit polling, visibility handling, cancellation, stale responses, workspace switching, rate-limit feedback, and duplicate submissions. Extend server idempotency only where required by real retry behavior.

Exit gate: interruption and repeated-tap scenarios recover without unauthorized access or duplicate expensive work.

### Phase E — Performance and polish

Measure and reduce critical dependency cost, rerenders, heavy paints, and unnecessary animation work. Refine mobile matrices, charts, sources, and navigation. Preserve transitions and accessible feedback.

Exit gate: documented before/after improvement and no design or functional regressions.

### Phase F — Release readiness

Complete browser and physical-device matrix, billing/auth checks, accessibility review, deployed security-header verification, update rollout, and rollback rehearsal in an appropriate environment.

Exit gate: acceptance checklist complete or explicit remaining blockers recorded. Publishing follows the user's deployment authorization; this document alone is not a request to deploy.

## 22. Task cards for the coding agent

For every card, inspect current code first, write a small implementation plan, make the change, and verify the stated evidence. File locations below are starting points, not permission to overwrite entire modules.

| ID | Priority | Work | Starting locations | Required evidence |
| --- | --- | --- | --- | --- |
| M01 | P0 | Safe-area ownership and viewport height | `index.html`, `globals.css`, `AppShell.tsx` | Browser/installed screenshots |
| M02 | P0 | Keyboard-safe entry and submit | Composer components, chat/follow-up pages | Physical typing and paste |
| M03 | P0 | Overlay collision and menu focus | App shell, update prompt, dialogs | Focus and stacking tests |
| P01 | P0 | Worker route audit | `sw.ts`, Vite config | Built worker route tests |
| P02 | P0 | Update state and draft protection | PWA registration/update components | Two-tab update scenario |
| P03 | P1 | Manual installation help | Install hook/button, settings | Verified iPhone instructions |
| P04 | P1 | Honest offline/unavailable state | App shell, API error boundaries | Cold/warm offline scenarios |
| R01 | P0 | Reconcile research after suspension | Comparison page and data hooks | Foreground recovery test |
| R02 | P0 | Duplicate intent prevention | Composer and comparison API | One intent creates one job |
| R03 | P0 | Identity-scoped cache cleanup | Auth/workspace contexts | Account-switch leakage test |
| V01 | P1 | Accessible mobile comparison detail | Comparison components | Evidence parity and screenshots |
| V02 | P1 | Preserve efficient motion | Shell, CSS, animation imports | Reduced-motion and trace review |
| F01 | P1 | Startup dependency/transfer audit | App/main, Vite chunks | Before/after graph and bytes |
| F02 | P1 | Large result rendering | Matrix/chart/source components | Large fixture traces |
| Q01 | P0 | Mobile/WebKit automation | Playwright config and e2e | Browser test report |
| Q02 | P0 | Physical iPhone QA | QA document | Model/OS/scenario observations |
| S01 | P0 | Push and cache privacy | Worker, push routes, auth | Malformed payload and logout tests |
| B01 | P0 | Entitlement and checkout continuity | Billing, subscription bridge | Central-provider journey checks |

P0 denotes release correctness, not a requirement to implement unrelated backend features before a useful mobile patch. If a concern is already correctly handled, verify and retain it instead of rewriting it.

## 23. Definition of done

- [ ] Existing product identity and meaningful transitions remain recognizable.
- [ ] iPhone inputs, keyboard, safe areas, and scrolling work across tested contexts.
- [ ] No unintended horizontal root overflow or obscured primary controls.
- [ ] Installation is discoverable with truthful capability-specific guidance.
- [ ] Worker registration failure does not break ordinary web usage.
- [ ] Private APIs, auth, and checkout data remain outside worker caches.
- [ ] Updates preserve eligible drafts and require an intentional refresh.
- [ ] Offline states explain what is available and what requires a connection.
- [ ] Research reconciles after suspension without fabricated progress.
- [ ] Repeated submission does not create duplicate expensive jobs.
- [ ] Account/workspace changes cannot display another scope's private state.
- [ ] Push is optional, permission-respecting, and authorization-safe.
- [ ] Central entitlement and billing authority remain correct.
- [ ] Reduced motion, zoom, keyboard navigation, and core screen-reader flows work.
- [ ] Representative performance results improve or exceptions are explained.
- [ ] Relevant build, type, lint, test, browser, and device checks have evidence.
- [ ] Production artifact has no test-auth configuration.
- [ ] Rollout and worker rollback procedures are documented.
- [ ] Remaining limitations and unresolved exclusion are explicitly recorded.

## 24. Final reporting format

Lead with what became better for users. Explain the concrete changes, preserved design choices, measured outcomes, and verification results. Link modified files and QA artifacts. Separate observed failures, unavailable device checks, and remaining decisions from completed work.

Do not claim “works perfectly on every iPhone.” State which devices and operating systems were tested. Do not claim performance gains without a baseline. Do not describe documentation-only work as a shipped app improvement.

## 25. Ready-to-use execution prompt

> Implement the next SideBy PWA release using `docs/SIDEBY_NEXT_PWA_AI_EXECUTION_GUIDE.md` and applicable AGENTS.md instructions. Begin with the current working tree, preserve existing changes, and establish a reproducible baseline. Improve iPhone layout, keyboard behavior, navigation, installation, updates, offline honesty, research recovery, and measured performance while preserving SideBy's beauty and meaningful transitions. Build on the existing worker, typed manifest, React routes, and research UI. Keep authenticated data boundaries, usage guardrails, and SnapSolve Core entitlements intact. Execute coherent phases, add meaningful verification, and provide before/after evidence. The unspecified phrase about removing something is unresolved: ask before deleting a feature while continuing independent improvements. Finish with actual changes and a candid validation report; do not stop at a plan or claim tests that were not run.
