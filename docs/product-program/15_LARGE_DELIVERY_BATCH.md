# WEB-BATCH-02 — Complete decision experience

Date: 2026-10-27.
Mode: large autonomous implementation batch; testing deferred by user.
Owner: SideBy web/PWA implementation agent. Native iOS remains a separate workstream.

## Execution prompt

Implement this entire batch in the current SideBy application. Work continuously across the listed surfaces without pausing after each component or asking for routine design decisions. Deliver working local code, not just a plan. Use reasonable defaults consistent with the existing product and record assumptions. Preserve unrelated working-tree changes and both auth-loop fixes.

Do not run tests, lint, typechecks, builds, browser validation or physical-device checks during this batch: the user explicitly deferred testing. Mark all changes implemented/unverified. Do not interpret deferred testing as a pass. Reading code, reviewing diffs and keeping implementation internally consistent are part of development.

Do not merge PR #174, deploy production, change payment-provider configuration, execute database migrations, send messages to users, or trigger paid research merely to demonstrate a feature. Local code and migration authoring are allowed where needed; applying migrations is a separate release action.

Use applicable AGENTS.md instructions and existing API/auth/analytics conventions. Do not replace the framework, install every visual library, create fake results, or introduce auth bypasses.

## Batch outcome

A coherent mobile-first decision experience with an excellent desktop workbench: complete navigation, reachable input/actions, clear research states, inspectable results, localized failures, and useful decision tools. Preserve the warm dark identity, premium typography, gradients and purposeful motion.

Use the existing implementation in 14_MOBILE_NAVIGATION_AND_NOTICES.md as the foundation. Do not rewrite it from scratch.

## Work package A — Complete mobile shell and interaction system

### A1. Navigation everywhere

Finish mobile marketing navigation across all marketing/legal pages. Keep Home, Features, Pricing, Docs, About and Open workbench reachable, current route clear and close actions large. Align workbench mobile navigation with the same visual language while preserving its existing routes, workspace switcher and advanced destinations. Handle route changes and desktop resize without leaving modal scroll locks behind.

### A2. Safe areas, keyboard and scroll ownership

Consolidate layout ownership for header, bottom controls, notices and safe-area insets. Keep forms and submit actions reachable with long input and keyboard open. Use appropriate viewport units with fallbacks. Fix overflow at its source rather than hiding it globally. Preserve list position when returning from detail views.

### A3. Complete overlay coordination

Extend the shared notice arrangement to relevant sticky decision controls, toasts, menus and dialogs. Preserve update priority and all privacy choices. Ensure small-height layouts have a usable scroll arrangement. Do not hide or automatically accept consent to solve a collision.

### A4. Consistent controls and states

Standardize primary/secondary actions, icon buttons, focus treatment, touch targets, pressed/disabled/pending states and destructive confirmation. Reuse existing primitives. Every async action needs visible pending, success/failure and safe retry behavior. Avoid labels that expose internal implementation details.

## Work package B — Composer and onboarding

### B1. Premium comparison composer

Refine the two-entity and multi-option composers into one coherent visual family. Keep long names, contextual constraints and templates manageable on a phone. Make validation actionable and specific. Preserve entered content on recoverable errors and prevent duplicate submission.

### B2. Useful contextual constraints

Separate optional decision context from required input. Add a clear way to record priorities and nonnegotiable requirements without overwhelming the initial screen. Use existing intent/criteria models where available; do not silently invent factual requirements.

### B3. Seamless start and return

Preserve original query and context through signup/sign-in and onboarding. Keep a draft's account/workspace scope explicit. Show loading identity as loading, never as anonymous. Avoid reintroducing session/reference churn. Do not copy private drafts across accounts or workspaces.

### B4. New-user guidance

Improve empty/onboarding states around one real comparison task. Offer representative starter questions and concise guidance on evidence, uncertainty and saving. Keep onboarding skippable and avoid forced notification permissions or automatic paid work.

## Work package C — Research and results

### C1. Truthful research progress

Make queued/running/partial/completed/failed/canceled states comprehensible. Keep current stage, elapsed time where useful, recovery action and existing evidence visible. Do not invent percentages or imply continuous background browser execution. Preserve server-authoritative foreground reconciliation.

### C2. Verdict and comparison hierarchy

Prioritize decision context, eligible options, verdict, uncertainty and evidence. Make mobile matrices intentionally navigable rather than compressed desktop tables. Preserve access to all criteria and entities. On desktop, support a spacious comparison/evidence relationship without obscuring the main result.

### C3. Evidence inspection

Refine source drawers and fact details with readable links, source dates, claim context and missing/conflicting evidence states. Maintain a clear distinction between supported claims, estimates, user input and model interpretation. Keep private source visibility governed by server authorization.

### C4. History and continuation

Improve history cards, filters, search, favorite/project organization and return navigation. Keep running and failed jobs understandable. Use existing pagination/query boundaries; do not load an unbounded history list or start new research when opening history.

