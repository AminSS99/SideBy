# SideBy Product, UX, Security, and Growth Roadmap

Date: 2026-07-31

This is an execution specification for another implementation agent. It is based on repository inspection, current screenshots, production checks, build/test results, and a repository-wide security review. It deliberately separates release blockers from product expansion.

## 1. Product thesis

SideBy should not feel like “a chatbot that makes tables.” It should feel like a decision workbench:

1. State the decision.
2. Define the context, constraints, and priorities.
3. Research with traceable evidence.
4. Show the verdict and uncertainty.
5. Let the user challenge assumptions.
6. Preserve the decision, collaborators, and changes over time.

The core metric is not comparisons generated. It is defensible decisions completed.

## 2. Current-state evidence

### What is already strong

- The visual identity is distinctive and coherent on desktop.
- The landing-page task is understandable and keyboard reachable.
- The product already includes a large portion of the expected SaaS foundation: Clerk auth, workspaces, projects, teams, uploads/RAG, comparison history, prompts, research, chat, analytics, billing, notes, versions, watchlists, API keys, webhooks, multi-option brackets, decision matrices, public links, exports, an embeddable widget, a service worker, and a browser extension.
- Production build, TypeScript, ESLint, 114 unit tests, and 30 Playwright tests pass.

### Confirmed gaps

- A live public comparison linked from the production sitemap crashes with `Cannot read properties of undefined (reading 'flatMap')`.
- The public-result renderer assumes `result.categories` always exists; legacy or partial rows are not normalized or schema-versioned.
- The fixed mobile marketing navigation overlaps the main comparison CTA. The filled composer makes the overlap more severe.
- Playwright runs only Desktop Chrome. There is no mobile project.
- Accessibility tests collect axe violations but only assert that the result is an array; they do not require zero violations.
- E2E output contains repeated refused API proxy calls while the suite still passes, so important network failures are being masked.
- The smoke test checks only that a public comparison returns an HTTP response below 500; it does not render or validate the result.
- `pnpm audit --audit-level high` fails: 22 known vulnerabilities, including 9 high severity.
- Production bundles include several large chunks: observability ~479 kB, charts ~278 kB, analytics ~215 kB, and animation chunks ~179–194 kB before gzip.
- Security review found credible authorization, tenant-boundary, SSRF, privacy, cache-isolation, quota, and legacy-service risks. Use the generated security report as the authoritative detail once implementing the security wave.
- Product/deployment documentation has drift: Paddle, Dodo, and SnapSolve-managed billing are all described in different places; Neon/Drizzle and older Supabase/Java paths coexist.

## 3. Priority model

- P0: production correctness, security, privacy, data loss, broken primary flows, mobile blockers.
- P1: trust, accessibility, reliability, performance, and daily-use UX.
- P2: differentiation, collaboration, automation, integrations, and growth.
- P3: enterprise, ecosystem, and advanced intelligence.

Do not begin P2 or P3 work until the P0 release gate is green.

## 4. Wave 0 — release blockers

### R0-01: Version and normalize comparison results

- Introduce a Zod `ComparisonResultSchema` and a numeric `schemaVersion`.
- Validate new results before persistence.
- Create one server-side compatibility adapter for every read path.
- Normalize missing `categories`, `facts`, `sources`, `dimensions`, `telemetry`, and optional verdict fields to safe defaults.
- Backfill or lazily upgrade legacy completed rows.
- Make public-by-slug, authenticated detail, versions, export, diff, watchlist, and follow-up paths consume the same normalized shape.
- Add fixtures for legacy, partial, malformed, current, and future-version payloads.
- Acceptance: every URL emitted into the sitemap renders without an error boundary; no renderer directly trusts raw JSONB.

### R0-02: Repair production public comparisons

- Remove or repair stale sitemap entries.
- Add a production smoke check that loads every generated public URL and waits for a visible verdict or a deliberate “not found” state.
- Add synthetic monitoring for one canonical public comparison.
- Replace generic raw error output with a recoverable state and incident ID.
- Acceptance: no sitemap URL produces a runtime exception or infinite loading state.

### R0-03: Fix all fixed-layer mobile collisions

