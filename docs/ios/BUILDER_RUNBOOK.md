# SideBy iOS builder runbook

Revision 5 · 2026-10-13 · Read `SIDEBY_IOS_MASTER_PLAN.md` first.

## Current assignment override

Follow `NEXT_BUILDER_INSTRUCTIONS.md` revision 5 for B00-R3/B01-R3/B02-R3. Read `reviews/2026-10-13_R2_COORDINATOR_REVIEW.md`. The prior build, 78-file archive, 93 tests and compatibility check are verified sub-results; acceptance awaits the remaining gates. Builders request review and do not mark tickets ACCEPTED.

## Execution rules

Operate only on the assigned ticket and files. Inspect local instructions in each repository. Do not reset/clean existing work, print `.env`, commit secrets, deploy, create a second subscription authority, or replace backend research with demos. Do not run destructive prebuild cleanup. Stop a dependent step when its prerequisite fails, record the exact failure, and continue only independent work.

All commands below are real tooling commands; they are not evidence that a task passed. Run each block in its stated directory. Validate installed package exports/types before adopting an example from latest documentation.

## Start every ticket

```bash
cd /Users/aminsobor/Documents/antigravity/excited-volta
pwd
git status --short
git log -3 --oneline
node --version
pnpm --version
pnpm typecheck
pnpm exec jest --runInBand
pnpm exec expo install --check
```

For a backend ticket, also read instructions and capture its current dirty state:

```bash
cd /Users/aminsobor/Dev/SideBy
cat AGENTS.md
git status --short
cd frontend
cat package.json
```

Mobile source is currently mostly untracked. Before creating an isolated branch/worktree, B00 must reconcile the source baseline, protect `.env`, and record a reviewed file manifest. A branch from current HEAD by itself is not a backup of untracked code. Stage only reviewed source paths; do not use blanket staging or commit unrelated web changes. Do not copy secrets into evidence. Preserve local files until the source baseline is verified.

## B00 — compatibility and reproducible native build

1. Inventory package/lock files and baseline tests. Update `.gitignore` to ignore `.env` and local secret variants while retaining the example file.
2. Align packages with the installed Expo SDK family; inspect the diff and document compatibility workarounds. Do not upgrade to a new major SDK incidentally.
3. Use a real development binary. Current `pnpm ios` starts Metro/iOS; it does not establish a newly compiled release binary.

```bash
cd /Users/aminsobor/Documents/antigravity/excited-volta
pnpm install --frozen-lockfile
pnpm exec expo install --fix
pnpm exec expo install --check
pnpm typecheck
pnpm exec jest --runInBand
xcodebuild -version
xcrun simctl list devices available
pnpm exec expo run:ios
```

`expo install --fix` intentionally changes package/lock files. Review its output; if it proposes a major SDK migration, stop that migration and document the patch-only alternative. Use `pnpm dlx expo-doctor` as an additional diagnostic with its version recorded. Fix a missing frozen-lock dependency resolution rather than deleting the lockfile.

`expo run:ios` may generate ignored `ios/` files and install native dependencies. Verify project identity and retain config plugins/native changes reproducibly; do not run `prebuild --clean` against an unreviewed native tree. Signing, CocoaPods, or simulator errors must be recorded separately from app errors. If device selection is needed, use `pnpm exec expo run:ios --help` and the installed CLI's supported device flag.

After initial successful build, a development-client workflow may be added using SDK-compatible `expo-dev-client`; install only if required and explain the dependency. EAS configuration is not currently present and must not be assumed.

Deliver: baseline source manifest/commit or patch reference; package diff; command outputs; native build/simulator screenshot; remaining warnings. Do not claim physical-device performance from this build.

## B01 — honest API and real mutations

Read mobile `src/api`, schemas/tests, and web `_routes/comparisons`, `_lib/sideby.ts`, dispatcher, and usage handler. Freeze redacted request/response fixtures and document actual transport envelopes/statuses. Implement:

- Explicit example data path, isolated from real history/IDs/storage; never activated by network/schema/auth failure.
- Typed failure/empty/unknown states, trusted-origin token handling, timeout/cancellation, structured quota/retry metadata.
- Real organize/favorite, feedback, format-correct export, and mutation rollback; verify on staging.
- Tests for 401/403/404/429/5xx, malformed success, empty history, export formats, no fallback synthesis, favorite failure rollback, and untrusted-origin token suppression.

```bash
cd /Users/aminsobor/Documents/antigravity/excited-volta
pnpm typecheck
pnpm exec jest --runInBand
```

Do not call paid research providers or mutate production records as a unit test. Use authorized staging accounts for live checks. Rate limits and server checks remain authoritative. Safe create replay requires a server idempotency contract; a client-generated key alone does not establish one.

## B02 — design brief

Create `docs/ios/design/SCREEN_SPEC.md` in SideBy with screen/state diagrams, exact control placement, typography/material tokens, and prioritized before/after references. Capture baseline screenshots from the actual iOS build when available. Label browser prototype references as prototypes.

Specify small/large text, light/dark, reduced transparency, keyboard, offline/error, and long evidence cases. Keep reading surfaces quiet. Provide an interaction specification, not only a beautiful static home screen. Return the proposed native-tab choice to B04 for a device spike.

