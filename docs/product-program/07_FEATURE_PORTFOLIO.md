# Thirty-feature decision portfolio

Date: 2026-10-27. All entries are **hypotheses**, not implemented features or verified market exclusives. Each must be compared against the existing product and current alternatives before admission. Several intentionally deepen existing matrices, source, version, watchlist or export capabilities; they are only new features if the final user outcome is materially new.

## Portfolio selection

Start with F01/F02/F06 after the core release gates and F19 where privacy review requires it. Prototype with fixed evidence before paying for new research. P1/P2/P3 below are proposed sequencing, not security severity. Estimates, owner and price are unknown until discovery; do not invent effort or guaranteed demand.

For every admitted card, add owner, effort range, baseline, target, approved provider/storage cost, central entitlement feature key, analytics event schema, accessibility tests, rollout flag and rollback path. No frontend-local flag may grant paid access.

## Candidate index

| ID | Capability | Sequence | State |
| --- | --- | --- | --- |
| F01 | Decision receipt | P1 | Proposed; current-feature audit required |
| F02 | Winner sensitivity explorer | P1 | Proposed; current-feature audit required |
| F03 | Hard-constraint eliminator | P1 | Proposed; current-feature audit required |
| F04 | Source independence map | P2 | Proposed; current-feature audit required |
| F05 | Confidence decomposition | P1 | Proposed; current-feature audit required |
| F06 | Research gap planner | P1 | Proposed; current-feature audit required |
| F07 | True ownership cost scenarios | P2 | Proposed; current-feature audit required |
| F08 | Regional suitability lens | P2 | Proposed; current-feature audit required |
| F09 | Contradiction resolution workspace | P2 | Proposed; current-feature audit required |
| F10 | Blind preference round | P2 | Proposed; current-feature audit required |
| F11 | Stakeholder priority comparison | P2 | Proposed; current-feature audit required |
| F12 | Minority-view decision record | P2 | Proposed; current-feature audit required |
| F13 | Recommendation change threshold | P2 | Proposed; current-feature audit required |
| F14 | Pre-commit decision rehearsal | P2 | Proposed; current-feature audit required |
| F15 | Outcome diary | P2 | Proposed; current-feature audit required |
| F16 | Regret and reversal review | P2 | Proposed; current-feature audit required |
| F17 | Ecosystem decision-to-action handoff | P2 | Proposed; current-feature audit required |
| F18 | Scope-aware evidence wallet | P2 | Proposed; current-feature audit required |
| F19 | Redaction preview for public decisions | P1 | Proposed; current-feature audit required |
| F20 | Low-noise decision digest | P2 | Proposed; current-feature audit required |
| F21 | Assumption expiry calendar | P2 | Proposed; current-feature audit required |
| F22 | Switching-cost map | P2 | Proposed; current-feature audit required |
| F23 | Reversibility filter | P2 | Proposed; current-feature audit required |
| F24 | Offline evidence backpack | P3 | Proposed; current-feature audit required |
| F25 | Consent-based preference learning | P3 | Proposed; current-feature audit required |
| F26 | Counterfactual decision replay | P2 | Proposed; current-feature audit required |
| F27 | Vendor clarification pack | P2 | Proposed; current-feature audit required |
| F28 | Verifiable evidence export | P3 | Proposed; current-feature audit required |
| F29 | Cross-device draft continuation | P3 | Proposed; current-feature audit required |
| F30 | Decision onboarding from a real task | P1 | Proposed; current-feature audit required |

## Acceptance cards

### F01 — Decision receipt

- **Problem:** A result is hard to explain later.
- **Capability:** Save intent, constraints, evidence versions, weights and the user’s actual choice as a compact decision record.
- **Existing surface / dependency:** Extend existing save/version/export; do not count a renamed save button as new.
- **MVP acceptance:** Saved receipts reopen the exact cited evidence/weights and show newer evidence separately.
- **Mobile/desktop:** One-screen mobile summary; desktop audit timeline.
- **Value hypothesis / metric:** Personal/team retention; saves followed by revisits.
- **Safety and limit:** No claim of immutable truth; deletion and access revocation still apply.
- **Sequence and release:** P1; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F02 — Winner sensitivity explorer

- **Problem:** A score hides how fragile the recommendation is.
- **Capability:** Show which weight or cost changes would change the winner, with a computed threshold.
- **Existing surface / dependency:** Inspect existing decision intelligence and matrix weighting first.
- **MVP acceptance:** For a fixed numerical fixture, displayed crossover matches an independently calculated threshold; unsupported data is not assigned a fake threshold.
- **Mobile/desktop:** One thumb-friendly slider with immediate textual explanation.
- **Value hypothesis / metric:** Paid scenario depth; meaningful scenario edits per saved decision.
- **Safety and limit:** Expose assumptions and score model limitations; do not treat ordinal scores as calibrated probabilities.
- **Sequence and release:** P1; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F03 — Hard-constraint eliminator

