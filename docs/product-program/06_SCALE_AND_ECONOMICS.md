# Scale, capacity and unit economics

No capacity tier is currently certified. Registered users are not requests per second, concurrent jobs, database connections or provider throughput. Scale only after a measured envelope review.

## Explicit model (illustrative, not forecast)

Assumptions for an initial stress-planning model: 20% daily active; two new jobs per active user/day; 10% of daily jobs arrive in a 15-minute burst; average occupied worker time 60 seconds. Replace all assumptions with measured cohorts and provider latency. Queue occupancy approximately arrival rate × occupied time; retries, polling, refresh and exports add further load.

| Registered users | Jobs/day | Burst arrivals/sec | Approx. occupied workers | Daily maximum at $0.50/job |
| --- | --- | --- | --- | --- |
| 1,000 | 400 | 0.044 | 3 | $200 |
| 10,000 | 4,000 | 0.444 | 27 | $2,000 |
| 100,000 | 40,000 | 4.444 | 267 | $20,000 |
| 1,000,000 | 400,000 | 44.444 | 2,667 | $200,000 |

Cost column is a theoretical ceiling at the documented per-job cap, not expected spend or an approved budget. Even good availability is commercially unacceptable without controlled cost. Memory-cache hit rate does not remove per-user authorization or eliminate API/polling traffic.

## Architecture gates

- **Job durability:** prove accepted jobs survive request termination and deploys. Existing in-process scheduling/external-worker switches are not proof of durable delivery.
- **Queue:** explicit admission caps, worker lease ownership, idempotency, resumable steps, bounded attempts, queue age, fairness, cancellation semantics and dead-letter handling.
- **Providers:** quota and concurrency per account/model/search/extractor; bound amplification from retries and fallback; graceful incomplete evidence.
- **Database:** query plans and indexes, serverless connection limits, row growth, vector index cost, retention, hot keys and backup/restore.
- **Redis:** atomic usage and lock semantics, fail-safe outage behavior, key cardinality and memory bounds.
- **Frontend:** polling frequency and visibility suppression, query deduplication, pagination, lazy panels, transfer/precache and memory budgets.
- **Core:** entitlement/workspace timeout and agreed cache/grace semantics; do not fan out a Core call per rendering frame.

## Load progression

1. Deterministic stub providers: run request admission and worker scheduling without paid calls; create a realistic latency distribution.
2. Isolated database/Redis concurrency: repeated intent, mixed tenant load, slow winner, expired lease, failed worker, retry and deletion. Verify row constraints and no duplicate billable execution.
3. Staging end-to-end with a small explicit paid-provider budget and real failure modes.
4. Sustained load for the next cohort plus burst/headroom and recovery tests; record duration, environment, p95/p99 latency, throughput, failures and cost.
5. Deploy canary/cohort expansion only after review. Do not run uncontrolled load against production or third-party providers.

Require recovery to baseline after burst, bounded queue age, no starvation, zero tenant leakage, no duplicate intent work and spend within approved limits. A single RPS number cannot establish millions-user readiness.

## Economics instrumentation

Record cost estimates/actual invoices by step/provider/model and job outcome, cache reuse, failed attempts, refresh and exports. Keep correlation IDs without copying raw prompts into general telemetry. Track contribution per active and paying user, successful decision and retained cohort.

Proposed budget controls: per-job existing cap, per-workspace daily admission, account-wide daily/monthly provider ceiling, alert at approved threshold and hard stop for unbounded retry amplification. Values require owner approval and pricing evidence; never infer unlimited capacity from a paid entitlement.

## Operations dashboard

Views: accepted/completed/failed jobs; queue age and throughput; duplicate attempts prevented; provider latency/429/5xx; Core checks and entitlement lag; database connections/slow queries; worker memory and leases; auth redirect/reload rate; client exceptions by build; daily spend/cost per successful job; backup age and restore results. Alert on user impact, not every transient retry.