- Define shared CSS variables for safe area, marketing nav height, app nav height, sticky decision bar height, cookie banner, and keyboard inset.
- Give page content enough bottom padding whenever a fixed bar exists.
- Ensure the comparison CTA scrolls fully above the bottom nav.
- Coordinate the app bottom nav, sticky decision bar, drawers, toasts, cookie consent, and virtual keyboard.
- Test at 320×568, 360×800, 390×844, 412×915, landscape, 200% zoom, and iOS safe-area simulation.
- Acceptance: no actionable control is covered, clipped, or unreachable.

### R0-04: Make accessibility tests real

- Change axe assertions to `expect(violations).toEqual([])`.
- Cover landing, sign-in, onboarding, composer states, history, completed result, public result, uploads, team, settings, and billing.
- Test keyboard-only flows, focus restoration for drawers/dialogs, skip link, visible focus, error summaries, live regions, reduced motion, and 200%/400% zoom.
- Replace low-contrast `text-white/25`, `/30`, and `/35` for meaningful copy with tokenized WCAG-AA colors.
- Acceptance: automated WCAG 2.2 AA checks pass and a manual keyboard checklist is recorded.

### R0-05: Add mobile browser coverage

- Add Playwright projects for iPhone-class Safari/WebKit, Pixel-class Chromium, and a narrow 320 px viewport.
- Exercise the composer with the keyboard open, research progress, result tabs, drawers, share/export, uploads, history filters, onboarding, and bottom navigation.
- Add screenshot assertions for fixed-layer collisions.
- Acceptance: the same core journey passes desktop Chromium, mobile Chromium, and mobile WebKit.

### R0-06: Stop masking network failures in E2E

- Fail tests on unhandled console errors, page errors, failed requests, and unexpected 5xx/connection-refused responses.
- Explicitly mock every intended API call or run the real Vercel function layer.
- Add contract tests between mocked fixtures and API response schemas.
- Acceptance: the suite emits no unexpected proxy errors and fails when a required API is unavailable.

### R0-07: Clear dependency vulnerabilities

- Upgrade direct packages and regenerate the lockfile.
- Replace ineffective overrides with versions that actually resolve vulnerable transitive paths.
- Separate build-only findings from production-runtime reachability, but keep the CI threshold at high.
- Add Dependabot/Renovate and a weekly lockfile audit.
- Acceptance: `pnpm audit --audit-level high` exits zero or every accepted exception is time-boxed with owner and rationale.

### R0-08: Security authorization hotfixes

- Separate `canReadPublicResult`, `canReadPrivateComparison`, `canMutateComparison`, and `canAdminComparison`.
- Public visibility must declassify only the curated public result, never notes, questions, versions, raw exports, AI traces, errors, user IDs, or internal source rows.
- Bind all `workspaceId`, `projectId`, `membershipId`, comparison IDs, and API-key scopes to the authenticated tenant.
- A workspace-scoped API key must never override or escape its workspace.
- Add positive and negative authorization tests for owner, admin, member, outsider, public anonymous, public authenticated outsider, and scoped API key.
- Acceptance: every object route has an explicit action-specific authorization decision.

### R0-09: SSRF-safe outbound webhooks and URL imports

- Resolve DNS and reject loopback, private, link-local, multicast, metadata, and reserved addresses for IPv4 and IPv6.
- Pin or re-check the resolved address at connection time.
- Disable redirects or validate every redirect hop.
- Apply connect/read/total timeouts, response-size caps, port allowlists, and egress audit logging.
- Reuse one hardened outbound URL policy for webhooks, context URL imports, search/extraction callbacks, and any future connector.
- Acceptance: tests cover encoded IPs, IPv6, DNS rebinding, redirects, credentials, alternate ports, and cloud metadata.

### R0-10: Make quotas atomic and cost-safe

- Reserve quota before expensive work using one atomic Redis operation/Lua script.
- Release or reconcile reservations on failure.
- Enforce per-user, per-workspace, per-IP, per-route, upload-storage, embedding, and provider-spend budgets.
- Treat denied/inactive entitlements as denied even when the attached plan name is paid.
- Add idempotency keys for create, refresh, follow-up, webhook, and billing operations.
- Acceptance: a parallel burst cannot overshoot a configured limit by more than the documented reservation window.

### R0-11: Protect private client state across account changes

- Include user/org/workspace identity in private React Query keys and in-flight GET coalescing keys.
- Cancel requests and clear private query/cache state on sign-out, organization switch, and workspace switch.
- Scope decision-board local storage by user and workspace; clear it on sign-out.
- Do not treat a cached profile as an authenticated session before Clerk confirms the session.
- Acceptance: account A’s data never appears after switching to account B in the same tab.

