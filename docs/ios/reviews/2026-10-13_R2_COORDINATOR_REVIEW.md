# SideBy iOS — B00-R2 / B01-R2 / B02-R2 coordinator review

2026-10-13 · Plan revision 5. Reviewed the builder's 2026-10-12 report against the current mobile and SideBy files. This is an acceptance decision, not a claim that the reported work is lost.

## Verified baseline

- Mobile remains at `c793e49 Initial commit`; application files are untracked. No reviewed Git commit or staged source baseline exists.
- `pnpm typecheck` passed. Jest reported **93/93 tests across 11 suites**. The Jest process then reported an open handle and did not exit; it was interrupted after results. `pnpm exec expo install --check` independently exited 0 with “Dependencies are up to date.” The aligned packages include Expo `~57.0.28`, Expo Router `~57.0.26`, auth session `~57.0.15`, crypto `~57.0.4`, and jest-expo `~57.0.6`.
- `source-only.tgz` contains 78 source entries plus 78 macOS AppleDouble `._` entries. All 78 source entries match `SOURCE_MANIFEST.sha256`; no `.env`, generated `ios/`, `dist/`, or signing material was found. `.env.example` is intentionally present. Recreate the archive without AppleDouble metadata for a clean handoff.
- `BUILD_R2.log` says “Build Succeeded,” then records installation and opening on iPhone 17 Pro. `APP_LAUNCH_R2.png` is an unobstructed, rendered composer. Neither artifact proves a fresh archive extraction → prebuild → build → launch after the plugin change. The builder explicitly reports that full rerun as NOT RUN.

## B00-R2 — NEEDS_REVISION

The plugin is registered in `app.json` and moves the SceneDelegate, scene manifest and bundle URL edits into source. The patch alignment and rendered build are real improvements. Reproducibility is still the missing acceptance gate: perform the build from a separate extraction of the archived source (or a committed source checkout), generate `ios/` with the plugin, compare the generated native changes, record command/exit code, and launch that generated binary. Correct the plugin header's statement that a fresh checkout was already verified unless this run succeeds. The plugin's embedded-bundle-first behavior also needs a Debug/Release check so a stale bundled JS file cannot silently override Metro in Debug.

## B01-R2 — NEEDS_REVISION

The finite/unlimited/unknown model, server `isFavorited` acknowledgement, serialized favorite toggle/rollback tests, distinct Sources states, and neutral source labels are present. The actual backend usage handler returns `subscription.status` from `active | trialing | inactive | unknown`. `UsageGauge` currently renders **Active** whenever `planKnown` is true; a known `inactive` response therefore displays the wrong status. Model status separately from plan knowledge and test inactive/trialing/unknown states and entitlement-denied behavior. Preserve unknown quota/remaining states even with a known plan.

The contract appendix now names current handler paths and labels staging NOT RUN. Finish the authorized staging favorite, Markdown/JSON export, and usage/entitlement checks with redacted response evidence. Do not claim end-to-end ecosystem behavior from local fixtures. B03 remains read-only contract discovery until this boundary is accepted.

## B02-R2 — NEEDS_REVISION

`NATIVE_TABS_AND_CONTRAST_R2.md` correctly identifies the active `expo-glass-tabs` UI as custom and the installed Expo Router native-tabs export as unadopted. It measures only opaque dark-theme tokens on a flat background and states that translucent surfaces, light/high-contrast states, Reduce Transparency, largest text, and iOS 26/pre-26 runtime behavior are unmeasured or unimplemented. That honesty is useful, but the assigned same-build native-tab comparison did not run. The canonical `design/SCREEN_SPEC.md` still presents a custom bar as an implementation decision and asserts AAA on unmeasured surfaces. Reconcile it with this review, then perform the bounded B04 native-tab spike and actual state measurements before B02 acceptance.

## Decision and dependency

Keep B00, B01, B02 at NEEDS_REVISION, with verified sub-results recorded above. B03 may inspect contracts and draft interfaces, but implementation awaits B01 acceptance. B04's native-tab/device spike may be prepared after B00's reproducible build gate; it does not require B03 implementation. See `NEXT_BUILDER_INSTRUCTIONS.md` revision 5 for bounded commands and evidence.
