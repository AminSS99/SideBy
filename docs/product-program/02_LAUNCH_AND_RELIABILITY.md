# Launch stages and reliability contract

Targets below are proposed product requirements. No current SLO or scale result is certified by this plan.

## Launch stages

| Stage | Audience | Admission evidence | Stop condition |
| --- | --- | --- | --- |
| Repair preview | Internal/coordinator | Exact build identity, functional real auth, no test bypass, isolated artifact, rollback path | Auth crash, cross-tenant issue, missing migration |
| Hand launch | 10–50 invited users, capacity permitting | Device auth proof, core research and billing journeys, incident owner, cost caps | Any critical security/data-loss issue |
| Controlled beta | 100–1,000 admitted users | Seven-day observed core-flow stability, support loop, queue/cost dashboards | Error budget burn, worker backlog, provider saturation |
| Public launch | Gradual acquisition, not unrestricted bursts | Current staging and production canary, central billing proof, load-envelope evidence | Predeclared error/cost/latency thresholds |
| Scale expansion | 10k→100k→1M registered users | Separate capacity review at each tier | Any untested bottleneck; spend above approved budget |

These cohort counts are operational planning targets. They do not establish concurrent-user capacity. Launch naming (hand launch/Product Hunt/public/full-scale) does not replace admission evidence.

## Core service targets

- Interactive public/authenticated app availability: proposed 99.9% over rolling 30 days, measured by independent synthetics plus client outcomes. A 30-day 99.9% budget is 43.2 minutes; it is a target, not a warranty.
- Accepted valid comparison jobs: proposed ≥99% reach a usable completed outcome within the defined deadline. Include provider failures; report intentional policy rejections, usage denials and user cancellations separately. Do not drop slow or failed jobs from the denominator.
- Entitlement correctness: zero known unauthorized grants and no unreconciled successful payments denying expected access. Treat discrepancies as incidents, not rounding noise.
- Data isolation: zero tolerated cross-account/workspace exposure. Any confirmed violation halts rollout.
- Input responsiveness: field INP p75 ≤200ms; lab interactions are supporting evidence. LCP p75 ≤2.5s and CLS ≤0.1 at representative traffic.
- Accessibility: WCAG 2.2 AA target with automated checks plus manual core-flow review. Screenshot contrast impressions cannot certify it.

Track failure rates per journey, device/browser, product build, provider and workspace tier without high-cardinality PII. Low traffic cannot substantiate high availability; show request counts and observation windows.

## Three independent passes

The request to check three times is implemented as three different failure lenses, not three copies of the same happy-path run.

1. **Deterministic contract pass:** types, lint, unit/integration, authz/tenant matrix, idempotency, schemas, backward compatibility, migrations and rollback.
2. **Deployed journey pass:** real configured providers in an isolated staging environment, signup/sign-in/sign-out, comparison/evidence/save/export/share, purchase/cancel/portal, offline/update and failure injection. Avoid paid provider calls without an approved test budget.
3. **Human/device/operations pass:** physical iPhone Safari and installed PWA, keyboard/VoiceOver/rotation, two-build dirty-draft update, interrupted job recovery, alert handling and incident rehearsal.

Record build SHA, test mode, environment identifier, date, operator, result, evidence and residual limits for each pass. A CAPTCHA boundary is not a completed authentication journey.

## Critical launch checklist

- [ ] Latest proposed merge artifact passes types, lint, unit and relevant browser suites.
- [ ] Production and preview SHA/auth configuration are known; older working-tree success is not substituted.
- [ ] Authenticated iPhone crash reproduction check passes on the same context that failed.
- [ ] Core comparison emits supported citations and exposes uncertainty/missing evidence honestly.
- [ ] Central workspace membership and revocation propagate without tenant leakage.
- [ ] Core checkout, webhook replay, entitlement delay, cancellation and portal verified.
- [ ] Required migrations applied in each intended environment and rollback policy rehearsed.
- [ ] Offline/update lifecycle and private cache exclusions verified on built artifacts.
- [ ] No fixed-surface collision, inaccessible menu, obscured keyboard action or accidental zoom lock.
- [ ] Support contact, incident owner, dashboards, provider limits and spend stop configured.
- [ ] Data deletion/export, backup restore and retention policy have evidence.
- [ ] Feature flags default safely and SideBy rollback does not roll back sibling products.

Unclosed items mean restrict the public promise or cohort. Do not silently waive them in a completion report.
