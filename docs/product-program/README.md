# SideBy product program

Started: 2026-10-27. Owner: SideBy product/engineering lead. Status: planning and local tooling delivered; launch readiness is not certified.

## Product mandate

Make SideBy the most trustworthy and satisfying place to make an evidence-backed decision on a phone, with an exceptional desktop workbench and seamless membership in the SnapSolve ecosystem. Beauty, responsiveness, privacy, evidence quality, and operational reliability are joint requirements.

Use **SnapSolve ecosystem** in product language and **SnapSolve Core** for the existing authority/service. Do not rename products or services during a reliability release. Rallia iOS and SideBy iOS are distinct workstreams unless the coordinator explicitly changes that boundary.

## Start here

| Document | Purpose |
| --- | --- |
| [01 Strategy](01_STRATEGY.md) | Audience, positioning, outcomes, assumptions, commercial model |
| [02 Launch and reliability](02_LAUNCH_AND_RELIABILITY.md) | Staged launches, measurable gates, three independent verification passes |
| [03 Ecosystem contract](03_ECOSYSTEM_CONTRACT.md) | Identity, workspaces, billing, security and native/web boundaries |
| [04 Design and motion](04_DESIGN_AND_MOTION.md) | Visual system, iPhone interactions, desktop, component adoption |
| [05 Security and isolation](05_SECURITY_AND_ISOLATION.md) | Threat model, route coverage, containment and incident response |
| [06 Scale and economics](06_SCALE_AND_ECONOMICS.md) | Capacity assumptions, queueing, provider budgets and load gates |
| [07 Feature portfolio](07_FEATURE_PORTFOLIO.md) | Thirty differentiated hypotheses with acceptance tests |
| [08 Roadmap](08_ROADMAP.md) | Immediate batch, 90 days, twelve months and long-range scenarios |
| [09 Execution protocol](09_EXECUTION_PROTOCOL.md) | Work ownership, evidence, deployment and rollback |
| [10 Research](10_RESEARCH.md) | Dated primary-source research and limitations |
| [11 Progress ledger](11_PROGRESS_LEDGER.md) | Evidence states, risks, decisions and updates |
| [12 Next execution](12_NEXT_EXECUTION.md) | Concrete instructions for the next implementation batch |
| [13 Local validation](13_VALIDATION_2026-10-27.md) | Previous code changes, checks and remote-release findings |
| [14 Mobile UI development](14_MOBILE_NAVIGATION_AND_NOTICES.md) | New menu/notice batch; testing explicitly deferred |
| [15 Large delivery batch](15_LARGE_DELIVERY_BATCH.md) | One substantial implementation brief across shell, decisions, resilience and motion |
| [16 Large finishing batch](16_LARGE_FINISHING_BATCH.md) | Source-reviewed sharing, receipt, retry and UX repairs |

Existing roadmap, PWA QA/runbook, deployment guidance, ecosystem launch plan, and iOS instructions remain in place. This index is the cross-cutting product program, not a second source of live billing rules or a replacement for applicable AGENTS.md instructions. Link implementation detail to its authoritative source.

## Truth rules

- Statuses: proposed → specified → implemented → locally verified → staging verified → device verified where required → released → measured. Blocked and retired are explicit side states.
- A green test suite does not establish device verification, production deployment, field reliability, or capacity.
- The requested 99% mobile audience is a planning assumption until consent-respecting analytics confirms it.
- The requested delivery objective is at least 25 new features/month. Maintain a candidate slate of at least 30, then an estimated 25-item delivery plan with explicit capacity and quality gates. Do not relabel bug fixes or duplicate existing features to inflate a new-feature count. Record shipped count and shortfall honestly.
- Universal novelty and 100% readiness cannot be proven by a small research sample. Record differentiation hypotheses and named release criteria instead.
- No unattended future work is implied. Update this program after each actual execution; establish a scheduled review separately if requested.

Latest finishing brief: [WEB-BATCH-04](18_LARGE_COMPLETION_BATCH.md), following the executor’s WEB-BATCH-03 submission. Testing remains deferred.

Launch critical-path brief: [LAUNCH-01](20_LAUNCH_COMPLETION_BATCH.md). Private messaging drafts: [launch copy](21_LAUNCH_COPY_DRAFTS.md). No posting/deployment authorization implied.
