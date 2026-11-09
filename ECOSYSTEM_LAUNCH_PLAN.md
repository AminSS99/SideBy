# SideBy and Snap ecosystem — launch-readiness plan

**Updated:** 2 October 2026  
**Scope:** SideBy as a fully usable comparison product, then a verified shared workspace, subscription, and SnapPoints experience across SnapSolve, Orizonte, Rallia, and future products.  
**Status:** execution plan, not a claim that the release gates below have passed.

## The promise to launch

A new visitor can understand SideBy, try a real comparison, inspect evidence, save a decision, return to it, and know what the shared Snap plan gives them. A person who also uses Orizonte or Rallia can reach those products from one Snap workspace with the same plan and a coherent SnapPoints balance. Every step must work in production for a new account, a returning account, a free account, and a paid account before it is advertised as a finished ecosystem.

Keep product boundaries clear: **SideBy** owns comparison and decision data; **SnapSolve Core/Cockpit** owns canonical ecosystem identity, workspace mapping, billing, entitlements, and points; **Orizonte** owns subscription-management data; **Rallia** owns event data. Stackfold and Attest are independent open-source developer tools today; do not describe them as paid-plan features or require a Snap subscription to use them.

## Current evidence and unresolved claims

| Area | In the code or local record | What remains unverified for launch |
| --- | --- | --- |
| SideBy core | React/Vercel app, eight-step research pipeline, cited facts, follow-ups, refresh, exports, public/private results, projects and workspaces. `product-hunt-readiness.md` records local remediation and 138 unit / 30 E2E tests passing on 7 September. | Re-run gates on this dirty checkout; run a **real** comparison through deployed providers and review each citation, cost, retry, export, and sharing path. Synthetic or seeded examples are not proof of research quality. |
| SideBy UX | Auth, comparison, settings, team, billing, PWA/push work exist. Many files are currently modified or untracked. | Confirm current build, migration, auth, mobile install/offline/push, keyboard access, and cross-browser behavior after the in-progress changes. Preserve that work; do not assume it is deployed. |
| Ecosystem bridge | `frontend/api/_lib/snapsolve-core.ts` implements signed workspace/entitlement requests and an event outbox for `sideby.comparison.completed` and `sideby.decision.saved`. SnapSolve Core has workspace links, product entitlements, and event-to-points migrations. Orizonte and Rallia have their own bridges. | Prove all services are configured against the **same production identity and workspace**, and that events, access changes, and points propagate correctly end to end. A bridge in source is not a production integration test. |
| Billing | SideBy's current pricing UI points to SnapSolve plans; checkout/portal routes point to Cockpit. Orizonte documents SnapSolve as production billing authority. SideBy still has a legacy local Dodo webhook and subscription fallback. | Retire SideBy's webhook delivery and local paid-access fallback, then verify central Dodo checkout, entitlement activation, cancellation, and portal return on deployed systems. Historical billing migrations remain upgrade history. |
| Rewards | SnapSolve has SnapPoints ledger, action definitions, reward catalog/redemptions, and mappings for SideBy comparison and saved-decision events. | Verify idempotent awards, limits, reversals/corrections, account linking, visible history, and redemption fulfillment in production. Do not promise spendable rewards or card ranks until those journeys work. |

The older `SIDEBY_PRODUCT_ROADMAP.md` and `SNAPSOLVE_MASTER_PLAN.md` contain useful ideas and old failure reports, but are not evidence that a problem is still present or that a feature is ready. Reproduce findings against the current checkout and production. The September `product-hunt-readiness.md` records fixes locally, with external verification still pending.

## P0 — Make SideBy trustworthy and fully usable