- **Problem:** A highly scored option can fail a nonnegotiable need.
- **Capability:** Separate must-haves from preferences and explain each exclusion with evidence.
- **Existing surface / dependency:** Extend composer context/criteria without duplicating existing filters.
- **MVP acceptance:** An option failing one supported must-have cannot be best eligible winner; unknown evidence stays unknown.
- **Mobile/desktop:** Constraint chips and a readable exclusion drawer.
- **Value hypothesis / metric:** Conversion from validated intent to relevant decisions.
- **Safety and limit:** Never infer sensitive requirements or silently eliminate on missing data.
- **Sequence and release:** P1; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F04 — Source independence map

- **Problem:** Ten citations may repeat one original claim.
- **Capability:** Cluster sources by known provenance and show independent support versus repeated reporting.
- **Existing surface / dependency:** Build on source metadata and extraction hashes.
- **MVP acceptance:** A seeded syndicated-source fixture counts one provenance group and explains grouping evidence.
- **Mobile/desktop:** Tap support count to expand a compact lineage view.
- **Value hypothesis / metric:** Trust-led paid value; supported-claim adjudication and source use.
- **Safety and limit:** Provenance grouping can be uncertain; avoid unsupported accusations of collusion.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F05 — Confidence decomposition

- **Problem:** A single confidence score disguises missing facts.
- **Capability:** Show evidence coverage, freshness, agreement and source type separately.
- **Existing surface / dependency:** Audit existing confidence UI and scoring data.
- **MVP acceptance:** Changing evidence freshness affects freshness only; a missing dimension is shown instead of scored as zero.
- **Mobile/desktop:** Readable four-part explanation, no tiny radar chart required.
- **Value hypothesis / metric:** Trust and fewer corrections.
- **Safety and limit:** Do not present factors as statistically calibrated probability without validation.
- **Sequence and release:** P1; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F06 — Research gap planner

- **Problem:** Users cannot tell what further research would matter.
- **Capability:** Rank missing facts by their potential to change the decision and offer a bounded research action.
- **Existing surface / dependency:** Extend follow-ups, source policy and cost accounting.
- **MVP acceptance:** A gap action states evidence sought, budget, and unresolved outcome; unavailable facts remain unresolved.
- **Mobile/desktop:** One next-best question plus optional full gap list.
- **Value hypothesis / metric:** Paid research credits within Core limits; resolved decision-relevant gaps.
- **Safety and limit:** No hidden repeated paid research; explicit action and usage accounting.
- **Sequence and release:** P1; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F07 — True ownership cost scenarios

- **Problem:** Purchase price misses maintenance and switching cost.
- **Capability:** Compare user-entered usage, fees, time and renewal assumptions over a chosen period.
- **Existing surface / dependency:** Build on facts/matrices, validate price freshness and currency.
- **MVP acceptance:** Known fixture produces correct totals and labels taxes/estimates/unknown fees.
- **Mobile/desktop:** Editable cost rows and simple yearly summary.
- **Value hypothesis / metric:** Paid software/procurement usefulness; scenario saves.
- **Safety and limit:** This is modeled cost, not financial advice or a guaranteed quote.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F08 — Regional suitability lens

- **Problem:** A global winner may be unavailable or unsuitable locally.
- **Capability:** Apply explicit user-selected region, availability, currency and support constraints.
- **Existing surface / dependency:** Extend query context and evidence collection, not automatic geolocation.
- **MVP acceptance:** A region-unavailable option is labeled and cannot appear eligible under a region must-have.
- **Mobile/desktop:** Region selector with clear reset and source dates.
- **Value hypothesis / metric:** Localized decision relevance and completion.
- **Safety and limit:** No unrequested precise location tracking; distinguish legal claims from availability facts.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F09 — Contradiction resolution workspace

- **Problem:** Conflicting claims are listed but not resolved.
- **Capability:** Compare dated claims, units and context; let a user adjudicate and preserve the rationale.
- **Existing surface / dependency:** Extend existing consensus/contradiction panels.
- **MVP acceptance:** Conflicting values remain visible, adjudication never deletes original provenance, and date/unit mismatch can be recorded.
- **Mobile/desktop:** Two evidence cards with explicit unknown/unresolved action.
- **Value hypothesis / metric:** Team trust and audit depth.
- **Safety and limit:** User adjudication is opinion unless independently supported; private notes stay scoped.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F10 — Blind preference round

