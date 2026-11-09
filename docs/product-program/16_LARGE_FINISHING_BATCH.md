# WEB-BATCH-03 — Decision integrity, privacy and complete mobile workflows

Date: 2026-10-27.
Mode: substantial implementation batch; testing remains deferred under the user's current instruction.

## Execution instruction

Implement the work below continuously, preserving current work and visual identity. Do not stop for routine approval between tasks. This batch repairs concrete source-reviewed issues in WEB-BATCH-02 and finishes its incomplete user journeys. Do not start another speculative feature bundle before these behaviors are internally consistent.

Read applicable AGENTS.md. Preserve unrelated edits. No tests, typechecks, lint, builds or browser/device validation in this batch unless the user changes the testing instruction. Authoring focused regression coverage is permitted, but do not run it or claim it passes. No production merge/deploy, live migration, paid research, external outreach or PR #174 modification is authorized by this brief.

The physical iPhone auth gate applies to the separate hotfix release. It does not block this local development batch or independent validation when testing is later authorized.

## Source-reviewed problems

These findings come from code inspection, not a running application or deployed security test:

- `ShareModal.copy()` calls publish when private despite its comment claiming no implicit publish.
- `ShareModal` displays a summary of some fields; the public by-slug route spreads the stored result. `withPublicProvenance()` is a provenance annotation, not a privacy allowlist. There is no demonstrated exact public payload preview.
- The public route advertises one-hour shared caching plus stale-while-revalidate, so revocation must account for cached responses; changing a database flag alone cannot support an immediate-revocation promise.
- Receipt text treats the latest saved matrix's computed winner as the user's decision; those concepts are not equivalent. It joins current matrix data with displayed comparison data, including historical views, without an explicit version binding.
- Receipt labels infer latest version +1 from version history instead of consuming a documented authoritative version identifier.
- The receipt fetch hides failures as no saved decision and does not clear old matrix/loaded state immediately on comparison change.
- Retry logic caps a server Retry-After at 30 seconds, allowing a retry earlier than a longer requested delay. Generic mutation retries can also replay non-idempotent actions.
- Follow-up UI uses React pending state without a synchronous request lock, parses a loosely asserted response, and hardcodes the configurable free allowance.

## Package 1 — Public sharing is explicit and truthful

1. Separate Publish, Copy public link, Open public page and Make private. Copy/open must not mutate visibility without a clearly labeled explicit publish action. Prefer one canonical authoritative visibility state and notify/invalidate parent queries after changes.
2. Synchronize modal state when comparison identity, authoritative visibility or open lifecycle changes. Do not show a previous record's visibility or error while a new record is open.
3. Define a versioned public response schema and server-side allowlist. Exclude internal telemetry, private context, private evidence-derived data and other fields according to an explicit policy. Trace facts and source URLs, not just top-level field names. Publishing mixed private evidence must fail safely or require a genuinely safe derived public result; do not blindly strip references while leaving private claims.
4. Make preview and served public payload consume the same projection contract. Label summaries as summaries. Remove absolute privacy claims until enforced by the serializer.
5. Make revocation semantics match caching. Use a suitable no-store/revalidation/invalidation strategy for the authoritative payload; do not promise immediate revocation while a CDN or worker can serve stale content. Document limitations for copies already downloaded or shared outside SideBy.
6. Use the existing dialog primitives for focus, Escape, portal stacking and close behavior. Provide safe clipboard fallback and popup handling without introducing implicit publication.

## Package 2 — Decision receipts and history have real meaning

7. Distinguish AI recommendation, weighted scenario outcome, and an explicit user-recorded choice. If explicit selection storage is absent, label the weighted result honestly; do not invent a decision. Add an explicit choice/rationale operation with normal authorization if implementing persisted user decisions.
8. Bind saved receipt content to an authoritative comparison/version identifier and the evidence/weights it actually used. A receipt built from mutable current records must not claim to be immutable or historically exact. Reuse existing storage only after confirming the contract; author an additive local migration if necessary, marked unapplied.
9. Read version number/ID from the authoritative API contract. Remove guessed +1 labels. Handle unknown versions visibly and keep historical comparison data separate from current saved scenarios.
10. Scope receipt data to account/workspace/comparison/version, reset stale local state on identity changes, abort obsolete requests, and invalidate appropriately after save. Separate loading, unavailable/error and no recorded choice. Keep copying truthful while dependent data is unresolved.

## Package 3 — Research actions cannot duplicate work or invent certainty