1. **Create a release baseline.** Preserve the current dirty tree, list changes by feature, reconcile migrations, and run `pnpm lint`, frontend and API typechecks, `pnpm test`, `pnpm run build`, SEO validation, E2E, and a high-severity dependency audit from `frontend/`. Record exact results in a new release evidence log. Resolve failures before claiming a candidate build.
2. **Complete the new-user journey in staging, then production.** From a clean browser: land on SideBy → enter a real decision → sign up/sign in with email and a social provider → return to that decision → create/select workspace → run comparison → inspect facts and source links → save verdict → revisit history → ask follow-up → export/share → sign out/in and recover state. Cover a guest/public-result reader as well. No silent 500s, lost prompts, wrong tenant, or infinite research state.
3. **Prove research quality.** Sample real comparisons in at least three categories. For each, manually audit a set of factual claims against the exact cited page and date; reject broken, generic, outdated, inaccessible, or unrelated citations. Show uncertainty and missing evidence honestly. Keep seeded comparisons visibly marked illustrative. Measure source-link success, unsupported-claim rate, cost, and time to a useful verdict.
4. **Make results durable and safe.** Verify current and legacy result shapes, public-by-slug pages in the sitemap, refresh/version history, retries, cancellation, partial failures, duplicate jobs, and exports. Public links must reveal only curated public content, never private notes, uploads, AI traces, user data, or raw internal rows. Tenant and API-key authorization tests must cover owner/member/outsider cases.
5. **Finish mobile and accessibility.** Test primary journeys at narrow widths and mobile Safari/Chromium, including auth, loading, result tabs, fixed navigation, keyboard opening, dialogs, and PWA installation. Confirm offline messaging is honest about what works offline; test push permission, delivery, and opt-out only if push is shipped. Require meaningful accessibility assertions, keyboard completion, visible focus, reduced motion, and readable contrast.
6. **Operational hardening.** Verify migrations and rollback on a staging copy, provider timeouts/fallback, job cost and quota ceilings under concurrent load, rate limits, Sentry/logs, support path, privacy/data export and deletion, and backup/restore. Run a launch-traffic rehearsal and define who can pause expensive research if providers fail.

**SideBy release gate:** a new user can complete the full decision journey on production without help; real source audits meet an agreed quality threshold; mobile and accessibility checks pass; no known P0 data, auth, billing, or result-rendering defect remains. Record observations, not just passing test names.

## P1 — One workspace and one subscription

**Canonical authority:** SnapSolve Core/Cockpit owns identity links, canonical workspace ID, product enablement, plan, and entitlements. Product databases retain their own records and store a correlation to the canonical workspace. Do not use email alone as proof that two accounts belong to the same person; use verified identity linking and explicit recovery for mismatches.

| Journey to prove | Owner(s) | Acceptance evidence |
| --- | --- | --- |
| Create a new SideBy account and workspace | SideBy + SnapSolve | One canonical Snap workspace is created or linked exactly once; SideBy data stays in its own database; refresh/retry does not create duplicates. |
| Enter Cockpit, Orizonte, then Rallia from that account | All four products | The same person reaches the intended workspace and sees only products and data they are entitled to. Existing accounts can link without losing data. Document any separate sign-in step instead of claiming seamless SSO prematurely. |
| Choose a Snap plan and enable SideBy | SnapSolve billing/Core + SideBy | One checkout and one central subscription record determine access. SideBy enforces the signed entitlement server-side for paid features and quotas. Free access remains usable without checkout. |
| Change, cancel, refund, or fail payment | SnapSolve billing/Core + all products | Idempotent webhook processing updates one authority; SideBy, Orizonte, and Rallia converge within a documented cache/grace window. A stale local billing row cannot restore paid access. |
| Invite a teammate or change roles | Cockpit + products | Membership and role changes are reflected in each product; removing a member revokes data access. Cross-workspace comparisons/exports cannot leak. |
| Billing and support | SnapSolve + products | Price, included products, limits, renewal, invoice, cancellation, and support route agree across marketing, checkout, Cockpit, and product UIs. Only SnapSolve Core processes Dodo lifecycle events. |

Before enabling shared paid access, freeze a **single plan/entitlement matrix** for Flow, Pulse, Core, and Orbit: active products, SideBy daily limits, AI credits, workspace count, team seats, and reward promises. Generate copy and tests from that matrix where practical. Clearly label invitation-only or future tiers; never sell an unavailable benefit.

## P2 — SnapPoints and rewards after the core journeys work

