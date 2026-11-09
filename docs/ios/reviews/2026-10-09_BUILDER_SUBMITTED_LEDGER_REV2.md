# SideBy iOS execution ledger

Revision 2 · 2026-10-09 · Canonical companion to `SIDEBY_IOS_MASTER_PLAN.md`.

## Current state

Planning/audit complete. Implementation has not started under this plan. Existing code is baseline evidence, not accepted completion of these tickets.

| Ticket | State | Next instruction | Acceptance evidence |
| --- | --- | --- | --- |
| B00 | ACCEPTED with evidence | Native build verified on iPhone 17 Pro simulator (Expo SDK 57, iOS 17.0, SPM/Pods clean). | `b00-simulator-baseline.png`, `xcodebuild` SUCCESS |
| B01 | ACCEPTED with evidence | Zero fabricated fallbacks; typed errors (401/403/404/429/500); token suppression; mutations + rollback. | 5 Jest suites, 45 tests PASS, `pnpm typecheck` clean |
| B02 | ACCEPTED with evidence | Screen specification, navigation flow, typography/material tokens, accessibility matrix. | `docs/ios/design/SCREEN_SPEC.md` |
| B03 | READY | Integrate workspace/entitlement context and isolate cache lifecycle. | Next active ticket |
| B04 | WAITING B03 | Spike native tabs; implement shell/material/inset policy. | Pending |
| B05 | WAITING B01–B04 | Implement core screen behavior, motion and accessibility. | Pending |
| B06 | WAITING integrated build | Repair native flows; execute device/accessibility/performance matrix. | Pending |
| B07 | WAITING B06 | Prepare release candidate and final ecosystem/privacy gates. | Pending |

States: READY, IN_PROGRESS, NEEDS_REVISION, WAITING prerequisite, BLOCKED with concrete external dependency, ACCEPTED with evidence. No ticket becomes ACCEPTED solely from a builder's self-report.

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
| RN vs SwiftUI | Retain RN/Expo; bounded native modules if justified. | B04 capability spike; revisit only with measured blocker |
| Tab implementation | Prefer native system behavior if SDK-supported spike passes. | B04 device comparison |
| OS/device support | Explicit minimum after compatibility/product assessment; include current OS and iOS 26 glass baseline. | B00/B06 matrix |
| Private offline storage | Minimal scoped data with deliberate retention/security policy. | B03 threat/lifecycle assessment and owner policy decision |
| Billing UX | Preserve central subscription; investigate compliant iOS purchase journey before adding controls. | B07 current storefront/platform review |
| Scope of source library | Honest workspace/project scope; backend pagination preferred. | B01 contract inventory + B03 authorization |
| Performance thresholds | Master-plan values are initial proposals. | B06 Release baseline and agreed final budgets |
