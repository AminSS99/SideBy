# B01-R1 Backend API Contract Ledger

This document establishes the verified API contracts between the SideBy mobile client (`sideby-mobile`) and the Next.js API route handlers located in the repository under `frontend/api/_routes/`.

All contracts have been audited against the actual production backend TypeScript source files and validated with 66 comprehensive unit tests covering real HTTP response boundaries, error normalization, schema safety, origin stripping, and cancellation.

---

## 1. Verified Route Matrix

| HTTP Method | Endpoint Path | Request Content-Type & Body | Response Content-Type & Success Payload | Error Status & Envelope | Backend Source Handler | Legacy / Deprecated Variants | Verification Status |
|:---|:---|:---|:---|:---|:---|:---|:---|
| `GET` | `/api/comparisons?limit={n}` | None | `application/json`<br>`{ comparisons: ComparisonHistoryItem[] }` | `401 Unauthorized`<br>`500 Internal Server` | `frontend/api/_routes/comparisons.ts` | None | Simulated with unit & contract tests |
| `POST` | `/api/comparisons` | `application/json`<br>`{ query: string, workspaceId?: string, projectId?: string }` | `application/json`<br>`ComparisonJob`<br>`{ id, status: 'queued'|'running'|'completed'|'failed', progress: 0..100, activeStep, query, result?, error? }` | `400 Bad Request`<br>`422 Unprocessable (QUERY_NOT_COMPARABLE)`<br>`429 Rate Limit`<br>`500 Server Error` | `frontend/api/_routes/comparisons.ts` | None | Simulated with unit & contract tests |
| `GET` | `/api/comparisons/:id` | None | `application/json`<br>`ComparisonJob`<br>`{ id, status, progress, activeStep, query, result?, error?, failedStep?, retryable? }` | `404 Not Found`<br>`401 Unauthorized`<br>`500 Server Error` | `frontend/api/_routes/comparisons/[id].ts` | None | Simulated with unit & contract tests |
| `POST` | `/api/comparisons/:id/manage` | `application/json`<br>`{ action: 'refresh' }` | `application/json`<br>(Status 202 Accepted)<br>`{ success: true, message: string, refreshId?: string }` | `400 Bad Request`<br>`404 Not Found`<br>`429 Rate Limit`<br>`500 Server Error` | `frontend/api/_routes/comparisons/[id]/manage.ts` | None | Simulated with unit & contract tests |
| `POST` | `/api/comparisons/:id/manage` | `application/json`<br>`{ action: 'retry' }` | `application/json`<br>`{ success: true, message: string }` | `400 Bad Request`<br>`404 Not Found`<br>`429 Rate Limit`<br>`500 Server Error` | `frontend/api/_routes/comparisons/[id]/manage.ts` | None | Simulated with unit & contract tests |
| `POST` | `/api/comparisons/:id/manage` | `application/json`<br>`{ action: 'organize', isFavorited?: boolean, folder?: string|null, tags?: string[] }` | `application/json`<br>`{ success: true, comparison: { isFavorited?: boolean, folder?: string|null, tags?: string[], updatedAt?: string } }` | `400 Bad Request`<br>`404 Not Found`<br>`500 Server Error` | `frontend/api/_routes/comparisons/[id]/manage.ts` | None | Simulated with unit & contract tests |
| `POST` | `/api/comparisons/:id/actions` | `application/json`<br>`{ action: 'export', format: 'markdown' }` | **`text/markdown; charset=utf-8`**<br>Raw markdown string content (NOT JSON) | `400 Bad Request`<br>`404 Not Found`<br>`500 Server Error` | `frontend/api/_routes/comparisons/[id]/actions.ts` | Legacy client assumed JSON `{ markdown: string }`, fixed in R1 | Simulated with fetch-boundary tests |
| `POST` | `/api/comparisons/:id/actions` | `application/json`<br>`{ action: 'export', format: 'json' }` | `application/json`<br>`ComparisonData` JSON object | `400 Bad Request`<br>`404 Not Found`<br>`500 Server Error` | `frontend/api/_routes/comparisons/[id]/actions.ts` | None | Simulated with unit & contract tests |
| `POST` | `/api/comparisons/:id/actions` | `application/json`<br>`{ action: 'follow-up', question: string }` | `application/json`<br>`{ answer: string, evidence?: FollowUpEvidence[], confidence?: number }` | `400 Bad Request`<br>`404 Not Found`<br>`429 Rate Limit`<br>`500 Server Error` | `frontend/api/_routes/comparisons/[id]/actions.ts` | None | Simulated with unit & contract tests |
| `POST` | `/api/comparisons/:id` | `application/json`<br>`{ rating: number, correction?: string, sourceReport?: string }` | `application/json`<br>`{ success: true }` | `400 Bad Request`<br>`404 Not Found`<br>`500 Server Error` | `frontend/api/_routes/comparisons/[id].ts` | None | Simulated with unit & contract tests |
| `POST` | `/api/comparisons/validate` | `application/json`<br>`{ query: string }` | `application/json`<br>`{ canStart?: boolean, intent?: { canStart: boolean, message?: string, category?: string } }` | `400 Bad Request`<br>`422 Unprocessable`<br>`500 Server Error` | `frontend/api/_routes/comparisons/validate.ts` | None | Simulated with unit & contract tests |
| `GET` | `/api/usage` | None | `application/json`<br>`{ plan?: string, limits?: Record<string, number|null>, usage?: Record<string, { used: number, limit: number|null, remaining: number|null }>, billingConfigured?: boolean, message?: string|null }` | `401 Unauthorized`<br>`500 Server Error` | `frontend/api/_routes/usage.ts` | Invented `{}` defaults eliminated in R3 | Simulated with unit & contract tests |
| `POST` | `/api/source-feedback` | `application/json`<br>`{ sourceUrl: string, vote: -1|0|1, comparisonId?: string, reason?: string }` | `application/json` (Status 201 Created)<br>`{ feedback: { id: string, sourceUrl?: string, vote?: number, reason?: string|null } }` | `400 Bad Request`<br>`500 Server Error` | `frontend/api/_routes/source-feedback.ts` | None | Simulated with unit & contract tests |

