# Next builder assignment — revision 5 gates

Revision 5 · 2026-10-13

Read `SIDEBY_IOS_MASTER_PLAN.md`, `BUILDER_RUNBOOK.md`, `EXECUTION_LEDGER.md`, `reviews/2026-10-13_R2_COORDINATOR_REVIEW.md`, and the current B00/B01/B02 evidence before editing. Preserve all working files. Return a reviewable patch and separate B00/B01/B02 reports in the ledger format; request coordinator acceptance rather than changing ledger status.

## B00-R3 — prove a recoverable generated build

Owned paths: mobile `plugins/sideby-ios-scene.js`, `app.json`, package/lock files only if needed, and B00 evidence. Do not reset, clean, or overwrite the existing ignored native tree.

1. Stage only reviewed source paths into Git with explicit path arguments, after checking `git status --short` and exclusion rules. No `git add .`. Keep `.env`, generated `ios/`, `dist/`, caches, `ios/.xcode.env.local`, signing material and credentials out. Do not create a commit unless directed; report the staged file list and `git diff --cached --stat`. The existing archive is a fallback snapshot, not evidence of staging.
2. Recreate `source-only.tgz` without macOS `._` AppleDouble entries. Verify every source hash, archive membership, and absence of sensitive/generated files. Record the archive SHA-256 and reviewed source count.
3. From a **separate extraction** of that archive, install from the frozen lockfile, run `expo prebuild --platform ios --no-install` without `--clean`, inspect the generated SceneDelegate/Info.plist/bundle URL edits, and run a simulator build and launch. Record the actual prebuild and build commands, exit codes, OS/runtime, app identity, and an unobstructed screenshot from the generated binary. The existing B00-R2 screenshot/build log does not close this gate. Correct the plugin header's fresh-checkout claim if the run cannot be completed.
4. Check bundle resolution in Debug and Release, including the case where `main.jsbundle` is present during a Debug launch; prevent stale JS from overriding Metro. Document or test plugin idempotence after a second non-clean prebuild. Preserve the existing generated `ios/` tree throughout.

## B01-R3 — subscription truth and staging contract

Owned paths: mobile usage adapter/account UI and focused tests, B01 contract evidence. Backend code is read-only unless a real contract defect is proved and assigned.

1. Split plan knowledge from subscription status. The handler exposes `active`, `trialing`, `inactive`, and `unknown`; the account badge must not say “Active” for `inactive` or `unknown`. Respect `subscription.entitlement.allowed` when present. Test each status and denied entitlement with finite, unlimited, and missing quota fields. Known plan plus unknown quota must still show unknown remaining.
2. With an authorized staging account and test workspace, verify a favorite round trip and refetch, Markdown and JSON exports, and usage/subscription/entitlement responses. Save redacted request/response shape and UI results, including failure paths. Never use production records as fixtures. If staging access is unavailable, mark each flow NOT RUN with the specific dependency; do not claim B01 acceptance.
3. Confirm existing history/sources/detail screen tests still cover malformed acknowledgements, overlapping favorites, partial/all-failed source retrieval, and neutral source labels. Investigate Jest's open handle so the required `--runInBand` command exits normally; record the cause or a bounded follow-up if unrelated.

## B02-R3 — make the platform specification executable

Owned paths: `docs/ios/design/SCREEN_SPEC.md`, B02 evidence, and a small isolated tab spike in the mobile app when B00's generated build passes.

1. Reconcile the canonical screen spec with actual active code and `NATIVE_TABS_AND_CONTRAST_R2.md`: identify the custom bar, remove unmeasured AAA assertions and unsupported implemented-feature claims, and distinguish proposals from shipping behavior. Retain the three-tab/two-input structure.
2. Compare active `expo-glass-tabs` and installed `expo-router/unstable-native-tabs` in the same build on iOS 26/current runtime and a pre-26 supported runtime. Record tab selection, scroll-under material, keyboard/safe-area behavior, VoiceOver selection, and fallback. Keep one decision with screenshots/video and build identity; state any unavailable runtime as NOT RUN.
3. Measure rendered contrast for the actual backgrounds/materials in dark/default and high-contrast states. If light or high-contrast themes are not implemented, label them unimplemented rather than invent ratios. Specify and verify the Reduce Transparency fallback and largest accessibility text reflow or leave these as explicit B05 acceptance gates. Separate measured results from targets.

## Required verification

```bash
cd /Users/aminsobor/Documents/antigravity/excited-volta
pnpm typecheck
pnpm exec jest --runInBand
pnpm exec expo install --check
```

Report each command's exit code, exact simulator/runtime, source snapshot identity, and missing gates. B03 is limited to read-only workspace/session/cache contract discovery until B01 is accepted. B04 may perform the bounded tab spike after B00's generated build proof; broader shell integration waits for B03's interface.