### R0-12: Minimize analytics and logs

- Never send raw comparison prompts, follow-up questions, document text, source bodies, provider errors, tenant IDs, or secrets to PostHog/Sentry/logs by default.
- Emit derived category, length bucket, latency, status, error code, and pseudonymous identifiers.
- Add a central allowlist-based telemetry schema and CI test.
- Add retention documentation and user deletion propagation.
- Acceptance: seeded sensitive strings do not appear in captured analytics, error, or log payloads.

### R0-13: Harden uploads

- Add per-plan count, bytes, pages, parsed-text, chunks, embedding-token, and daily quotas.
- Rate-limit upload and search endpoints.
- Stream where possible; reject decompression bombs and malformed PDFs/CSV.
- Verify MIME by content, sanitize filenames, scan for malware, and quarantine until processing completes.
- Provide cancel/retry/delete states and make deletion remove blobs, chunks, embeddings, caches, and derived references.

### R0-14: Remove raw internal errors from responses

- Map server exceptions to stable public error codes and request IDs.
- Keep provider, SQL, stack, and internal messages in redacted server telemetry only.
- Error screens should offer retry, home, status, and support with an incident ID.

### R0-15: Resolve architecture and documentation drift

- Declare one production backend, one migration source of truth, one billing owner, and one canonical domain.
- Archive or clearly label the Java backend, Supabase migrations, and prototypes if they are not deployable production paths.
- Align `AGENTS.md`, README, deployment checklist, `.env.example`, code, and legal copy.
- Add CI assertions for forbidden/deprecated environment variable names and test keys in production builds.

## 5. Wave 1 — mobile-first product and UX foundation

### UX-01: Rebuild the mobile information architecture

- Marketing: top brand bar plus one compact primary CTA; avoid a persistent five-item nav covering the task.
- App: keep four primary destinations plus More, but make the selected destination and labels unmistakable.
- Put rare/advanced modules in the drawer and allow users to customize the bottom bar.
- Support edge-swipe/open/close, Escape, focus trap, focus return, and screen-reader labels.

### UX-02: Make the composer a focused decision brief

- Use a step model on small screens: Options → Context → Constraints → Review.
- Keep the quick two-option path one screen and progressively reveal advanced fields.
- Add duplicate detection, entity disambiguation, clear examples, URL import status, and undo.
- Preserve drafts locally per user/workspace and restore after sign-in.
- Keep CTA visible above the keyboard without covering validation feedback.

### UX-03: Simplify the result experience

- Establish five top-level views: Verdict, Why, Evidence, Scores, Sources.
- Default to a concise executive answer with confidence, freshness, and the top three reasons.
- Move telemetry and advanced tools out of the primary reading flow.
- Use cards on mobile rather than compressing desktop tables.
- Keep a persistent “Ask / Adjust / Share” action group that does not collide with navigation.

### UX-04: Design consistent states

- Every page needs skeleton, empty, first-use, loading, partial, stale, offline, permission denied, rate limited, recoverable error, terminal error, and success states.
- Preserve the user’s last good data during background refresh and label it stale.
- Avoid blank full-page spinners for lazy routes; render shell-level skeletons.

### UX-05: Create a real responsive design system

- Replace one-off colors/radii/spacing with semantic tokens.
- Define density, typography, touch-target, focus, safe-area, surface, border, status, and chart tokens.
- Standardize sheet/drawer/modal behavior by breakpoint.
- Add Storybook or an equivalent component lab for all interactive states.
- Add visual regression at key breakpoints and dark/high-contrast modes.

### UX-06: Improve copy and trust

- Replace unsupported promises such as fixed “30 seconds” with measured ranges or neutral copy.
- Explain why a result is blocked, what can be changed, and what data leaves SideBy.
- Use “source-backed,” “freshness,” “confidence,” and “official source” only when their definitions are visible.

## 6. Wave 2 — evidence and decision intelligence

### INT-01: Claim-to-evidence graph

- Give every verdict sentence and score an inspectable set of supporting and contradicting facts.
- Show citation coverage: supported claims / total material claims.
- Flag orphan claims, stale citations, dead links, circular sources, and duplicated reporting.
- Let users report a source, replace it, or mark it irrelevant.

### INT-02: Source quality system

