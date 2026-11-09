# SideBy PWA follow-up: implementation brief for an AI coding agent

Prepared: 2026-10-09
Status: required fixes identified by independent source/build inspection.

## Objective

Fix the remaining PWA registration, duplicate-job locking, and draft isolation defects. Preserve SideBy's design, animations, research features, billing authority, and existing improvements. Implement and verify the changes; do not stop at a plan.

Read applicable AGENTS.md instructions first. Inspect git status and preserve existing changes. The checkout contains substantial modified and untracked work. Do not reset, clean, or overwrite it. Read `docs/SIDEBY_NEXT_PWA_AI_EXECUTION_GUIDE.md` for the broader product requirements.

## Independently established baseline

On 2026-10-09, the following commands passed in `frontend/`:

- `pnpm run typecheck`
- `pnpm lint`
- `pnpm test`: 20 files, 144 tests passed.
- `pnpm exec playwright test`: 108 passed across desktop Chromium, mobile WebKit, and mobile Chromium.

These results do not establish production PWA correctness. The browser suite does not currently catch the broken worker-registration import, exhausted lock retries, or cross-account draft restoration. Physical iPhone behavior remains unverified. Recheck the current state rather than assuming files are unchanged.

## Priority 1: restore production service-worker registration

### Defect

`frontend/src/lib/pwa/register.ts` imports a variable containing `virtual:pwa-register` with `/* @vite-ignore */`. The inspected built asset retains `import(e)` where `e` is that virtual specifier. The browser cannot resolve that bare virtual module. The surrounding catch silently suppresses the failure.

Generating `dist/sw.js` is insufficient: the page must successfully register it and become controlled.

### Implementation

1. Restore a Vite-resolvable import of the virtual PWA module. Prefer the normal static import, or a literal dynamic import supported by the installed plugin. Remove the Vite-ignore workaround.
2. If tests cannot resolve the virtual module, fix the test boundary or mock the registration adapter. Do not alter production imports merely to make unit tests pass.
3. Preserve prompt-based updates, draft handling, and graceful behavior when service workers are unsupported.
4. Make registration failures observable through an appropriate existing reporting path without logging sensitive data or interrupting ordinary web use.
5. Audit that there is one intended registration for the application scope and no competing registration path.
6. Verify current plugin/browser behavior against official documentation if needed. Use installed types and package code for implementation details.

### Required verification

- Build the real production application, with test auth disabled, into an isolated output directory if necessary to avoid disrupting other work.
- Serve that production artifact on localhost or HTTPS in an isolated browser profile. Do not reuse an unknown running server.
- Assert `navigator.serviceWorker.getRegistration()` returns the expected registration and scope after registration completes.
- After a controlled reload, assert `navigator.serviceWorker.controller` is present.
- Confirm the built client does not retain an unresolved `virtual:pwa-register` import.
- Load the public shell online, then go offline and navigate/reload within its documented offline contract.
- Verify APIs remain network-only and cannot receive the SPA shell as a response.
- Verify registration failure leaves the ordinary application usable.
- Exercise the update prompt with two actual builds/workers, including unsaved input. Mocked store tests alone are insufficient.

## Priority 2: fail safely when the comparison intent lock is unavailable

### Defect

In `frontend/api/_lib/sideby.ts`, acquisition retries can end with `lock` still null. Execution then enters the creation path. If the lock holder has not yet inserted a discoverable comparison, both requests can create jobs.

The lock TTL can also expire while the protected work is still running. Review how much work occurs inside the critical section before claiming serialization is guaranteed.

### Implementation

1. Preserve the lookup scope: authenticated user, workspace or null, project or null, canonical intent.
2. Require a successfully acquired lock before reaching any new-job insertion or pipeline scheduling in the protected path.
3. On contention, a request may return an already-created authorized job. If no job is visible and the lock cannot be acquired within the bounded wait, return a deliberate retryable response through existing error conventions. Include a useful retry delay where appropriate.
4. Never fall through to unprotected insertion because contention, lock storage failure, or timeout occurred.
5. Review lock TTL, renewal, and ownership-safe release. Keep the critical section short or provide appropriate durability. Do not simply increase the TTL without considering slow operations and expiry.
6. Inspect Redis and Postgres fallback semantics: acquisition and release must be atomic and release must verify ownership.
7. Consider a database-enforced idempotency claim if it is needed for correctness after lock expiry. Avoid production migrations during local verification.
8. Preserve usage limits and prevent duplicate requests from scheduling extra research or generating extra billable work. Inspect whether expensive work occurs before the lock and describe any remaining limitation.
9. Confirm whether other options besides canonical slug change the comparison intent. Do not coalesce distinct user requests accidentally.

### Required tests

- Lock stays unavailable for every retry and no existing job appears: zero inserts and zero pipeline scheduling; explicit retryable outcome.
- Winner inserts while loser waits: loser returns the same job ID.
- Same user and query in different workspaces or projects: independent jobs.
- Null workspace/project scope: no accidental matching with another scope.
- Different user with identical query: no reuse of private job.
- Failure inside the protected section: ownership-safe release occurs.
- Lock expiry/slow winner: demonstrate the chosen protection prevents duplicate creation, or record the remaining release blocker.
- Lock backend unavailable: no silent unsafe fallback.

Retain fast mock tests, but distinguish them from integration evidence. If distributed correctness is claimed, run a focused concurrency check against isolated test infrastructure using concurrent requests and an intentionally delayed winner. Do not use production data or paid provider calls.

