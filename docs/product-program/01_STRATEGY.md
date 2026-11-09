# Strategy and product outcomes

Date: 2026-10-27. Planning horizon: 2026-10-27 through 2027-10-26; longer scenarios are options, not commitments.

## Positioning

SideBy turns a comparison into a decision people can explain, revisit, and defend. The core sequence is: express intent → set constraints → research → inspect evidence → compare tradeoffs → commit a decision → learn from the outcome.

The current repository already exposes comparisons, cited facts, dimensions, verdicts, matrices, follow-ups, projects, workspaces, notes, versions, watchlists, uploads, exports, research and chat. Audit the behavior and data model before calling an enhancement a new feature.

Initial audience hypothesis: individuals and small teams selecting software or work tools. This limits evaluation ambiguity and high-stakes harm while building a measurable product. Validate consumer purchases and other decision categories through research before expanding. Medical, legal and investment decisions need separate accuracy and policy work; do not market generic generated scores as professional advice.

## Outcomes and measurement

North-star candidate: **weekly evidence-backed decisions saved by activated users**. A saved decision must be a deliberate action associated with a viewable evidence record; generating a result is not a decision. Add one deduplicated event with comparison/decision identifiers and non-sensitive metadata; do not send raw queries or citations to general analytics by default.

| Outcome | Definition | Guardrail |
| --- | --- | --- |
| Activation | New eligible user completes a comparison, opens a source, and saves a decision within 7 days | Separate paid/free, native/web, mobile/desktop |
| Time to useful result | Median/p95 from valid accepted request to first evidence-bearing view | Do not count an invented skeleton as useful evidence |
| Trust | Sampled supported-claim rate and user correction rate | Human adjudication, denominators and sample method recorded |
| Retention | Activated cohorts returning to a decision/research task at weeks 1 and 4 | Avoid counting passive push opens alone |
| Paid value | Paid conversion and retained paid cohorts | Include refunds, support cost and gross contribution |
| Ecosystem benefit | Users intentionally continue a task across products in one workspace | Consent and permissions survive the handoff |
| Experience | Task completion, errors, accessibility, input responsiveness | Performance sliced by actual device capability |

All baseline values are unknown until collected. Proposed discovery targets: 12 user conversations, 8 observed mobile tasks, and a small paid-value test before pricing or roadmap certainty. These are sample goals, not statistical validation.

## Monetization and packaging

SnapSolve Core remains billing/entitlement authority. Draft packaging is a hypothesis: free gives a useful bounded first decision; personal paid gives decision history, monitoring and scenario depth; team adds private collaboration and approvals. Check the existing central catalog before defining names, prices or limits. No SideBy-local plan or promotion may silently override Core.

Price on recurring decision value, not on arbitrary visual effects. Include cost per accepted and failed research job, support burden, storage and provider calls. A feature is not ready for paid packaging if its failure path consumes unbounded resources or denies access incorrectly.

## Monthly portfolio policy

The user-requested objective is at least 25 genuinely new shipped features each month. Maintain at least 30 candidate capabilities and admit an estimated 25-item monthly delivery plan from the portfolio and validated feedback. Each needs a user problem, novelty comparison, acceptance test, estimated effort, cost boundary and owner. Estimate team throughput first; admit work up to available capacity, reserve reliability/support capacity, and explicitly report deferred candidates. Never promise 300 shipped features in a year without the staffing and evidence to support it.

Suggested capacity allocation after core repair: 40% reliability/security, 30% decision differentiation, 20% mobile/design, 10% discovery and ecosystem contracts. Rebalance against incidents and adoption; do not ship feature volume through an exhausted error budget.
