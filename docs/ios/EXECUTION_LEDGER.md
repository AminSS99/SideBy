# SideBy iOS execution ledger

> **Strategy update, 2026-10-19:** New native target is Swift 6.4+ / SwiftUI-only on iOS 26+; see `SIDEBY_SWIFTUI_26_PRODUCT_PLAN.md`. B00–B02 states below remain the last reviewed React Native evidence state. The forwarded R3 report has not yet been accepted; S00–S10 are proposed migration tasks, not completed tickets.

Revision 5 · 2026-10-13 · Canonical companion to `SIDEBY_IOS_MASTER_PLAN.md`.

## Current state

Current review: typecheck and 93/93 tests pass, and Expo's compatibility check passes. A rendered simulator launch and a hash-verified 78-file source archive exist, but the plugin has not been proved by an extraction-to-build run. Mobile source remains untracked; staging and the native-tab device comparison are unrun. Read `reviews/2026-10-13_R2_COORDINATOR_REVIEW.md` and revision 5 of `NEXT_BUILDER_INSTRUCTIONS.md`.

| Ticket | State | Next instruction | Acceptance evidence |
| --- | --- | --- | --- |
| B00 | NEEDS_REVISION | B00-R3: prove extraction/prebuild/build/launch from archived source; make archive clean and Debug/Release bundle behavior explicit. | 78 source hashes match; existing build and unobstructed launch shown; plugin clean-build proof pending. |
| B01 | NEEDS_REVISION | B01-R3: correct inactive subscription badge; execute authorized staging favorite/export/usage contract checks. | 93 tests pass with open-handle warning; screen states improved; staging not run. |
| B02 | NEEDS_REVISION | B02-R3: reconcile canonical spec and run same-build native-tab/device contrast and fallback comparison. | Active custom bar accurately identified; dark opaque token ratios measured; other states and devices unverified. |
| B03 | WAITING B01 acceptance | Read-only contract/interface discovery may proceed. | Shared workspace/entitlement and cache isolation pending. |
| B04 | WAITING B00/B02/B03 interface | Native shell/material implementation. | Pending |
| B05 | WAITING B01–B04 | Screen behavior, motion and accessibility. | Pending |
| B06 | WAITING integrated build | Native journeys and device/performance matrix. | Pending |
| B07 | WAITING B06 | Candidate and release gates. | Pending |

States: READY, IN_PROGRESS, NEEDS_REVISION, WAITING prerequisite, BLOCKED with concrete external dependency, ACCEPTED with evidence. No ticket becomes ACCEPTED solely from a builder's self-report. Builders request review; only the coordinating AI updates acceptance decisions.

## Builder return format

```markdown
# Builder report — Bxx
Date/time/timezone:
Plan revision used:
Repository and baseline SHA (or reviewed source manifest):
Branch/patch/commit reference:
Assigned scope:

## Outcome
What now works, what remains incomplete, and whether acceptance is requested.

## Changes
Exact files changed, why each changed, shared interfaces/contracts changed.
Separate pre-existing changes from this patch. Include a reviewable diff.

## Checks
| Command/scenario | Environment/build/device | Result | Evidence path |
| --- | --- | --- | --- |
| ... | ... | PASS / FAIL / NOT RUN | ... |

## Runtime evidence
Screenshots/video, redacted request/response fixtures, trace files, test results.
For measurements: dataset/script, device/OS, Release/Debug, sample count,
p50/p95, thermal/low-power/network conditions, before/after.

## Ecosystem and privacy
Workspace/account isolation proof, authoritative entitlement behavior,
secret/log review, cache lifecycle changes, where relevant.

## Risks and unresolved work
Concrete blockers, regressions, unsupported assumptions, dependency owner.

## Next proposed action
One bounded next ticket or exact revision instruction.
```

## Coordinator review commands

Inspect commands in the reported repository, not automatically both repositories:

```bash
git status --short
git diff --stat
git diff --check
git diff -- path/to/assigned/file
```

Replace the file path with an actual assigned file; untracked file content is not shown by ordinary `git diff`. Review new files explicitly and request the builder's patch. Never interpret empty diff output as proof that an untracked implementation is unchanged. Inspect staged changes with `git diff --cached` if the builder staged its patch. Do not stage or discard unrelated files during review.

Then rerun relevant checks from `BUILDER_RUNBOOK.md`, inspect artifacts and contract changes, and challenge claims without evidence. Record:

| Date / revision | Ticket | Decision | Evidence reviewed | Required revision / next ticket |
| --- | --- | --- | --- | --- |
| 2026-10-13 / 5 | B00-R2, B01-R2, B02-R2 | NEEDS_REVISION | Reran typecheck, 93 Jest tests and Expo check; verified 78 archive hashes, rendered screenshot/build log, API and design docs. | B00-R3, B01-R3, B02-R3; see dated review and next assignment. |
| 2026-10-12 / 4 | Current work review | NEEDS_REVISION | Types and 66 tests pass; inspected successful build/render, 117 matching hashes, current Expo patch drift and remaining UI/contract gaps. | B00-R2, B01-R2, B02-R2; see review and next assignment. |
| 2026-10-09 / 3 | B00/B01/B02 review | NEEDS_REVISION | Reran types/45 tests/Expo check; inspected actual handlers, schema defaults, blank PNG and failed existing native logs. | B00-R1, B01-R1, B02-R1; see next assignment. |
| 2026-10-09 / 1 | Audit | Plan created | Mobile types pass; 4 suites/14 tests pass; Expo compatibility check fails; native runtime not run. | B00 first; B02 specification available. |

## Plan update protocol

1. Compare report scope against the assigned ticket and prerequisite state.
2. Reconcile patch with current source, including unrelated dirty/untracked files.
3. Validate behavior/contracts and relevant tests; record missing runtime evidence.
4. Set ACCEPTED, NEEDS_REVISION, or a specific dependency state with reasons.
5. Increment revisions only when content changes; append dated change-log entry.
6. Update affected dependencies and issue a precise next builder prompt with owned files and commands.
7. Keep measured findings distinct from proposed budgets and code-level suspicions.

## Open decision log

| Decision | Current recommendation | Closure evidence / owner |
| --- | --- | --- |
| Mobile source baseline | Preserve current checkout; reviewed tracked baseline, excluding secrets. | B00 source manifest/patch |
| RN vs SwiftUI | Product owner selected SwiftUI-only iOS 26+ target on 2026-10-19; preserve RN as verified behavior and contract reference. | S00 evidence review, S01 separate native foundation; new product plan |
| Tab implementation | Prefer native system behavior if SDK-supported spike passes. | B04 device comparison |
| OS/device support | Explicit minimum after compatibility/product assessment; include current OS and iOS 26 glass baseline. | B00/B06 matrix |
| Private offline storage | Minimal scoped data with deliberate retention/security policy. | B03 threat/lifecycle assessment and owner policy decision |
| Billing UX | Preserve central subscription; investigate compliant iOS purchase journey before adding controls. | B07 current storefront/platform review |
| Scope of source library | Honest workspace/project scope; backend pagination preferred. | B01 contract inventory + B03 authorization |
| Performance thresholds | Master-plan values are initial proposals. | B06 Release baseline and agreed final budgets |
