# WEB-BATCH-03 — Decision integrity, privacy and complete mobile workflows

Date: 2026-10-27.
Mode: substantial implementation batch; testing remains deferred under the user's instruction.
Status: **implemented locally, unverified** (no tests, typechecks, lint, builds, browser or device checks run).

## What changed and why

Source review of WEB-BATCH-02 found implicit publication, an incomplete public preview, matrix winners presented as user decisions, guessed version labels, silent fetch failures, and retries that could run ahead of `Retry-After`. This batch repairs those concretely and finishes the deferred mobile/desktop/motion items.

## Package 1 — Public sharing is explicit and truthful

- `ShareModal` migrated from a custom framer-motion overlay to the existing Radix dialog primitives (focus trap, Escape, portal, reduced-motion guards, labeled title/description).
- Publish, Copy public link, Open public page and Make private are now four separate actions. Copy and Open stay disabled while private — nothing mutates visibility without an explicit, labeled Publish. Unpublishing is an explicit Make private action.
- Modal state resets on open/record change: no previous record's visibility or error leaks into a new open.
- New shared contract `frontend/src/lib/publicComparison.ts` (`public-projection/v1`): the public by-slug endpoint serves exactly this allowlist projection and fails safe (404) on unprojectable records. The modal preview renders the same projection client-side.
- Allowlist policy: query, entities (+presentation color), dimensions, consensus, contradictions, verdict, categories with facts, sources (no extraction internals, no content hashes), provenance, counts, dates. Excluded: user decision context/brief, telemetry (costs/models), ingestion internals, team notes, uploads, saved decision matrices (never read by the serializer).
- Deliberately kept: entity color and refresh change markers, because the public page reuses the same panels and stripping them would silently change public rendering (verified against Compare.tsx + FactCard/CategorySection consumption).
- Cache honesty: edge cache reduced to `s-maxage=300, stale-while-revalidate=3600`; UI states that unpublishing stops new visits immediately, cached copies may persist minutes, and downloads outside SideBy can't be recalled.
- New authored-but-unexecuted regression file: `frontend/src/lib/__tests__/publicComparison.test.ts`.

## Package 2 — Decision receipts and history have real meaning

- Receipt distinguishes three things: AI recommendation, saved weighted scenario, explicit user-recorded decision. Matrices saved without the `recordedAs: "user-choice"` marker are labeled scenarios, never decisions.
- Explicit choice: "Record my decision" (A/B radio + optional rationale) persists via the existing authorized decision-matrices endpoint with the marker. Latest marked record renders as the user's decision.
- Version binding: live records labeled unfrozen ("not a frozen snapshot"); historical views bind version id/number/recorded date from the versions API. `+1` guessing removed. A historical view whose version metadata hasn't loaded says so instead of claiming liveness.
- Fetch states separated: loading / load error (with retry path) / no recorded choice. State resets immediately on comparison change; in-flight requests abort via AbortController.

## Package 3 — Research actions can't duplicate work or invent certainty

- `api.ts`: only safe methods (GET/HEAD/OPTIONS) retry; mutations fail to an explicit user retry. Aborts stop immediately (no retry, no report). Backoff is abort-aware. A Retry-After beyond 30s is not shortened — the request fails with the server's own timing surfaced, telling the user when retry is allowed.
- Follow-up (both the main panel and the gap planner): synchronous ref lock against double submit, validated response shape (non-empty answer string, typed optional fields), stale-response protection via per-comparison reset + request abort, and remaining allowance read from the live `/api/usage` contract instead of a hardcoded plan limit.
- Gap derivation v2: distinguishes absent-on-both-sides, one-sided, weakly supported, uncited claims, and contradictions; flags missing citations as assertions-not-evidence; labels support scores as scores, not probabilities; provenance-illustrative records are called out; empty-category and empty-record states explain what silence means.
- Research continuity copy retained as truthful: queued jobs persist and a 5-minute scheduled drain processes them (`frontend/api/_routes/jobs/drain.ts` + vercel crons), so leaving and reconciling on return is supported by deployment design.

## Package 4 — Finish the incomplete experience

- New shared primitive `useKeyboardInset()` (visual-viewport measured, no hardcoded device guesses), applied to the composer and follow-up forms via bottom spacers. Uploads/settings/billing/team forms deferred to a later pass; physical-keyboard behavior explicitly unverified.
- Mobile continuation kept via POP-aware scroll restoration; historical receipt shows the version-bound notice and never the latest record's data.
- New panels/dialogs carry no replaying entrance motion (static render); the migrated share dialog uses Radix state animations with reduced-motion guards. Primary actions remain usable before any decoration.
- `SafePanel` takes a `resetKey` (comparison id + viewed version/live) so contained failures reset on record change instead of surviving navigation.

## Migrations

None authored. No schema change was needed: decision-record markers ride the existing `decision_matrices.result` jsonb; no new tables, columns, or applied migrations.

## Deferred validation checklist (do not run yet)

Mocked contracts (unit, no browser):
1. `publicComparison.test.ts` — projection allowlist, fail-safe nulls (authored, unexecuted).
2. Gap derivation unit cases: both-sides-absent, uncited, weak, contradiction, empty record, illustrative provenance.
3. Retry matrix: safe-method retry, mutation no-retry, abort-during-backoff, over-long Retry-After failure message.
4. Receipt state machine: loading/error/none/choice, comparison-change reset, abort on unmount.

Staging/API (against a preview when testing is authorized):
5. Publish → public fetch shows projected payload only (context/telemetry absent).
6. Unpublish → new fetches 404; note cached-copy window honestly.
7. Record decision → receipt shows it; scenario-only matrix shows as scenario.
8. Historical view → receipt binds the frozen version; gap panel + receipt reset on comparison change.
9. Follow-up double-submit → single request; malformed response → explicit error; quota line matches `/api/usage`.
10. Two-build PWA update re-check (existing suite) — confirm save/discard behavior unchanged.

Physical/device (gated on hardware):
11. Same-iPhone auth journeys on the hotfix preview (separate gate, PR #174).
12. Keyboard-open composer/follow-up reachability at 320/390/430px; reduced-motion pass; landscape + large text.
13. Notice stack + sticky bar + toasts with update prompt and consent banner visible.
