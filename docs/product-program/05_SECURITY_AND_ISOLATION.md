# Security, failure isolation and privacy

Status: audit plan and release requirements; no claim that the full codebase has passed security review. Work from SECURITY.md, current route code, deployed configuration and existing security findings. Record severity, reproducibility, owner, patch and retest separately.

## Inventory and review passes

Enumerate every route and surface: public research, authenticated CRUD, workspaces/projects/memberships, uploads/extraction, follow-up/chat, refresh/watchlist, exports/sharing, API keys/webhooks, Core bridge, provider callbacks, push, extension/widget, account deletion and deployment tooling. Capture principal, object owner, workspace, input schema, rate limit, provider cost, persistence, logging and error boundary for each.

Three passes: direct authorized request; denied/cross-tenant/replayed/malformed request; dependency failure and recovery. Focus tests on actual boundaries rather than repeating happy paths three times.

| Threat | Required control | Proof |
| --- | --- | --- |
| Broken object authorization | Membership/role and object scope checked per read/write | User A cannot read/write/export/subscribe to B; removed member loses access |
| Unsafe URL extraction/SSRF | Scheme/host/address restrictions across DNS and redirects; egress policy | Private/link-local/metadata/IPv6 and redirect-chain probes |
| Retrieved prompt injection | Treat source text as untrusted evidence, never system instruction | Malicious source cannot execute tools, expose secrets or alter policy |
| Upload abuse | File size/type/content checks, parser limits, bounded processing and deletion | Malformed/archive/decompression/oversized files fail locally |
| Cost/rate abuse | Atomic usage accounting, quotas, queue admission and spend stop | Concurrent requests cannot evade limits or duplicate charges |
| Auth/token exposure | Server-only secrets, strict origin/redirect checks and session handling | No token in bundles/logs/deep links/caches |
| Cross-tenant caching | Keys scoped appropriately, private worker cache exclusions | Workspace/account switch and revoked-link tests |
| Webhook replay/tamper | Signature, freshness, event identity and idempotency | Duplicate/reordered/tampered events cannot grant access twice |
| Evidence leakage | Public/private data boundary and source policy | Public exports/links never include private uploads without explicit consent |
| Dependency/registry compromise | Lockfile review, source/license inspection, supply-chain checks | New visual component cannot add unexpected scripts/telemetry |

## Containment architecture

Use a route boundary around page-level failures and smaller boundaries around optional charts, activity feeds, analytics, ecosystem recommendations and expensive panels. Keep the app shell, navigation, saved content and retry controls working when a nonessential module fails. Add fallback copy describing the affected feature, not a generic full-app crash.

A React boundary cannot catch every asynchronous error or an OS-killed browser process. Abort/reconcile async work explicitly and instrument render loops, network bursts and memory-heavy surfaces. Verify failure injection actually leaves adjacent functionality usable.

Backend provider failures need deadlines, bounded retries with jitter, circuit-breaker policy, queue isolation, per-workspace admission and dead-letter visibility. Do not make an analytics call part of successful comparison persistence. Do not let a billing outage grant access or corrupt unrelated research.

## Data lifecycle

Classify public source data, private uploads, queries/notes, membership, billing references and operational telemetry. Define retention, deletion propagation, backup expiry and export format. Exclude secrets, raw documents and raw queries from general analytics and error breadcrumbs by default. Redact support evidence.

Push title/body and lock-screen previews can expose private decisions. Default to minimal notification text and open a normal authorization-checked deep link. A revoked workspace or changed public-link setting takes effect on read, regardless of cached UI.

## Incident response

Severity 0/1: active tenant exposure, repeated auth crash, data loss, unauthorized paid access or uncontrolled spending. Halt acquisition/feature rollout, assign incident owner, contain the failing feature/product, preserve redacted diagnostics, restore service, communicate facts and follow with regression tests.

Proposed objectives: RTO ≤60 minutes for core app recovery and RPO ≤15 minutes for durable decision data, subject to provider/backup capability verification. Measure restore drills; do not promise these before testing. Shared Core incidents require cross-product coordination but SideBy visual rollback must remain independently possible.

## First security execution

Reconcile previous findings with the current merge SHA; prioritize identity/render recovery, Core verified-email provenance, authorization matrix, URL extraction egress, paid fallback behavior, webhook replay, worker private caching and upload parser limits. No new penetration tests against third-party systems; use owned staging fixtures and approved scope.