## B03 — identity/workspace/cache

Freeze a mobile context interface with auth readiness, local workspace ID, canonical mapping, role/capabilities, entitlement freshness/unavailable state, and explicit switching. Scope all queries/persistence/drafts. Gate content until identity is ready. Cancel and purge on sign-out/switch and prevent late responses from restoring prior data.

Write meaningful lifecycle tests: user A→sign-out→B; workspace X→Y; in-flight response during switch; persisted hydration; revoked member; Core timeout; expired token; unknown usage. Prove a real staging record opens on web and iPhone. Validate backend tenant authorization; do not merely test client filters.

If changing shared API code, run the backend checks as well:

```bash
cd /Users/aminsobor/Dev/SideBy/frontend
pnpm typecheck
pnpm test
```

Run relevant existing E2E tests if changed behavior requires them; inspect `playwright.config.ts` and seeded auth setup first. Do not assume a browser test covers native authentication.

## B04 — shell and material policy

Build a small native-tab comparison in the existing app, using SDK-appropriate imports verified in `node_modules/expo-router`. Compare active `expo-glass-tabs` behavior against Expo Router native tabs. Keep one implementation after the decision; remove unused alternatives only after checking references.

Implement semantic themes and consolidated material/accessibility policy. Verify glass on supported OS, opaque fallback, VoiceOver selection, scroll reselection, interactive back, keyboard, large text, and content clearance. Capture a short video of scrolling beneath native glass and screenshots of accessibility fallbacks. Validate the glass-parent-opacity caveat on actual transitions.

```bash
cd /Users/aminsobor/Documents/antigravity/excited-volta
pnpm typecheck
pnpm exec jest --runInBand
pnpm exec expo run:ios
```

## B05 — screen interactions

Implement approved core journey using frozen B01/B03/B04 interfaces. Fix scrubber semantics or replace it with accessible criterion selection; use real result data. Add motion lifecycle cancellation, reduced-motion behavior, semantic haptics, native sheet/keyboard handling, and visible alternatives to gestures. Do not generate unsupported winner/advantage copy.

Check repeated taps, mid-animation navigation, vertical-scroll conflicts, interrupted gestures, sheet dismissal with keyboard, network failures, and return from background. Haptic feedback should not be duplicated by wrapper and handler.

## B06 — QA and profiling

Repair `.maestro` flows with stable `testID` selectors and controlled staging auth; remove embedded credential strings. Native E2E must confirm persisted evidence, not simply that two entity names appear.

```bash
cd /Users/aminsobor/Documents/antigravity/excited-volta
pnpm typecheck
pnpm exec jest --runInBand
pnpm exec expo install --check
maestro --version
maestro test .maestro
```

Run Maestro only after it is installed, a suitable app binary is installed/booted, selectors have been repaired, and the test identity/environment is configured. Supply credentials using the team's secure runner/environment mechanism; never store real credentials in flows or reports. Record unavailable prerequisites instead of marking flows passed.

For Release profiling:

```bash
cd /Users/aminsobor/Documents/antigravity/excited-volta
pnpm exec expo run:ios --help
pnpm exec expo run:ios --configuration Release
open -a Instruments
```

Select a physical device using the installed CLI or Xcode. Capture Time Profiler, Animation Hitches/Core Animation as available, Allocations/Leaks, and energy/network evidence for the exact master-plan scripts. Choose templates available in installed Instruments; do not fabricate trace automation commands. Record Debug and Release results separately.

Required matrix: compact phone + large phone; 60Hz + ProMotion; iOS 26/current shipping OS + minimum supported OS; light/dark; default/largest accessibility text; VoiceOver; Reduce Motion/Transparency/Increase Contrast; offline/slow network; auth expiry; two accounts/workspaces; long history/evidence; empty states; quota/entitlement unavailable. A subset may share devices, but report each scenario explicitly.

## B07 — release candidate

After B06 closes blockers, define signing/distribution/build-number policy, privacy manifests and dependency data practices, account deletion, verified links, app icon and real screenshots, TestFlight review notes, and monitoring/support ownership. Recheck Apple rules before any purchase-related UX. Create a candidate and document rollback; publishing and production migration are separate explicitly scoped steps.

## Copy/paste builder assignment

> You are the builder for ticket [ID] in the SideBy iOS plan. Read `/Users/aminsobor/Dev/SideBy/docs/ios/SIDEBY_IOS_MASTER_PLAN.md`, this runbook, the execution ledger, and applicable repository instructions. Implement only this ticket's owned files after its prerequisites are accepted. Preserve existing user changes. SideBy is a SnapSolve ecosystem client: reuse backend/workspace/subscription authority. Never substitute fake research or success for failures. Run the specified checks, attach a reviewable patch/diff and relevant runtime evidence, and return the ledger's report format. Mark unavailable checks as not run. Do not deploy or modify unrelated systems. If a shared interface needs changing, propose the exact contract and coordinate with its owner before dependent edits.

The coordinating AI fills `[ID]` and the allowed files before dispatch. Send B00 first. B02 may proceed with specification while runtime work is underway, but must label unverified runtime assumptions. Return each builder report to the coordinating AI for review before assigning dependent implementation.
