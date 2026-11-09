# SnapSolve ecosystem contract

Status: proposed cross-product contract based on existing SideBy Core adapter; verify with SnapSolve owner before changing public APIs. Keep sibling iOS work unmodified.

## Authority and ownership

| Domain | Authority | SideBy responsibility |
| --- | --- | --- |
| Identity and sessions | Clerk configuration plus Core identity mapping | Validate session server-side; preserve return intent; clear scoped caches |
| Workspace directory/membership | Core shared-workspace contract | Explicit external↔Core workspace mapping and permission enforcement |
| Subscription, payments, entitlements | SnapSolve Core and its central Dodo integration | Check product-feature access; display state; link central checkout/portal |
| Comparison content and provenance | SideBy | Tenant-scoped records, source policy, lifecycle, export/delete |
| Shared security | Core policy plus product enforcement | Never assume ecosystem membership grants every product capability |
| Cross-product events | Versioned signed outbox/event contract | Idempotent emission and replay; bounded retries; minimal metadata |
| Native UI | SideBy iOS owner; Rallia separately | Agree API contract, deep links and feature capability matrix |

Do not directly join another product's internal tables as a shortcut. Sharing a workspace is not sharing every document by default. Core identifiers and local identifiers are not interchangeable; use explicit mappings and schema validation.

## Required contract envelope

Every request/response crossing the boundary should have documented API version, authenticated principal, product audience, workspace, feature, correlation ID, and error semantics. Signatures cover canonical payload bytes and timestamp; replay protection and clock tolerance must be verified at both ends. Do not log signatures, tokens or raw private bodies.

Existing `frontend/api/_lib/snapsolve-core.ts` contains signed calls, a 3-second timeout, event outbox, workspace resolution and entitlement checks. Source presence proves implementation exists, not correctness in all deployments.

Specific security review item: the adapter sends `email_verified: Boolean(args.email)`. Inspect caller provenance and the Core verification contract. Presence of an email string alone must never establish verified identity or permit account linking. Mark this as a review requirement, not a confirmed exploit without tracing callers and server enforcement.

## Failure-state contract

| Dependency failure | Allowed product behavior | Forbidden behavior |
| --- | --- | --- |
| Core workspace unavailable | Clearly indicate unavailable switching; bounded retry; preserve already-authorized local UI where policy permits | Guess membership or attach data to another workspace |
| Entitlement service unavailable | Follow explicit centrally agreed grace/expiry policy; show temporary state | Grant paid unlimited access from legacy local rows |
| Checkout provider unavailable | Keep research/history usable under verified permissions; retry checkout later | Fake payment success or create a second independent subscription |
| Search/extraction provider unavailable | Isolate job, retain partial evidence labeled incomplete, bounded retry | Fabricate citations or report completed research |
| Outbox delivery unavailable | Persist pending event with dedup ID, capped retry and dead-letter visibility | Block core decision viewing or emit duplicate rewards |
| Native handoff unavailable | Offer safe web continuation on authorized URL | Put bearer tokens or private queries in public deep-link analytics |

## Contract test matrix

Exercise the same user and two users across two workspaces: member, admin, removed member, invited-but-unaccepted member and nonmember. Cross each with free/paid/canceled/payment-pending/entitlement-unavailable. Test state changes while a job, sheet and cached view are open.

For billing: one checkout intent → central customer/subscription → signed provider event → Core entitlement → SideBy UI update. Replay each event and reorder delivery; exactly one entitlement/reward effect. Cancellation timing must match the catalog, not a local assumption.

For native/web parity: maintain a versioned capability list and shared request/response fixtures. Browser-only features return an explicit unsupported capability rather than failing native decoding. Keep previous released clients compatible through rollout.

## Coordination and dependencies

Before shared auth/workspace/billing/schema changes, produce a contract diff and migration plan with tests for the previous version. Product coordinator approves sequencing with Core/native owners. No unsolicited messages to other chats; coordination remains through the user unless explicitly authorized.

Proposed names are not renaming instructions. Record the user's final ecosystem naming later without changing service URLs or product slugs casually.