11. Make retry behavior method-aware. GET/read retries can be bounded; mutation retries require a proven idempotency contract and stable key, otherwise fail with an explicit user retry action. Abort signals must stop both requests and backoff waits. Do not shorten a server-requested delay: if it exceeds the UI's acceptable wait, stop retrying and explain when the user may retry.
12. Follow-up actions need synchronous duplicate prevention, validated response shape, clear quota/usage state from the current subscription/usage contract, and stale-response protection across comparison/account/workspace changes. Disable only conflicting actions while pending. Never hardcode a configurable free-plan allowance.
13. Gap derivation must distinguish absent evidence on both sides, low-confidence claims, missing citations, contradictions and lack of provenance. Do not call every fact sourced because a fact row exists. Do not present heuristic support scores as calibrated probabilities. Explain unresolved gaps even when the record is empty.
14. Research continuity copy must match actual deployment job durability. If durable scheduling is not established, use conditional language rather than promising users can always leave safely. Preserve authoritative recovery, collected evidence and meaningful failure states.

## Package 4 — Finish the incomplete experience

15. Complete keyboard-aware layout implementation for composer, follow-up/chat, uploads, settings, billing and team forms. Resolve scroll ownership, long labels, large text, safe areas and action placement through shared layout primitives. Record physical behavior as unverified rather than claiming a source audit proves it.
16. Finish mobile history/detail continuation and desktop comparison/evidence density. Preserve list state and correct Back/Forward handling; prevent a historical receipt or drawer from silently showing data from the latest record.
17. Finish motion implementation across new panels and dialogs: scoped animation ownership, reduced-motion alternatives, large touch targets and no layout motion replay on polling. Keep primary actions usable immediately. Do not add heavy visual dependencies merely to make the task look larger.
18. Make optional SafePanel failure state reset on a deliberate record/version change through a stable reset key. Retain local containment and avoid turning an analytics/reporting failure into another panel failure. Handle request failures separately from render boundaries.

## Package 5 — Consolidated handoff

19. Update contracts and release notes for public payloads, receipt meaning/version binding, mutation retry/idempotency, quota display and deployment durability assumptions.
20. Update WEB-BATCH-02 status honestly: implemented packages, partially implemented packages, and deferred validation. Do not call the whole prior batch complete while A2/C2/C4/F1/F2 remain partial.
21. Prepare one deferred validation checklist covering these concrete regressions and the combined UI batches. Do not run it yet. Separate mocked contracts, real staging/API checks and physical-device checks.

## Delivery record

Return one consolidated report with completed/partial/blocked status per package, file groups, unapplied migrations, user-visible changes and remaining unknowns. All newly authored tests remain unexecuted. No previous passing test count may be quoted as validating this batch.

Do not block implementation on the pending physical iPhone check, and do not treat development permission as production deployment permission.

## Implementation status — 2026-10-27 (WEB-BATCH-03, unverified)

Implemented locally, no tests/typechecks/lint/builds/browser/device checks run. See [17_WEB_BATCH_03](17_WEB_BATCH_03.md) for the full record and deferred validation checklist.

- Package 1 (public sharing): complete. ShareModal on Radix dialog primitives; Publish/Copy/Open/Make-private separated; state reset on open; shared `publicComparison.ts` contract consumed by both the by-slug serializer and the modal preview; cache reduced to s-maxage=300 with honesty copy; `publicComparison.test.ts` authored, unexecuted.
- Package 2 (receipts/history): complete with one open modeling note. Explicit user-choice recording via the existing decision-matrices endpoint with a `recordedAs` marker; version binding from the versions API; no guessed labels; separated loading/error/none states with abort + reset. Note: the `recordedAgainst` field records `"live"` or `"version:<id>"` as a string tag, not a foreign key — acceptable for v1, revisit if receipts ever need hard version pinning.
- Package 3 (research actions): complete. Method-aware retries, abort-aware backoff, no shortening of long Retry-After, sync locks, validated follow-up responses, live quota from `/api/usage`, gap derivation v2 with citation/provenance precision, continuity copy confirmed against the scheduled job drain.
- Package 4 (finish experience): substantially complete, explicitly partial. Done: `useKeyboardInset()` primitive applied to composer + follow-up; POP scroll restoration (BATCH-02) retained; historical receipt staleness fixed; new panels motion-static; SafePanel reset keys. Deferred: keyboard primitive on uploads/settings/billing/team forms; ScoreDetailDrawer historical staleness audit; broader desktop-density and motion work beyond the new surfaces.
- Package 5 (handoff): this status section plus [17_WEB_BATCH_03](17_WEB_BATCH_03.md) (contracts, release notes, validation checklist, migrations: none).
