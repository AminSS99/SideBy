# Execution, evidence and release protocol

## Ownership and checkout safety

Latest user mandate authorizes SideBy web product development and planning. Native SideBy/Rallia work remains with its owner. Do not edit sibling repositories or shared Core APIs without a reviewed contract sequence. Do not send messages to another chat without user authorization.

Before edits: read applicable AGENTS.md, inspect git status, identify active checkout/SHA and ownership, and list dependencies. Preserve all unrelated changes. Prefer existing suitable checkout; create isolated work only when needed. Never reset/clean another workstream. Do not mix modified working-tree validation with the clean release artifact.

## Unit of delivery

Every batch has an ID, user outcome, code surface, acceptance criteria, dependency owner, risk, test plan, flag/rollback, expected cost and evidence destination. Keep work coherent enough to review. Link existing authoritative docs rather than copying contradictory specifications.

Statuses: proposed/specifying/ready/implementing/verified-local/verified-staging/verified-device/released/measured; blocked requires a named dependency and unblocking action. No progress percentage from intuition.

## Release validation

Use current package scripts, including `pnpm run typecheck` (project references plus API), `pnpm lint`, `pnpm test`, production build and appropriate browser tests. Run native node artifact-checker tests separately; they are not part of the current Vitest contract.

New static tooling:

```sh
# From frontend/
node --test scripts/release/__tests__/check-artifacts.node.mjs
node scripts/release/check-artifacts.mjs /absolute/path/to/production-dist https://sideby.ink
```

The artifact checker validates generated manifest identity/scope, required any/maskable icon declarations and PNG header dimensions, Apple icon/mobile metadata/zoom, worker file presence and public canonical sitemap URLs. It rejects asset paths/symlinks outside the artifact directory. It is intentionally not proof of image rendering, browser registration, worker security, live auth, capacity or whole-product readiness.

Use the exact production artifact with test bypass disabled. Keep test-auth artifacts isolated and never promote them. Report every unexpected API failure, browser exception and skipped test, even if the suite is green.

## SideBy-only update and rollback

Deploy SideBy independently of sibling products. Pin contract versions and immutable build identity. Use expand/contract migrations and previous-client compatibility; worker caches can retain older clients after deployment. Do not infer a server rollback instantaneously removes installed workers.

For each release: preview → validated merge result → database migration according to reviewed sequence → limited canary/cohort → watch user-impact thresholds → expand. If rollout controls are unavailable, use an explicitly managed small audience rather than pretending a percentage canary exists.

Observe auth success/reload rate, job completion, latency, cost, Core entitlements and private/public data boundary. Disable only the affected optional feature where safe; security or core-auth incidents can require product rollback. Maintain data-compatible rollback; do not automatically reverse destructive migrations.

Production deployment requires the user's release authorization. The program mandate is not an instruction to merge PR #165 or publish production this turn.

## Evidence record template

| Field | Required value |
| --- | --- |
| Batch/build/environment | Immutable SHA, origin, branch, migration version, test-auth mode |
| Scope | User journey and expected result |
| Mode | Source inspection, mocked unit, real DB integration, deployed browser, physical hardware |
| Result | Passed/failed/skipped/pending with counts and observation period |
| Artifact | Redacted report, screenshot/video, trace or command summary |
| Limits | What this cannot prove |
| Next action | Named owner and concrete unblock |

Never include credentials, database URLs with credentials, auth cookies, provider payloads or private workspace data. Keep general analytics consent-aware.

## Completion report

Lead with user-visible outcome, actual code/doc changes and verification results. Distinguish current observations from executor-submitted historical reports. State remaining blockers without declaring the entire initiative complete. Planning artifacts are delivered plans; they do not mean 30 features, scale capacity or production readiness have shipped.