## Priority 3: isolate drafts and make save failures honest

### Defect

`frontend/src/lib/pwa/register.ts` persists drafts under one sessionStorage record. Composer keys such as `composer` and `bracket_composer` are generic. Restoration is not tied to account or workspace, and auth cleanup does not explicitly clear that store. The same tab can restore a previous account's input after switching accounts.

The save function swallows failures while update UI promises preservation. Some sessionStorage access occurs outside try/catch. A blocked storage getter can itself throw.

### Implementation

1. Define a typed draft envelope with schema version, creation time, draft kind, and scope.
2. Scope authenticated drafts to account and workspace, adding project or route identity where needed. Use a separate explicit anonymous scope.
3. Do not restore authenticated drafts until identity and workspace resolution are complete. Never treat transient loading as anonymous identity.
4. Clear or deliberately partition draft state on sign-out, account switch, membership removal, and workspace change. Prevent stale responses or mount effects from restoring old-scope data.
5. Define bounded retention and size limits. Store only fields needed to restore the form; never tokens or entitlement state.
6. Validate parsed data at runtime. A generic TypeScript cast is not validation. Reject malformed, wrong-version, expired, or mismatched-scope records.
7. For legacy unscoped authenticated drafts, discard them safely rather than guessing ownership. Document the migration choice.
8. Wrap all browser-storage access, including property access, in guarded error handling.
9. Return a meaningful save result. If preservation fails, keep dirty input and offer retry or an explicit user decision before losing it. Do not silently reload after claiming the draft was saved.
10. Ensure automatic chunk-error recovery follows the same policy. If error-boundary cleanup prevents saver registration from surviving, choose a lifecycle that preserves eligible input before it is discarded. Verify the actual component lifecycle.
11. Preserve drafts for the relevant active forms. Where a form cannot be preserved, avoid a blanket promise that all input is protected.
12. Do not overwrite unrelated valid draft records when saving one active form. Clear consumed records after successful restoration.

### Required tests

- Same account/workspace reload restores a valid draft.
- Account A saves; account B opens the same composer in the same tab: no A data appears.
- Workspace A saves; workspace B opens composer: no A data appears.
- Identity is loading: no premature restoration or anonymous migration.
- Sign-out clears or makes authenticated drafts inaccessible according to the documented policy.
- Anonymous draft behavior follows an explicit policy when signing in.
- Malformed JSON, wrong schema, expired record, wrong field types, unavailable storage, throwing storage getter, and quota errors recover safely.
- Saving one draft preserves unrelated valid records.
- Failed save blocks automatic reload when dirty work would be lost.
- Successful update restores fields in the real composer after an actual reload.
- Chunk-load failure with a populated composer preserves recoverable input or presents a truthful safe recovery action.

## Test and release discipline

Add regression tests that fail on the original defects and pass after the fixes. Do not merely assert the presence of configuration strings.

Run from `frontend/`:

```sh
pnpm run typecheck
pnpm lint
pnpm test
pnpm exec playwright test
```

Also run a normal production build and the dedicated production worker lifecycle tests. Existing E2E fixtures may rely on a test-auth build; keep that artifact separate from the production PWA checks. Never deploy test-auth assets.

Record the exact server command, build mode, browser profile, test output, and artifact used. Avoid existing-server reuse for lifecycle verification. Distinguish mocked APIs, isolated backend integration tests, and actual browser behavior.

Physical iPhone checks remain a separate pending gate: Safari and installed launch, Add to Home Screen, keyboard and visual viewport, safe areas, landscape, VoiceOver, background/foreground recovery, and update recovery. Do not claim these are tested through Playwright emulation.

## Documentation corrections

Update `docs/PWA_MOBILE_QA.md` and `docs/PWA_RELEASE_RUNBOOK.md` with new evidence and limitations. Separate source inspection, unit mocks, browser execution, backend integration, and physical-device checks.

Remove unsupported claims of guaranteed duplicate prevention, universal draft preservation, physical iPhone verification, or production readiness. Do not describe files as committed while they remain modified/untracked.

Do not change billing, remove features, rewrite the app shell, or alter the visual identity as part of these fixes. Preserve meaningful transitions and existing usability improvements.

## Definition of done

- Production client successfully registers and is controlled by the intended worker.
- Real update and offline lifecycle checks pass on a production artifact.
- No job insertion occurs without the chosen concurrency guarantee.
- Exhausted lock retries produce a safe retryable outcome.
- Draft restoration respects account/workspace boundaries.
- Failed draft preservation does not silently discard dirty work.
- Regression tests cover the actual defects.
- Existing typecheck, lint, unit, and browser suites pass.
- Documentation reports actual evidence and remaining limitations.
- No deployment or database mutation is performed merely because this brief exists.

## Prompt to give the implementing AI

> Implement `docs/PWA_FOLLOWUP_FIXES_AI_BRIEF.md` completely, following applicable AGENTS.md instructions and preserving the current working tree. Fix production service-worker registration, unsafe comparison-lock fallthrough, and account/workspace draft isolation. Add regression tests for the original failures, verify the real production worker lifecycle, rerun existing checks, and update QA/runbook evidence. Preserve SideBy's design and transitions. Report what changed, what was independently tested, and any remaining blockers. Do not claim physical iPhone or production readiness without the corresponding evidence.