- Rank official documentation, primary data, regulators, repositories, peer-reviewed work, reputable reporting, aggregators, and user-generated content separately.
- Display author, publisher, publication/fetch date, extraction method, freshness, and reliability rationale.
- Support domain allowlists/blocklists and “official sources only.”
- Do not equate the number of sources with confidence.

### INT-03: Uncertainty and disagreement

- Distinguish confidence in facts, scores, and final recommendation.
- Show conflicting sources and explain why SideBy weighted one more heavily.
- Add “what would change the verdict?” sensitivity analysis.
- Avoid false precision in 0–100 scores; expose scoring inputs and ranges.

### INT-04: Constraint-first decisions

- Let users define must-haves, red flags, budget, region, timeline, integration requirements, and non-negotiables.
- A failed must-have should be visible before weighted scoring.
- Add scenario presets and personas with editable weights.
- Save decision frameworks as templates.

### INT-05: Total-cost and switching analysis

- Add purchase/usage/implementation/maintenance/migration/risk cost models.
- Support units, currencies, time horizons, assumptions, and confidence ranges.
- Add switching-cost and lock-in sections.
- Export assumptions with the result.

### INT-06: Multi-option comparisons

- Turn the existing bracket into a durable multi-option project rather than a set of disconnected pairwise jobs.
- Support 3–8 options, round-robin evidence reuse, consistent dimensions, elimination rationale, and final ranking.
- Detect non-transitive outcomes and surface them instead of forcing a winner.

### INT-07: Decision record

- Store the chosen option, owner, date, rationale, assumptions, approvals, and review date.
- Capture what the team believed at decision time.
- When evidence changes, show whether the original decision is still valid.

## 7. Wave 3 — research lifecycle and automation

### AUTO-01: Durable job orchestration

- Move long-running work to a leased queue with heartbeat, checkpoint, cancellation, retry policy, dead-letter state, and idempotent steps.
- Resume from the last successful step.
- Make provider fallback preserve output contracts and budgets.
- Show honest progress based on completed work, not simulated percentages.

### AUTO-02: Watchlists 2.0

- Monitor selected facts, prices, features, policies, sources, and verdict-sensitive assumptions.
- Alert only on material changes.
- Support daily/weekly/monthly schedules, pause, quiet hours, digest, and per-channel preferences.
- Link each alert to a before/after diff and impacted decision.

### AUTO-03: Refresh and versioning

- Preserve immutable published snapshots.
- Make refresh create a new version and never silently rewrite a shared result.
- Explain added/removed/changed facts, score movement, new contradictions, and verdict changes.
- Support rollback and compare-any-two versions.

### AUTO-04: Private knowledge

- Add source collections, folder/tag permissions, processing state, re-index, retention, and deletion.
- Support DOCX, HTML, Markdown, CSV, PDF, and connector-native documents with format-specific limits.
- Make retrieval scope visible in every answer.
- Add “web only,” “workspace only,” and “combined” research modes.

### AUTO-05: Human review workflow

- Assign claims or sections for review.
- Add mentions, threads, resolved status, approvals, and reviewer sign-off.
- Keep internal notes private when a result is published.

## 8. Wave 4 — collaboration, sharing, and integrations

### COL-01: Complete RBAC

- Define owner, admin, editor, commenter, and viewer capabilities.
- Enforce them server-side and mirror them in UI affordances.
- Add role-change, invite, removal, and ownership-transfer audit events.

### COL-02: Secure sharing

- Public links should support expiration, revoke, password, domain restriction, no-index, download control, and redaction preview.
- Publish an immutable curated snapshot.
- Never expose internal notes, questions, versions, telemetry, user IDs, or private sources.

### COL-03: Presentation-grade exports

- Keep Markdown/JSON and add PDF, CSV matrix, presentation, and decision memo formats.
- Let users choose executive, technical, procurement, or research layouts.
- Embed citations, assumptions, generated-at time, and version.
- Make every export accessible and deterministic.

### COL-04: Embeds and extension

- Version the widget API, constrain origins, support theme/locale, and provide a privacy-safe compact result.
- Improve the extension from “start a query” to capture selected tabs, extract product names, save evidence, and attach the current page as context.
- Never store long-lived raw API keys when an OAuth/device flow is feasible.

### COL-05: Integrations