---

## 2. Key Transport and Safety Guarantees

1. **Raw Markdown vs JSON Response Handling (R1)**:
   - `apiFetch` inspects the HTTP response `Content-Type` header.
   - For `text/markdown` and `text/plain`, it resolves directly to `response.text()` without invoking `JSON.parse()`, preventing client crashes and preserving multi-line formatting.
   - Explicit `responseType?: 'json' | 'text' | 'auto'` is supported on `ApiFetchOptions`.
2. **Honest Lifecycle and Cache Separation (R2)**:
   - `manageComparison(id, 'refresh' | 'retry')` returns an acknowledgement object `{ success: true, message: string }`.
   - The comparison detail screen invalidates TanStack Query keys `['comparisonDetail', id]`, `['history']`, and `['usage']`, and refetches the full job instead of overwriting the cached `ComparisonJob` with `{ success: true }`.
3. **Zero Invented Metric Defaults (R3)**:
   - Absent confidence, freshness, source reliability, and quota metrics are represented as `null | undefined` and rendered as `"Unknown"` or `"Active Plan"`.
   - Schemas strictly disallow fallback manufacturing of fake `0.85` confidence, `Fresh` status, `Official` reliability, or Free Plan quotas.
   - Unlimited quotas (`limit: null`) are explicitly modeled with `isUnlimited: true`.
4. **Race-Condition and Mutation Serialization (R4)**:
   - Both `app/comparison/[id].tsx` and `app/(tabs)/history.tsx` serialize mutation execution per item. Rapid repeated taps are ignored while a mutation is in-flight.
   - Optimistic updates roll back to previous state if the network request fails.
   - Feedback rating lifecycle cleanly tracks `idle -> pending -> confirmed | error`.
5. **Origin Security and Auth Token Policy (R5)**:
   - Outgoing requests to third-party or untrusted origins have `Authorization` headers strictly stripped, whether caller-supplied or generated.
   - Auth token getter failures throw typed `AUTH_ERROR` (status 401) immediately.
   - Pre-aborted signals reject synchronously with typed `CANCELLED` errors without initiating socket traffic.
   - `Retry-After` header parsing supports both integer seconds and RFC 7231 HTTP-date strings.
6. **Example Brief Isolation (R6)**:
   - Example comparisons (`demo-*`, `example-*`) display a persistent illustrative banner.
   - Live mutations (`refresh`, `retry`, `favorite`, `feedback`, `follow-up`) are blocked with typed `EXAMPLE_READ_ONLY` errors before making network calls.