## Work package D — First differentiation bundle

Audit the existing save/version/matrix/decision-intelligence/follow-up implementations before adding duplicate systems. Implement these as substantive extensions with shared data and UI conventions.

### D1. Decision receipt (F01)

Provide a concise saved decision record containing the original question, user constraints, selected option, rationale, evidence references/version and creation date. Distinguish the user's decision from the AI recommendation. Reopen the original record without silently substituting newer facts. Reuse current decision/version storage when it supports this; otherwise author an additive local schema/API change and document the unapplied migration.

### D2. Winner sensitivity (F02)

Allow users to adjust supported dimension weights and inspect how the recommendation changes. Compute results deterministically from existing supported score data. Show a plain-language explanation and preserve original weights. Where numeric input is insufficient, show an unavailable state rather than invented precision. Do not present a score crossover as a probability of real-world success.

### D3. Evidence-gap planner (F06)

Surface decision-relevant unknowns and contradictions with suggested next questions. Derive them from actual missing/contradictory evidence, not decorative generic bullets. Any research action must be explicit, use existing rate limits/idempotency, and display usage implications. No automatic paid research during development.

### D4. Public sharing preview (F19)

Show the exact intended public decision content before publishing. Keep private notes, uploads and hidden fields excluded through server-side serialization, not CSS. Preserve explicit public/private state and revocation. If no suitable public serializer exists, implement it before presenting a reassuring preview.

## Work package E — Resilience and ecosystem consistency

### E1. Optional-panel containment

Add reusable, feature-scoped failure handling for optional charts, evidence visualizations and nonessential ecosystem panels. Keep navigation, primary result content and recovery controls available when a panel fails. Handle async errors explicitly; a React error boundary is not a universal exception handler. Avoid exposing raw stack traces or sensitive provider messages.

### E2. Network and account-state UX

Unify user-facing disconnected, timed-out, unauthorized, forbidden, rate-limited and provider-unavailable states. Respect Retry-After and avoid unbounded retry/reload loops. Do not treat reconnect as permission to replay mutations. Protect against stale responses after workspace/account changes.

### E3. SnapSolve continuity

Make active workspace, plan source and central billing destination clear. Preserve Core entitlement authority and current checkout/portal contracts. Keep unrelated features usable when optional ecosystem calls fail, without granting access or guessing membership. Implement clear unavailable/disabled states rather than new local subscription fallback.

### E4. PWA update and notification settings

Keep install guidance, notification capability/permission states and update availability understandable. Preserve real update/draft protection and bounded recovery. Do not change manifest identity or worker scope casually. Do not claim background delivery guarantees. Do not request push permission on page load.

## Work package F — Motion and desktop finish

### F1. Coherent motion pass

Keep deliberate entry/route/sheet/selection transitions and remove conflicting animation ownership. Use existing GSAP and Motion patterns, scoped cleanup and reduced-motion alternatives. Prevent shell entrances from replaying on polling or minor state changes. Core controls must be usable before decorative sequences finish.

Use selected 21st.dev, React Bits or Magic UI source only after source/license/dependency inspection. Adapt to SideBy rather than importing a second visual identity. No new heavy canvas/background effect on the critical mobile interaction path without later performance validation.

### F2. Desktop workbench polish

Improve spacing, readable density, section navigation and source detail layouts. Preserve keyboard accessibility and responsive behavior between tablet and wide desktop. Keep comparison labels/context visible while inspecting evidence. Do not hide necessary controls behind hover-only interactions.

### F3. Complete microcopy and accessibility implementation

Ensure new controls have labels, dialogs have title/description and focus ownership, progress is announced meaningfully, and selected/error states do not rely on color alone. Use concrete product language and truthful empty/loading/error states. These are implementation requirements; accessibility compliance remains unverified until the deferred review.

## Delivery rules

- Implement all packages as one coordinated batch with internally reviewable file groups.
- Continue around a missing optional dependency; create a proper unavailable state and record the blocker instead of fabricating completion.
- Do not stop the whole batch because physical iPhone QA or production merge remains pending.
- Keep visual work, decision features and backend/schema changes separable for later review and rollout.
- Do not stage or commit unrelated files. Do not publish automatically.
- Existing feature flags and central entitlements govern access; client-only flags never grant paid access.
- Avoid unsolicited package/framework upgrades and broad refactors.

## Completion report

Update the product ledger with implemented/deferred/blocked status per package. Record new migrations as unapplied. State exactly which code changed and which functionality is incomplete. No tests/builds/device checks are to be claimed for this batch.

Return one consolidated handoff with:

1. User-visible changes grouped by package.
2. File groups and migration/dependency requirements.
3. Known limitations and unverified behavior.
4. Deferred validation plan for the completed code.
5. Next large delivery batch proposal.

A long plan, a collection of mockups, or placeholder screens is not completion. Implement real behavior backed by the existing product contracts wherever the required data and authorization are available.