- **Problem:** Brand reputation can bias evaluation before needs are clear.
- **Capability:** Hide option identities during an optional requirement/attribute preference exercise, then reveal the mapping.
- **Existing surface / dependency:** Uses known facts and consent; not deceptive default presentation.
- **MVP acceptance:** The same underlying facts produce the same scores before/after reveal; identity is always revealable.
- **Mobile/desktop:** Short swipe/tap choices with skip and undo; accessible buttons.
- **Value hypothesis / metric:** Engagement tied to better preference articulation.
- **Safety and limit:** Do not gamify consequential decisions or claim bias is eliminated.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F11 — Stakeholder priority comparison

- **Problem:** Team members value different dimensions.
- **Capability:** Collect scoped individual weights and compare shared constraints and divergent recommendations.
- **Existing surface / dependency:** Extend team membership/notes and matrices.
- **MVP acceptance:** Nonmembers cannot view priorities; combined output shows method and individual consent rules.
- **Mobile/desktop:** Small mobile priority form; desktop comparison lanes.
- **Value hypothesis / metric:** Team paid value; decisions completed by multiple participants.
- **Safety and limit:** No unexpected sharing of individual priorities or sensitive inferred profiles.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F12 — Minority-view decision record

- **Problem:** Averaging votes hides a meaningful objection.
- **Capability:** Preserve objections, evidence and acceptance conditions alongside the selected recommendation.
- **Existing surface / dependency:** Extend consensus/team notes rather than a second comments system.
- **MVP acceptance:** Final decision cannot label consensus when unresolved mandatory objections remain.
- **Mobile/desktop:** Optional concern card in the receipt.
- **Value hypothesis / metric:** Team retention and lower reversal cost.
- **Safety and limit:** Permission-aware records and noncoercive participation; no automated employee scoring.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F13 — Recommendation change threshold

- **Problem:** Users receive noisy alerts for irrelevant changes.
- **Capability:** Notify only when verified changes cross a user-selected decision threshold or invalidate a constraint.
- **Existing surface / dependency:** Extend existing watchlists and refresh cadence.
- **MVP acceptance:** A below-threshold change creates no push; a threshold crossing explains old/new evidence and deduplicates alert.
- **Mobile/desktop:** One alert reason and direct authorized evidence view.
- **Value hypothesis / metric:** Recurring paid monitoring value; useful-alert rate.
- **Safety and limit:** Push opt-in, minimal lock-screen content, bounded refresh spend.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F14 — Pre-commit decision rehearsal

- **Problem:** Users miss adoption friction until after choosing.
- **Capability:** Walk through first-day setup, required dependencies and likely failure points before saving a choice.
- **Existing surface / dependency:** Extend verdict/context with cited or user-entered steps.
- **MVP acceptance:** Each factual setup requirement is cited or labeled user-provided; unknowns stay explicit.
- **Mobile/desktop:** Three-step checklist rather than another long report.
- **Value hypothesis / metric:** More confident saved decisions.
- **Safety and limit:** Do not execute purchases, deployments or account changes automatically.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F15 — Outcome diary

- **Problem:** The product never learns whether a recommendation helped.
- **Capability:** Ask for optional, timed outcome reflections linked to a saved decision and original assumptions.
- **Existing surface / dependency:** Requires decision receipt and consented reminders.
- **MVP acceptance:** A reflection preserves original verdict and can be exported/deleted independently according to policy.
- **Mobile/desktop:** One-tap outcome plus optional note; dismissible reminder.
- **Value hypothesis / metric:** Retention through useful follow-through.
- **Safety and limit:** No automatic sensitive inference or coercive streaks.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F16 — Regret and reversal review

- **Problem:** A bad choice is difficult to unwind.
- **Capability:** Compare current outcome to original constraints and model reversible next steps with evidence.
- **Existing surface / dependency:** Extend diary, receipt and switching-cost scenarios.
- **MVP acceptance:** Review distinguishes changed facts from original error and never rewrites historical receipt.
- **Mobile/desktop:** Calm recovery workflow with next useful action.
- **Value hypothesis / metric:** Long-term trust and returning decisions.
- **Safety and limit:** No guarantee of best outcome or automated irreversible action.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F17 — Ecosystem decision-to-action handoff