1. Use server-side, verified lifecycle events only. SideBy emits completed comparison and saved-decision events through its outbox; SnapSolve validates product signature, event ID, version, user/workspace mapping, and eligibility before awarding. Retry the same event and prove it awards once.
2. Show one user-visible balance and ledger in Cockpit, with the source app, action, date, pending/confirmed state where needed, caps, and a route for support corrections. SideBy may show a compact earned-points confirmation and link to Cockpit; it must not keep a second authoritative balance.
3. Prevent reward farming: no award for failed/cancelled jobs, repeated empty comparisons, duplicate decisions, or self-generated test traffic. Test daily/lifetime caps and abuse handling without penalizing legitimate retries.
4. Prove redemption end to end: balance debit, reward reservation, fulfillment in the target product, failure refund/reconciliation, history, and entitlement expiry. Publish only rewards that can actually be fulfilled. Cosmetic cards and ranks can follow the same ledger but should not imply a credit card or monetary value.
5. Add cross-product missions only after at least two products have verified event flows. A person should understand exactly which action earns points and what they can redeem; points should reward useful behavior rather than force app switching.

**Rewards gate:** a real account earns in SideBy, sees the same transaction in Cockpit, redeems a real benefit, and sees the correct state in another product. Replay, cancellation, account merge, and support correction tests pass.

## P3 — Product Hunt and public launch

Launch **SideBy** as a usable decision product, with Snap as the ecosystem behind it. Do not wait for every future app, and do not imply the entire ecosystem is finished because the catalog is large. If shared billing or rewards are not fully verified by launch day, market only the working SideBy experience and label the rest upcoming.

| Gate | Done when |
| --- | --- |
| Access | The Product Hunt destination opens the actual product. A new visitor can use the free path without an invitation or surprise checkout. Working public examples are clearly identified as illustrative or live research. |
| Message | A one-sentence explanation says what SideBy does, who it helps, and why source-backed decisions matter. Website, Snap catalog, pricing, docs, onboarding, and Product Hunt copy agree about availability and limits. |
| Listing | Prepare a plain product name, concise tagline, description, square thumbnail, at least two gallery images, optional real demo video, maker profiles, pricing status, and a first maker comment that asks for feedback. Use the current [Product Hunt preparation guide](https://www.producthunt.com/launch/preparing-for-launch) and [featuring guidance](https://help.producthunt.com/en/articles/9883485-product-hunt-featuring-guidelines) immediately before submission because platform rules may change. |
| Trust | Show a real researched comparison and inspect every visible citation. Remove unsupported performance, security-certification, user-count, and AI-accuracy claims. Privacy, terms, support, status, and deletion/export routes are reachable. |
| Operations | Deploy a tagged candidate; run production smoke for auth, compare, save, share, export, upgrade/cancel if sold, and points if advertised. Record rollback steps, incident owner, provider budgets, and monitoring dashboard. |
| Response | Maker/support team is ready to answer questions, fix critical issues, and record feedback. Measure activation, completed decisions, citation trust, retention, paid conversion, and cross-product adoption separately. |

Suggested order: **SideBy P0 → workspace/identity proof → one central paid-plan proof → SnapPoints proof → launch assets and rehearsal → Product Hunt submission.** A release can proceed earlier only by narrowing its public promise to what has been verified. Do not invent a launch date from this plan.

## First execution batch

- Reconcile the current SideBy working tree with `product-hunt-readiness.md`; run the complete local gates and record a dated baseline.
- Run one real staging comparison and one production comparison, checking citation accuracy, failure recovery, and full new-account journey.
- Verify SideBy billing docs and live routes agree on SnapSolve as the production authority; test the central Dodo flow.
- Write and test the shared plan/entitlement matrix against SnapSolve Core and the SideBy/Orizonte/Rallia bridges.
- Execute one cross-product account and workspace test, then one purchase/cancel test, then one earn/redeem points test. Save only redacted evidence in launch notes.
- Recheck the Product Hunt content checklist only after the product and ecosystem promises match these observed journeys.

## Evidence log to fill during execution

| Date / build | Environment | Journey | Result and evidence | Owner | Open issue / next action |
| --- | --- | --- | --- | --- | --- |
| Pending | Local | SideBy build, types, lint, tests, E2E, audit | Not rerun for this plan | SideBy | Capture baseline |
| Pending | Staging | New-user comparison and source audit | Not verified | SideBy | Run with real providers |
| Pending | Production | Shared identity, workspace, and one plan | Not verified | SnapSolve + products | Verify configuration and flows |
| Pending | Production | SideBy event → SnapPoints earn → reward redemption | Not verified | SnapSolve + SideBy | Test after access is stable |

This plan is intentionally a **gate document**. Existing source code and local tests show progress; only executed end-to-end evidence closes a launch item.
