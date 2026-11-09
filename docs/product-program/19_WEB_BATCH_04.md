# WEB-BATCH-04 — Correct public records, real decision provenance, safe networking

Date: 2026-10-27.
Mode: substantial completion batch; testing remains deferred under the user's instruction.
Status: **implemented locally, unverified** (no tests, typechecks, lint, builds, browser or device checks run).

## Completion matrix

| Task | State | Where | Unverified risk / open point |
|---|---|---|---|
| A1 entity attribution | Done | `publicComparison.ts` `PublicFact.entity`, panel/test fixtures use it | Executed coverage pending |
| A2 recursive allowlist | Done | v2 projection: `PublicVerdict`, `PublicTaxonomy`, safe-URL + date + finite validation | Older records with partial taxonomy project to `null` taxonomy (falls back to server summary) |
| A3 mixed-evidence eligibility | Done (v2) | `api/_lib/public-eligibility.ts`: classification from server-written `ai_runs` + `comparison_facts` citations only; stored-JSON `provenance` never consulted; publish 422 w/ reasons; detail exposes `publishEligibility` | Coverage authored, unexecuted (`api/_lib/__tests__/public-eligibility.test.ts`) |
| A4 cache/revocation | Done | by-slug: `private, no-store, max-age=0, must-revalidate`; modal copy matches | CDN/embed availability change is unverified in production |
| A5 unknown origin | Done (v2) | by-slug re-establishes privacy on every read from the same evidence; unknown/unattributable → 404; fixtures only via trusted hash + cited claims; served `provenance` is server-set | Pre-gate published records that fail classification stop serving — intended, noted |
| A6 client copy/audit | Done | modal no longer promises cache eviction; modal shows server reasons before acting | In-flight/about:blank text from earlier briefs superseded |
| B1/B2 coalescing | Done (v2) | `api.ts`: sharing is anonymous-only (resolved credential state); authenticated never coalesces; credential errors never enter a shared bucket; no token fingerprinting | Adversarial coverage authored, unexecuted (`api-identity-isolation.test.ts`); residual in-flight anonymous window documented in code |
| B3 Request semantics | Done | method + header merge + CSRF from resolved method | Call sites that passed `Request` objects are rare; unverified |
| B4 polling/mutation duplication | Done | React Query mutations `retry: false`; apiFetch mutations never replayed; backoff abort-aware | Any flow that silently relied on one auto-retry will now surface an error (intended, unverified) |
| C1 keyboard primitive | Done | `useKeyboardInset` = estimated occlusion, editable-gated, rAF-coalesced, reset on disable | Physical keyboard/split/zoom unverified on hardware |
| C2 adoption | Partial | `KeyboardSpacer` in composer, follow-ups, uploads, settings, team, billing | Deep nested scroll regions on other pages not audited |
| C3 two-mount ownership | Done | receipt + matrix panel + both quotas via shared react-query keys | Cache invalidation on visibility/workspace switch follows query client defaults; unverified |
| C4/C5 decisions/receipts | Done | see Package 2: choice frozen entity snapshot, comparison-wide scope label, version-bound receipt | `recordedAgainst` remains a string tag, not a relation |
| D4 choice saving | Done | sync ref lock + validated response (rejects malformed matrix without rendering it) | Server validation limits silent: rationale/name length bounded client-side only |
| Drawer staleness | Done (audit) | `ScoreDetailDrawer` derives from version-bound props; no global store | None found |

## Deferred validation plan (do not run yet)

Mocked contracts first:
1. `publicComparison.test.ts` v2: entity attribution, unsafe URLs dropped, verdict/taxonomy schemas, fail-safe nulls (authored, unexecuted).
2. Publish privacy (`api/_lib/__tests__/public-eligibility.test.ts`, authored, unexecuted): verified pipeline evidence publishes; no-run → `not-pipeline`; single unattributed claim → `unattributed`; payload-level uncited/`javascript:` claims → denied; stored `provenance: "researched"` with zero evidence → denied; incomplete → denied; missing → `unknown`.
3. By-slug: unknown/unattributable → 404 even when `visibility=public`; no-store headers; projected payload has no context/telemetry; fixture with an uncited claim → 404.
4. apiFetch coalescing (`api-identity-isolation.test.ts`, authored, unexecuted): anonymous reads share; authenticated reads never share (same or different principals); credential-resolution failure never shares; abort-signal reads never share; plus earlier items — Request method/headers/CSRF preserved; mutation never retried; abort during backoff stops; long Retry-After fails with when-to-retry message.
5. Receipt: choice save double-click → one POST; malformed response → explicit error, nothing rendered; historical view binds version; choice shows frozen names.
6. Gap/follow-up: shared usage quota counted once; comparison-change resets; abort stops in-flight.

Staging/API:
7. Preview share round-trip incl. publish eligibility 422 copy, unpublish → next GET 404.
8. PWA two-build update re-check unchanged (inputs preserved).
9. Auth journeys on production domain after approved release (separate gate).

Physical:
10. Keyboard-open forms at 320/390/430 + landscape/large text; same-iPhone auth (PR #174 gate, unchanged).

## Migrations

None. Choice provenance rides existing jsonb (`result.recordedAs`, `result.choiceEntities`, `result.recordedAgainst`). No production, price, capability or permission claims changed.