---

# B01-R2 appendix — handler paths and real shapes verified 2026-10-12

All handler sources below were read directly (not inferred from the R1
matrix). Mobile mapping changes in B01-R2 cite these exact lines.

## A. Actual handler source paths (correcting the R1 matrix)

The R1 matrix lists `frontend/api/_routes/comparisons.ts` (flat file). The
real handlers are per-route files:

- `GET /api/comparisons` (list, `?limit=`, `?action=taxonomy`) and
  `POST /api/comparisons` (create): `frontend/api/_routes/comparisons/index.ts`
- `GET /api/comparisons/:id` (detail) and `POST /api/comparisons/:id`
  (feedback `{rating, correction?, sourceReport?}` → `{success: true}`
  after DB insert + `canAccessComparison`, else 404/400/500):
  `frontend/api/_routes/comparisons/[id].ts`
- `POST /api/comparisons/:id/manage` (`refresh` | `retry` | `organize`):
  `frontend/api/_routes/comparisons/[id]/manage.ts`
- `POST /api/comparisons/validate`: `frontend/api/_routes/comparisons/validate.ts`
- `GET /api/usage` (+ `?type=quality` admin mode):
  `frontend/api/_routes/usage.ts`
- `POST /api/source-feedback`: `frontend/api/_routes/source-feedback.ts`

## B. Real `POST :id/manage` organize response (favorite acknowledgement)

`manage.ts` validates with `ManageBodySchema` (`action: refresh|retry|organize`,
`isFavorited?`, `folder?`, `tags?`), checks `canMutateComparison` (404
otherwise), applies the update, and returns the DB row via `.returning()`:

```json
{ "success": true,
  "comparison": { "isFavorited": true, "folder": null, "tags": [], "updatedAt": "..." } }
```

`comparisons.is_favorited` is `boolean NOT NULL DEFAULT false`
(`frontend/src/db/schema.ts`), so `comparison.isFavorited` is ALWAYS present
on success. B01-R2 therefore REQUIRES it: mobile `OrganizeResponseSchema`
treats a missing `isFavorited` as `MALFORMED_RESPONSE` and `toggleFavorite`
returns only the server-persisted value — no request echo. Verified by code
read; live favorite round-trip on staging: NOT RUN.

## C. Real `GET /api/usage` response (quota truthfulness)

Handler (`usage.ts`) returns:

```json
{ "plan": "free",
  "limits": { "comparisonsPerDay": 5, "followUpsPerDay": 10, "refreshesPerDay": 3, "...": "..." },
  "usage": { "comparison": {"used": n, "limit": m, "remaining": k}, "followUp": {}, "refresh": {}, "...": {} },
  "billingConfigured": true,
  "subscription": { "source": "...", "status": "active", "...": "..." },
  "message": null }
```

Semantics verified in `api/_lib/subscription.ts` + `api/_lib/rate-limit.ts`:

- `usage.<metric>` ALWAYS carries the free-plan daily window (finite numbers),
  regardless of the user's plan (`getUsageStatus` has no plan input).
- Paid entitlement lives in `limits.*` as `UNLIMITED = Number.MAX_SAFE_INTEGER`
  — serialized as `9007199254740991`, NEVER as JSON null.
- `subscription.status` may be `"unknown"` (`free_fallback`): the `plan` value
  is then a fallback guess, not an authoritative entitlement.

B01-R2 mobile mapping (`src/api/usage.ts`): unlimited iff either source is
null or `>= MAX_SAFE_INTEGER` (plan-level wins over free-window numbers);
missing limits in both sources = `unknown` (rendered "Unknown", never
"Unlimited"); missing used = unknown remaining; missing plan or
`subscription.status === "unknown"` = "Unknown plan" with an Unknown badge,
never "Active". Verified by unit tests; live staging usage flow: NOT RUN.

## D. Staging checks NOT RUN

No live staging favorite/export/usage flow was performed in B01-R2 (no
authorized test credentials/environment were provided). All contract claims
above rest on backend source reads + mocked-boundary unit/component tests.
Required before acceptance: a real staging favorite (confirm persisted
`isFavorited`), export (both formats), and usage fetch against the deployed
API with a test account; never substitute production research.