- Slack/Teams: map installation, workspace, and user identities explicitly; verify replay and tenant mapping.
- Add Notion/Confluence/Google Drive/SharePoint imports, with least-privilege scopes and revocation.
- Add Jira/Linear/GitHub issue export for decisions and follow-up actions.
- Add webhook delivery logs, retries, signing rotation, test delivery, and per-event subscriptions.

## 9. Wave 5 — discovery, growth, and monetization

### GROW-01: SEO that renders without JavaScript failure

- Pre-render or server-render public comparison pages.
- Generate canonical metadata and JSON-LD on the server.
- Include only verified, current, public URLs in the sitemap.
- Add category hubs, templates, glossary pages, and comparison collections without producing thin AI content.
- Add noindex for low-quality, duplicate, stale, or private pages.

### GROW-02: Public comparison quality gate

- Require minimum citation coverage, source quality, freshness, and safe-content checks before indexing.
- Give published pages an updated date, methodology, author/owner, report issue action, and changelog.
- Add an editorial review queue for high-traffic pages.

### GROW-03: Activation

- Let a new user inspect a complete sample before sign-up.
- Preserve the landing-page brief through authentication and onboarding.
- Use a short onboarding checklist: create comparison, inspect evidence, adjust priorities, save decision.
- Measure time to first defensible verdict and time to first shared decision.

### GROW-04: Conversion

- Explain plan limits before the user hits them.
- Put upgrades at value moments: more monitored decisions, team review, private knowledge, advanced exports, and higher automation—not basic trust or accessibility.
- Add trials/credits with clear expiry and no dark patterns.
- Align every pricing, billing, legal, and in-product plan name.

### GROW-05: Retention

- Weekly decision digest, material-change alerts, pending reviews, expiring sources, and unresolved assumptions.
- Personal/workspace home should answer “what needs attention?” rather than only showing history.

### GROW-06: Product analytics

- Define the funnel: brief started → valid brief → job started → result completed → evidence inspected → priorities adjusted → decision saved → shared → revisited.
- Track only minimized, consented event properties.
- Add cohort retention, job success, source inspection, collaboration, and watchlist value metrics.

## 10. Wave 6 — enterprise and operations

### ENT-01: Enterprise identity and policy

- Clerk Organizations with verified membership sync.
- SAML/OIDC SSO, SCIM, domain capture, enforced MFA, session policy, and service accounts as required.
- Workspace-level data-sharing, source-domain, provider, retention, export, and public-link policies.

### ENT-02: Audit and compliance

- Make the existing audit-log table complete, append-only, queryable, exportable, and retention-controlled.
- Record auth, membership, role, key, webhook, billing, sharing, export, deletion, provider, and policy events.
- Add data inventory, subprocessors, DPA support, backup/restore drills, deletion SLA, and incident response runbooks.

### ENT-03: Admin control plane

- Queue/job health, stuck-job recovery, provider health, cost anomalies, quota overrides, abuse review, public-content moderation, user/workspace lookup, feature flags, and incident banners.
- Every admin action must be authorized, audited, and protected with step-up authentication.

### ENT-04: Provider governance

- Workspace provider allowlist, model allowlist, data-retention mode, BYOK encryption, key rotation, spend caps, and regional routing.
- Never return stored provider secrets after creation.
- Use envelope encryption with a managed KMS, not application-only reversible storage.

### ENT-05: Reliability targets

- Define SLOs for availability, job start delay, job completion, public page rendering, and data freshness.
- Add traces across route → queue → provider → persistence.
- Add dashboards for error budget, retries, provider fallback, cost per successful decision, cache hit rate, and stuck jobs.
- Run restore, provider-outage, Redis-outage, database-failover, and webhook-replay exercises.

## 11. AI quality and evaluation program

### EVAL-01: Golden datasets

- Maintain representative queries for every taxonomy category, simple/ambiguous/blocked cases, legacy result shapes, and adversarial content.
- Store expected entity parsing, dimensions, essential facts, source tiers, safety result, and verdict constraints.

### EVAL-02: Metrics

- Structured-output validity.
- Entity and category accuracy.
- Citation precision and recall.
- Claim support coverage.
- Source authority and freshness.
- Contradiction detection.
- Score stability.
- Verdict sensitivity/calibration.
- Latency, cost, and provider fallback rate.

### EVAL-03: Adversarial evaluation

- Prompt injection in pages and uploads.
- Hidden text, poisoned sources, fabricated citations, URL redirects, oversized content, multilingual ambiguity, and duplicated syndicated articles.
- High-stakes and protected-class safety behavior.
- Cross-tenant retrieval attempts.

