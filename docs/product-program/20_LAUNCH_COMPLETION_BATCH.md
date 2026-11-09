# LAUNCH-01 — One consolidated release-candidate implementation batch

Date: 2026-10-30.
Urgency: upcoming Product Hunt and social teaser/public launch. No launch date is inferred.
Mode: continuous implementation, minimal handoffs, no new speculative features.

## Executor prompt

Finish SideBy's current release candidate as one substantial batch. Resolve the concrete remaining issues, close incomplete existing flows, and return one integrated handoff. Do not respond with another plan instead of implementing. Do not ask for routine approval between tasks or create a new batch document for every small repair.

Read applicable AGENTS.md. Preserve all unrelated work, current styling, both auth fixes and sibling iOS work. The coordinator owns launch timing and production authorization. No automatic merge/deploy, live database mutation, paid research, user outreach or social posting.

Testing is still deferred under the user's last explicit instruction. Author meaningful regression coverage where needed but do not run tests, typechecks, lint, builds or browser/device checks until that instruction changes. Keep every new result labeled unverified. Deferred verification must not be described as release readiness.

## Track 1 — Finish the two actual safety boundaries

### 1. Public privacy is independent of evidence attribution

Current source checks completed ai_runs and HTTP(S) fact citations. Those establish pipeline provenance and attribution, not absence of private user context in the published question, summaries, facts or verdict. Fix the model rather than adding another misleading classifier name.

Choose the smallest enforceable implementation:

- Store/consume trustworthy input and evidence classification from the server-controlled generation path.
- If public-only input/evidence cannot be established, deny publication and public serving of the record, with a clear reason.
- A record derived from private briefs/uploads/notes requires a separate approved public snapshot generated from authorized public inputs, or remains unpublishable. Do not pretend field stripping or a regex proves safety.
- Ensure read and publish paths use the same eligibility policy. Do not grandfather unknown-origin records into public availability silently.
- Keep the public projection recursively allowlisted and fact entity attribution intact. Verify semantic consistency through source review and author adversarial coverage with confidential context plus otherwise valid public citations.
- Confirm public claim/source correspondence rather than merely checking that some valid URLs exist. Clearly distinguish attribution from fact truth or source accessibility.

Do not loosen classification merely to preserve a launch demo. Use a deliberately reviewed public example if real private records cannot safely be shared.

### 2. Eliminate the remaining credential race in request sharing

The current coalescing gate resolves anonymous status, while executeFetch resolves credentials again and sends cookies by default. A call admitted into the anonymous bucket can therefore become authenticated before dispatch. The documented residual claiming this is necessarily an anonymous response is not established by the code.

Fastest safe choice: remove generic apiFetch request coalescing for the release candidate and rely on correctly scoped React Query ownership. This avoids another identity/cache implementation while preserving duplicate-submission protection separately.

If retaining any coalescing, restrict it to an explicit public-read API with no Authorization and credentials omitted, using a captured immutable request context. Authenticated/cookie-bearing reads never enter the shared bucket. Credential failure remains an isolated request/error, not a shared anonymous identity. Never log tokens or key material.

Author cases for token change between classification and dispatch, cookie-only identity, token lookup error, different retry policies, account/workspace change and independent cancellation. Do not disable server authorization or mutation idempotency while simplifying reads.

## Track 2 — Close the existing user journeys in one pass

3. Finish remaining uploads/settings/team/billing/chat keyboard and scroll integration. Keep shared layout ownership; remove duplicate spacers and focus jumps. Hardware-specific behavior remains unverified.
4. Finish desktop comparison/evidence density and mobile history continuation without hiding required information or loading unbounded records.
5. Finish source/error/empty/loading states and remove stronger claims than the implemented behavior supports. In particular, scheduled draining is not proof every accepted research job survives every termination/deploy.
6. Align decision receipts with the explicit comparison-wide choice contract, frozen entity names and authoritative historical evidence. Do not imply a string tag creates a relational snapshot binding.
7. Ensure every mutation has a synchronous duplicate guard where needed, normal authorization, server validation and honest failure/retry UX. Review JSONB marker/rationale/entity fields server-side rather than trusting client validation.
8. Finish optional-panel isolation and stable reset keys. Keep meaningful content accessible if charts, ecosystem widgets, analytics or follow-up loading fail.
9. Finish shared overlay/menu/dialog behavior: cookie choices, update prompt, toasts, workbench actions, keyboard, Escape, focus return, safe area and reduced motion.
10. Preserve polished transitions while removing animation ownership conflicts and repeated entrances. Do not add more dependencies or decorative effects before resolving these workflows.
11. Author the missing evidence-gap derivation cases and update existing fixtures/contracts for public projection, receipt meaning and API behavior. Leave authored checks unexecuted while testing is deferred.
12. Reconcile SnapSolve workspace/entitlement messages with actual service states. No local paid fallback, unknown-membership guess or silent unlimited allocation.

## Track 3 — Prepare the launch material without overstating readiness

13. Use 21_LAUNCH_COPY_DRAFTS.md as a draft starting point. Align claims with the exact candidate's capability matrix; don't promise native/PWA feature parity, universal accuracy, millions-user capacity or full device verification.
14. Prepare a deterministic non-sensitive comparison example for a future demo. Identify any data fixture as illustrative. Do not present hand-authored evidence as live research or generate paid results automatically.
15. Prepare capture targets: mobile landing, filled composer, useful result, evidence detail, explicit decision receipt, desktop workbench and ecosystem continuation only if actually implemented. Do not fabricate screenshots or metrics.
16. Document where sign-in, comparison creation, billing and sharing may be unavailable. A public landing demo is not a working paid product funnel.
17. Prepare support/incident contact routing, launch issue triage, known-limitations page content and rollback notes. Use existing channels; do not send messages or create public accounts.
18. Record central billing, plan limits and checkout origin from the authoritative catalog. Do not publish guessed pricing, a launch discount or unlimited usage.

## Track 4 — One consolidated validation handoff

19. Produce a bounded inventory of changed tracked/untracked files and dependencies. Preserve ownership and prepare reviewable groups without staging or committing unrelated work.
20. Mark every current item implemented/partial/blocked/unverified in the existing ledger. Do not open another speculative feature batch.
21. Prepare one combined validation command/fixture matrix: local types/lint/unit/build → browser contracts/worker update → configured staging/auth/billing/privacy → physical device. Wait for explicit testing authorization before executing it.
22. Separate production hotfix PR #174 status from uncommitted UI/feature batches. Do not infer merge authorization from launch urgency. Current remote state must be read again before any release action.
23. Return one handoff with actual code completed, residual blockers, unexecuted verification, migrations if authored, preview/release dependencies and launch copy status. Avoid generic all-complete claims.

## Stop adding work to the critical path

No additional thirty-feature expansion, broad framework upgrade, new payment system, native rewrite or speculative infrastructure migration. Move discovered low-risk polish to the backlog and keep true auth/privacy/payment/data-loss blockers on the release path. A documented incomplete feature can be hidden or excluded from launch; a misleading implemented feature cannot be marketed as finished.
