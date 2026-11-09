# WEB-BATCH-04 — Complete contracts and remaining device-first workflows

Date: 2026-10-27.
State: implementation instructions from read-only review of WEB-BATCH-03. No runtime verification performed.
Mode: large continuous development batch; testing remains deferred by the user's instruction.

## Mission

Finish the incomplete behavior from WEB-BATCH-02/03 before expanding the feature portfolio. Preserve styling, motion, both auth fixes, unrelated work and the separate PR #174 release path. Work across the packages without asking for routine implementation approvals or stopping after each file.

Do not run tests, typecheck, lint, builds or browser/device checks unless the user changes the current instruction. Author focused regression cases if useful but mark them unexecuted. No merge/deployment, live migration, paid research, account changes or external communication. Missing hardware does not block local development.

## Read-only review findings

1. `projectFact()` requires the input entity to be a/b but drops that property from PublicFact and the returned object. The public contract therefore loses which entity each fact describes.
2. Public `verdict` is still `{ ...input.verdict }` and `taxonomy` is passed through as unknown. This is not a recursive allowlist.
3. The projection's comments promise failure for mixed private evidence, but no evidence-provenance/access classification is checked in the function. Removing a top-level context/upload field does not remove private information already summarized into query/facts/verdict/source summaries.
4. Public payload headers include `s-maxage=300, stale-while-revalidate=3600`. Claims that new visits stop immediately on revocation and cached data persists only a few minutes are not established by this cache policy.
5. GET coalescing still keys only on URL and shares the first request's signal. It does not establish identity/header equivalence or independent subscriber cancellation.
6. `useKeyboardInset(false)` does not reset a previously positive inset. The enabled path treats every visual viewport gap as keyboard height, without distinguishing focus/zoom/browser changes, and updates React state on every scroll/resize callback.
7. The receipt uses a `recordedAgainst` tag, but its selected user choice comes from the latest marker in the comparison-wide matrix list. A tag alone does not demonstrate snapshot-specific choice association.

These are source facts and contract gaps; no running exploit, deployed defect or physical-device reproduction is claimed.

## Package A — Complete a safe public record

A1. Preserve fact entity a/b in the typed public schema and returned JSON. Trace the complete public renderer and its shared components so every required public field has defined meaning, defaults and compatibility handling. Do not silently cast incomplete public data to the richer private type.

A2. Replace arbitrary nested verdict/taxonomy copying with explicit versioned schemas. Unknown nested fields must not cross the public boundary. Keep only approved display information. Validate dates, finite numeric values, required labels and safe URL schemes; explain any necessary compatibility defaults.

A3. Implement actual publish eligibility for private/mixed/unknown-origin evidence. Derive authorization/classification from trusted server-side provenance, not a client-supplied boolean or a field-name blacklist. Where the current model cannot establish safe publication, disable publication with a truthful explanation and preserve private viewing. Do not claim a record is safe simply because the source URL is public: the generated query, summaries and claims can contain private context.

A4. Ensure publish, public-by-slug, preview and exports meant for public use share the authoritative projection/eligibility contract. Prefer an authorized server preview when the client cannot determine safe provenance. Keep an existing private export separate from a public redacted representation.

A5. Choose and implement an honest revocation contract. For access-sensitive public payloads, prefer noncached authoritative reads unless a verified invalidation design is available. Check CDN/browser/worker caches and document unavoidable already-downloaded-copy limits. Remove the immediate-stop/few-minutes promise until it is true for new reads under the implemented policy.

A6. Define how old published records are handled after the schema/privacy policy changes. Do not turn an unknown-provenance record into a silently public fallback to avoid a 404. Keep public 404/error responses free of private metadata.

## Package B — Make API behavior scoped and predictable

B1. Coalesce only equivalent read requests. Include relevant authorization/tenant/header semantics or choose not to coalesce requests whose equivalence is uncertain. Token/session changes must not reuse another principal's in-flight response. Never include secrets in diagnostic cache keys/logs.

