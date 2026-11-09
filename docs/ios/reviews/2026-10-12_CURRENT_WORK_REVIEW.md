# Coordinator review — current B00-R1, B01-R1, B02-R1 work

2026-10-12 · Plan revision 4 · Decision: useful progress verified; tickets remain NEEDS_REVISION for the specific gates below.

## What was independently verified

- Mobile `pnpm typecheck` passed. `pnpm exec jest --runInBand` passed 6 suites/66 tests. This is a real increase from the previous 45 tests.
- The current `src/api` implementation removes network-failure synthesis, rejects malformed comparison jobs, supports raw Markdown response decoding, strips caller Authorization for untrusted origins, handles pre-aborted requests, and adds HTTP-date Retry-After parsing. API tests exercise those cases.
- The backend's Markdown export handler sends `text/markdown`; the new transport decoder handles that content type. Refresh/retry no longer place their acknowledgement directly into the comparison cache.
- `docs/ios/evidence/B00-R1/BUILD.log` ends in `** BUILD SUCCEEDED **`. `APP_LAUNCH_VERIFIED.png` visibly renders the composer and three-tab shell, though an iOS “Open in SideBy?” dialog overlays it. This supersedes the earlier black screenshot as render evidence. It is simulator evidence, not a full signed release or real backend journey.
- All 117 entries in `SOURCE_MANIFEST.sha256` currently match their on-disk hashes. `.env` and `.env.local` are ignored.
- B02 now describes three destinations and a two-contender composer. The contract ledger explicitly marks staging verification pending.

## Claims that are too broad

1. **“Nothing is actually broken” is not supported.** `pnpm exec expo install --check` fails today with five patch updates expected: `expo`, `expo-auth-session`, `expo-crypto`, `expo-router`, and `jest-expo`. The builder's prior pass was a point-in-time observation, not the current result. Typecheck and Jest passing do not prove native journeys or tenant safety.
2. **The source baseline is not captured in Git.** `git log` still contains only `c793e49 Initial commit`, and most application paths are untracked. The 117-entry manifest is an inventory with hashes; it is not a retrievable source patch or archive. It includes `dist/` outputs, generated `ios/` files, `ios/.xcode.env.local`, and `ios/sentry.properties`, despite its “source-only” description. The native SceneDelegate/Info.plist/bundleURL fixes live under ignored `ios/` and have no visible config plugin or tracked native source path. A clean checkout therefore cannot be expected to reproduce the successful build.
3. **Unknown usage still appears as a benefit.** `src/api/usage.ts` maps a missing limit to `null`, the same value used for explicit unlimited entitlement, and defaults missing used counts to zero. `src/components/account/UsageGauge.tsx` displays that as “Unlimited,” and displays an “Active” badge even when authority is unknown. The `{}` guard is useful but does not make a partial payload authoritative. Distinguish finite, explicitly unlimited, and unknown/unavailable from the verified backend contract.
4. **Mutation response and UI state need stronger verification.** `toggleFavorite()` still echoes the requested value when the server's `comparison.isFavorited` is missing. The 66 tests mostly exercise API helpers; no screen test proves failed or overlapping favorite/rating mutations, cache rollback, or management acknowledgement/polling lifecycle. The new detail screen serializes its own favorite button, but history and detail are separate controls over the same record. The result of a refetch during pending mutation is also unverified.
5. **Partial source failures are invisible in the screen.** `fetchAggregatedSourcesReport()` records `partial`, but `app/(tabs)/sources.tsx` calls `fetchAggregatedSources()` and receives only an array. Its UI cannot tell a partial library from a complete one. The aggregation still covers only a recent subset and fetches details sequentially. Label the scope and expose partial status to users.
6. **Verification labeling is still too strong.** Detail renders “SOURCE VERIFIED” when its `hasVerifiedSources` condition sees result sources. A source URL or list does not independently verify that each visible claim is supported. Define the evidence criterion or use a neutral label.
7. **B02 remains a proposal with unverified claims.** `SCREEN_SPEC.md` still asserts WCAG AAA without full-state measurements, is dark-centric, and specifies `@react-navigation/bottom-tabs` with a custom surface as though it were Expo Router native tabs. The material plan must compare installed SDK 57's actual native-tab export on iOS 26/current OS and fallback OS. Do not infer native Liquid Glass from a custom blur tab bar.
8. **Live ecosystem behavior is untested.** Contract fixtures and a rendered guest composer do not establish Clerk-to-Core linkage, workspace isolation, server entitlement handling, purchase flow, or a persisted comparison shared with the web app. B03 remains an integration task.

## Acceptance decision

B00: native build/render subgate verified; source preservation and clean-checkout reproducibility remain open. B01: API transport and 66 tests verified; quota truthfulness, authoritative mutation/UI behavior, partial-source disclosure, and live contract verification remain open. B02: navigation/composer alignment improved; native-control/material, accessibility, and contrast claims remain open. Keep all three as NEEDS_REVISION. B03 discovery may proceed read-only; tenancy implementation should use an accepted B01 contract boundary. Do not commit or stage secrets or generated artifacts while resolving B00.

## Next handoff

See `../NEXT_BUILDER_INSTRUCTIONS.md` revision 4. The coordinator will reconsider status after a reviewable source baseline, targeted UI/contract tests, corrected spec, and relevant runtime evidence are returned. The user did not ask for a commit, and this review made no mobile application code changes.