- **Problem:** A good comparison ends without follow-through.
- **Capability:** Pass an explicit authorized decision summary/task intent to a compatible SnapSolve product in the same workspace.
- **Existing surface / dependency:** Core workspace mapping and versioned sibling capability contract.
- **MVP acceptance:** Receiving product reauthorizes membership and rejects unsupported capability; no token in URL.
- **Mobile/desktop:** Preview payload and confirm destination/workspace.
- **Value hypothesis / metric:** Cross-product paid ecosystem value.
- **Safety and limit:** Only user-authorized handoff; do not share private sources by default.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F18 — Scope-aware evidence wallet

- **Problem:** Users repeatedly upload the same trusted material.
- **Capability:** Reuse selected evidence with explicit scope, expiry and permission boundaries across decisions.
- **Existing surface / dependency:** Extend uploads/source library; inspect existing reuse to avoid duplicate feature count.
- **MVP acceptance:** Revoked/deleted source is inaccessible in new research and previous derivatives follow documented policy.
- **Mobile/desktop:** Source picker with visible ownership and freshness.
- **Value hypothesis / metric:** Paid research efficiency and lower provider cost.
- **Safety and limit:** Shared workspace does not imply all uploads are shareable across products.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F19 — Redaction preview for public decisions

- **Problem:** Users accidentally publish private context.
- **Capability:** Show the exact public payload and warn about included private notes, uploads or identifiers before publishing.
- **Existing surface / dependency:** Extend public-link/share/export serializers.
- **MVP acceptance:** Public preview matches served payload and contains no excluded private fields in adversarial fixtures.
- **Mobile/desktop:** Readable before/after disclosure; private by default.
- **Value hypothesis / metric:** Trust and safe collaboration conversion.
- **Safety and limit:** Detection is advisory, not a guarantee of perfect secret discovery; server allowlist remains authoritative.
- **Sequence and release:** P1; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F20 — Low-noise decision digest

- **Problem:** Continuous alerts interrupt users.
- **Capability:** Bundle opted-in changes by decision impact and urgency with user-chosen cadence.
- **Existing surface / dependency:** Extend watchlist notifications and preference store.
- **MVP acceptance:** Quiet hours/cadence respected; urgent classification has explicit criteria; duplicate event appears once.
- **Mobile/desktop:** Compact digest with snooze/stop controls.
- **Value hypothesis / metric:** Paid monitoring retention and low unsubscribe rate.
- **Safety and limit:** Delivery best-effort; no sensitive excerpts by default.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F21 — Assumption expiry calendar

- **Problem:** An old recommendation can appear current forever.
- **Capability:** Assign review dates to price, availability, roadmap and user assumptions.
- **Existing surface / dependency:** Extend freshness/version/watchlist metadata.
- **MVP acceptance:** Expired assumptions are visibly stale and never silently refresh as user-approved facts.
- **Mobile/desktop:** Small review badge and batch recheck action.
- **Value hypothesis / metric:** Returning usage tied to substantive review.
- **Safety and limit:** No false urgency or hidden refresh charges.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F22 — Switching-cost map

- **Problem:** Migration effort changes the practical winner.
- **Capability:** Map data movement, contracts, training and interoperability dependencies as user-confirmed switching costs.
- **Existing surface / dependency:** Extend total-cost/scenario and ecosystem links.
- **MVP acceptance:** A switching estimate shows its inputs and missing dependencies; no invented contract term.
- **Mobile/desktop:** Checklist of dependencies plus effort ranges.
- **Value hypothesis / metric:** Paid professional decision value.
- **Safety and limit:** Review licensing/legal interpretations; no claim of automatic safe migration.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F23 — Reversibility filter

- **Problem:** Not every decision deserves the same research effort.
- **Capability:** Classify user-confirmed cost of reversal and suggest proportional evidence depth.
- **Existing surface / dependency:** Uses explicit constraints, not inferred personal risk profile.
- **MVP acceptance:** User can override classification; depth recommendation never bypasses required safety checks.
- **Mobile/desktop:** Short reversible/expensive-to-reverse choice with explanation.
- **Value hypothesis / metric:** Lower time/cost for simple decisions and retained trust.
- **Safety and limit:** No manipulation into paid deep research.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F24 — Offline evidence backpack

- **Problem:** Users need their selected decision while traveling.
- **Capability:** Explicitly download a bounded, read-only, scope-protected decision summary with freshness and clear removal.
- **Existing surface / dependency:** New reviewed storage/privacy contract; not broad worker caching of private APIs.
- **MVP acceptance:** Account sign-out/revocation rules tested; storage eviction produces clear unavailable state; no offline mutation replay.
- **Mobile/desktop:** Opt-in download, size indicator and remove action.
- **Value hypothesis / metric:** Paid mobile utility, offline retrieval success.
- **Safety and limit:** Mobile local storage cannot replace server authorization or guarantee remote deletion on a permanently offline device.
- **Sequence and release:** P3; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F25 — Consent-based preference learning