### EVAL-04: Release gates

- Every model/prompt/provider change runs the eval suite.
- Block rollout on schema regression, citation regression, safety regression, or material cost/latency regression.
- Use canary traffic and easy rollback.

## 12. Performance and engineering quality

- Set route-level JavaScript and CSS budgets.
- Lazy-load PostHog/Sentry after consent and idle time where compatible with error requirements.
- Load charts and advanced result panels only when opened or near viewport.
- Reduce dual animation-stack usage; prefer CSS/motion primitives and honor reduced motion.
- Virtualize large source/fact/history lists.
- Paginate API results and avoid returning complete histories or traces by default.
- Add database indexes based on production query plans.
- Add `Cache-Control: private, no-store` for private/sensitive responses and include tenant/auth context in cache keys.
- Use abort signals for navigation, search, validation, upload, and job polling.
- Add offline/read-only behavior for previously opened non-sensitive summaries only after cache isolation is proven.
- Consolidate duplicated migrations and delete dead code after a measured deprecation period.

## 13. Metrics and success criteria

### Product

- Median time from landing to valid brief.
- Job completion rate and median/p95 completion time.
- Percentage of completed results with evidence inspected.
- Percentage with priorities adjusted.
- Percentage saved as a decision record.
- Share/collaboration rate.
- 7-day and 30-day decision revisit rate.

### Trust

- Citation coverage and broken-link rate.
- Public page error rate.
- Legacy-result compatibility rate.
- User-reported source/claim issues.
- Verdict-change rate after refresh.

### Mobile and accessibility

- Mobile completion parity with desktop.
- CTA obstruction incidents: zero.
- WCAG automated violations: zero for gated flows.
- Keyboard task completion rate.
- Mobile WebKit/Chromium core-flow pass rate.

### Reliability and security

- Unexpected 5xx rate.
- Stuck/retried/duplicate job rate.
- Cross-tenant authorization test coverage.
- High dependency vulnerabilities: zero.
- Raw sensitive telemetry violations: zero.
- Quota overshoot and provider-spend anomalies.

## 14. Required implementation order

1. Result compatibility and public-page crash.
2. Mobile fixed-layer collision.
3. Authorization, tenant scope, SSRF, quotas, analytics/privacy, and cache isolation.
4. Dependency audit and test-auth/build guards.
5. Real mobile/a11y/network-failure test gates.
6. Error handling, observability, job orchestration, and performance budgets.
7. Mobile composer and result redesign.
8. Evidence graph, source quality, uncertainty, constraints, and decision records.
9. Collaboration, secure sharing, exports, watchlists, and integrations.
10. SEO/growth and monetization.
11. Enterprise/admin/provider governance.

## 15. Definition of done for every implementation batch

The implementing agent must return:

1. Exact issue IDs completed.
2. Files changed and migration/config impacts.
3. API and data-contract changes.
4. Screenshots at desktop, 390×844, and 320×568 for UI work.
5. Tests added and exact commands/results.
6. Security/privacy implications.
7. Backward-compatibility and rollback plan.
8. Known limitations and deliberately deferred items.

Mandatory gates:

```bash
cd frontend
pnpm lint
pnpm exec tsc --noEmit
pnpm run typecheck:api
pnpm test
pnpm test:e2e
pnpm audit --audit-level high
pnpm run build
```

Additional gates:

- Mobile Chromium and WebKit projects pass.
- Axe reports zero violations for changed core flows.
- No unexpected console errors, page errors, failed requests, or proxy failures.
- Public sitemap URLs render a result or intentional 404 state.
- Negative authorization tests cover every changed protected route.
- No raw prompt/document/secret appears in analytics, logs, or error responses.

## 16. Instructions for the implementing AI

- Work in the required order; do not mix P0 stabilization with unrelated visual redesign.
- Before changing a route, identify its authentication, authorization, rate-limit, CSRF, cache, tenant, and error-handling contract.
- Before changing result UI, normalize the data at the boundary; do not scatter optional chaining as a substitute for schema compatibility.
- Before adding a fixed mobile element, document its stacking and safe-area contract.
- Reuse existing components and features; do not duplicate the decision matrix, notes, watchlists, multi-option composer, webhooks, API keys, uploads, or billing modules.
- Keep each batch reviewable and reversible.
- Never claim completion from passing mocked desktop tests alone.