B2. Cancellation must be subscriber-safe. One caller aborting must not cancel another independent read; an aborted subscriber must stop awaiting even if the shared fetch continues. Avoid coalescing signal-bearing requests if that is the simpler correct contract.

B3. Preserve Request-object semantics where supported: method, headers, credentials and signal must not be inferred as GET from absent init alone. Keep mutation retries opt-in only under a verified idempotency contract. Review React Query mutation retry defaults as well as apiFetch so a higher layer cannot reintroduce replay.

B4. Distinguish a minimum UI polling delay from server Retry-After. A long header should surface a clear retry time without early replay; aborts and timed-out waits must clean up listeners. Keep cost-bearing follow-ups locked until settled and ignore results from obsolete account/workspace/comparison identity.

## Package C — Complete keyboard and layout implementation

C1. Define the keyboard hook's actual output as estimated occlusion, not guaranteed keyboard height. Reset to zero when disabled, consider editable focus and viewport scale, coalesce updates to animation frames, suppress unchanged state, clean up listeners and avoid interpreting ordinary browser chrome movement as a keyboard event.

C2. Apply the refined primitive where necessary to uploads, settings, billing and team forms, in addition to composer/follow-ups. Use a shared form-layout abstraction instead of duplicated large blank spacers. Do not add keyboard padding to already correctly resized content.

C3. Reconcile keyboard/visual viewport with the global notice stack, sticky actions, mobile navigation and modal sheets. Keep focus and typing stable; avoid nested scroll traps. Retain zoom, safe areas, landscape and large-text reachability. Record device behavior as unverified until actual checks run.

C4. Finish desktop evidence/detail density, mobile history continuation and shared loading/error states. Avoid two independently fetched copies of the same receipt in simultaneously mounted desktop/mobile trees where CSS only hides one copy; prefer shared data ownership and scope-correct caching.

## Package D — Bind decisions and historical views correctly

D1. Decide whether user choices belong to a comparison or a specific snapshot. Implement that contract consistently in saving, listing, displaying and exporting. A snapshot tag must be validated and used, or explicitly treated as descriptive metadata rather than a binding.

D2. Historical screens must not label the latest comparison-wide user choice as a choice made for that snapshot. Show the actual association and date, or explicitly label the choice as comparison-wide with different evidence. Keep A/B identity bound to the stored entities so changed entity ordering cannot reinterpret a past choice.

D3. Inspect ScoreDetailDrawer and every historical source/score/receipt panel for stale current-record references. Use stable record/version keys, reset local state and cancel stale work. Unknown historical fields remain unknown rather than silently inherited from the latest record.

D4. Give explicit choice saving synchronous duplicate prevention, validated response handling, correct authorization and clear error/retry semantics. Reuse current jsonb only if the chosen contract can be enforced; author an additive local migration if necessary and mark it unapplied.

## Package E — Finish motion, accessibility and delivery accounting

E1. Complete the prior motion/desktop remainder: coherent transitions on all new dialogs/panels, consistent focus/pressed/pending states, no animation replay on polling, reduced-motion alternatives and immediate primary-action availability. No unrelated heavy effects/library adoption.

E2. Review safe-panel reset behavior for comparison/version changes and async errors; keep shell/primary content available when optional rendering fails. Do not rely on a React boundary to recover an OS-killed browser process.

E3. Update the batch-02/03/04 completion matrix with implemented, partial and blocked items. Existing checks predate these batches and do not validate them. Remove comments/docs that promise stronger safety or durability than their code supports.

E4. Consolidate the deferred verification plan around actual failure cases: public fact attribution, nested private field exclusion, mixed-provenance publish denial, revocation, account switching during coalesced reads, subscriber cancellation, disabled keyboard hook, zoom/chrome changes, historical choice association and cost-bearing mutation replay. Do not execute the checks yet.

## Expected consolidated handoff

Report completed/partial/blocked status by package, user-visible outcomes, file groups, any unapplied schema changes and real remaining limitations. No new feature count inflation. No tests/build/browser/device results may be reported as passed. Continue implementation around optional blocked dependencies without declaring them complete.