- **Problem:** Users repeatedly enter the same non-sensitive priorities.
- **Capability:** Remember selected preferences with editable provenance, per workspace/personal scope and reset.
- **Existing surface / dependency:** Extend settings only after consent and privacy review.
- **MVP acceptance:** Disabling learning stops new use and deletion removes stored preferences; a decision can ignore defaults.
- **Mobile/desktop:** Visible applied-preference chips with remove.
- **Value hypothesis / metric:** Faster relevant comparisons, repeat usage.
- **Safety and limit:** No silent cross-product profiling or sensitive-trait inference.
- **Sequence and release:** P3; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F26 — Counterfactual decision replay

- **Problem:** Users cannot isolate why a different choice would have won.
- **Capability:** Replay a saved receipt under one changed assumption, preserving the original evidence version.
- **Existing surface / dependency:** Extend sensitivity/versioning with deterministic calculation.
- **MVP acceptance:** One-variable fixture reproduces expected change; historical receipt remains unchanged.
- **Mobile/desktop:** Before/after winner and explicit changed input.
- **Value hypothesis / metric:** Paid decision intelligence depth.
- **Safety and limit:** Do not imply causal proof from a scoring model.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F27 — Vendor clarification pack

- **Problem:** Missing information blocks a buying decision.
- **Capability:** Generate a reviewable set of specific questions tied to missing or contradictory evidence.
- **Existing surface / dependency:** Build on gap planner; user sends or exports manually.
- **MVP acceptance:** Every question links to its gap and no message is sent without explicit authorization.
- **Mobile/desktop:** Copy/export questions grouped by vendor.
- **Value hypothesis / metric:** Professional/team paid value and gaps closed.
- **Safety and limit:** No unsolicited outreach; protect private negotiation context.
- **Sequence and release:** P2; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F28 — Verifiable evidence export

- **Problem:** Exported reports lose their connection to original evidence.
- **Capability:** Export a versioned bundle with hashes, retrieval dates and a verification manifest.
- **Existing surface / dependency:** Extend JSON/Markdown export; assess source redistribution rights.
- **MVP acceptance:** Tampering changes verification result; missing evidence is explicit; scoped access/deletion policy documented.
- **Mobile/desktop:** Simple download with verification status explanation.
- **Value hypothesis / metric:** Team/enterprise portability and trust.
- **Safety and limit:** Integrity proves bytes, not factual truth, completeness or legal rights.
- **Sequence and release:** P3; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F29 — Cross-device draft continuation

- **Problem:** Users start a comparison on one device and finish on another.
- **Capability:** Offer explicit account-scoped draft sync and conflict resolution across web/native.
- **Existing surface / dependency:** Separate from existing tab-local crash/update draft preservation.
- **MVP acceptance:** Concurrent edits have a visible conflict policy; workspace/account boundaries and deletion tested.
- **Mobile/desktop:** Continue draft card; local-only option preserved.
- **Value hypothesis / metric:** Paid ecosystem continuity; successful authorized resumptions.
- **Safety and limit:** Requires server storage/retention consent; never silently upload private draft text.
- **Sequence and release:** P3; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

### F30 — Decision onboarding from a real task

- **Problem:** Generic onboarding delays the user’s first useful decision.
- **Capability:** Guide one actual user comparison through constraints, evidence inspection and save, with contextual help.
- **Existing surface / dependency:** Enhance existing onboarding rather than counting its screens as multiple features.
- **MVP acceptance:** User can skip; signup preserves original intent; first-decision completion is measured without raw-query telemetry.
- **Mobile/desktop:** One focused step at a time, always showing the original question.
- **Value hypothesis / metric:** Activation and paid-value discovery.
- **Safety and limit:** No dark patterns, fake research or forced notification permissions.
- **Sequence and release:** P1; proposed, behind a product capability/rollout flag once admitted; remove flag or disable entry point without deleting existing user records.

## Monthly count discipline

These thirty cards satisfy the requested 25–30 candidate-feature design range. They do not establish thirty competitive exclusives or a monthly shipping rate. Target at least 25 new shipped features/month using an estimated 25-feature delivery slate backed by at least 30 candidates; deduplicate against existing features, refine into independently valuable scope, and ship only through the launch/quality gates. Record actual releases separately from experiments, polish, fixes and backend enabling work.
