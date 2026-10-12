# SideBy Mobile & PWA Quality Assurance (QA) Report

Prepared: 2026-10-09
Verification Environment: macOS arm64, Playwright 1.61.1, WebKit 26.5 (iOS 17.5 / iPhone 14 profile), Chromium (Pixel 5 & Desktop), Node.js v20+, Vitest v4.1.9, TypeScript 5.6
Working Tree Status: Active modifications in working directory (uncommitted).
Revision 2026-10-12: closed the three review gaps (real two-build update test + explicit activation reload, database-level in-flight uniqueness with unapplied migration noted, guard-persisted chunk recovery) and re-verified all gates. Physical iPhone audit remains pending.

---

## 1. Test Matrix & Verification Boundaries

To maintain absolute production readiness and engineering honesty, this report explicitly distinguishes between four tiers of verification:

1. **Source Inspection & Architectural Invariants**: Guarantees verified through static code structure, module imports, and type definitions (e.g., static virtual imports, lock acquisition guards, draft envelope typing, guarded storage access).
2. **Vitest Unit & Integration Suites (Executed)**: In-memory and mock integration suites verifying atomic distributed locks, renewal heartbeats, lock ownership verification, insert-time uniqueness fallback, draft envelope serialization, payload field validation, guarded storage, and error boundaries (23 test files, 177 tests passed).
3. **Automated Multi-Engine E2E (Executed)**: Real browser automation across Desktop Chromium, Mobile Safari (WebKit iPhone 14 profile), and Mobile Chrome (Pixel 5 profile) executing real rendering, DOM attributes, network interception, service worker lifecycles, and viewport metrics (full suite: 120 passed, 1 skipped). The genuine two-build update with unsaved input preservation runs on Desktop Chromium in its own spec with private builds and server (see §2.4).
4. **Pending Physical Hardware Audit (Documented Limitations)**: Hardware-specific capabilities that cannot be proven headlessly in WebKit or simulated viewports (e.g. physical Apple Taptic Engine vibrations, physical Face ID sheets, native iOS Safari "Add to Home Screen" system sheet).

| Device / Profile | Engine & Version | Viewport | Touch | Pixel Ratio | Verification Status |
|---|---|---|---|---|---|
| **iPhone 14 (Mobile Safari)** | WebKit 26.5 | 390 × 844 | Yes | 3x | **VERIFIED (Playwright WebKit Emulation)** |
| **Pixel 5 (Mobile Chrome)** | Chromium 1234 | 393 × 851 | Yes | 2.75x | **VERIFIED (Playwright Chromium Emulation)** |
| **Desktop Chrome** | Chromium 1234 | 1280 × 720 | No | 1x | **VERIFIED (Playwright Desktop)** |
| **Narrow Mobile (320px)** | WebKit & Chromium | 320 × 568 | Yes | 2x | **VERIFIED (Automated Geometry Tests)** |
| **Physical iPhone Hardware** | iOS 17 / 18 Physical | Variable | Native | Native | **PENDING PHYSICAL DEVICE AUDIT (Explicitly Not Claimed Headlessly)** |

---

## 2. Hardened Architecture & Verified Remediations

### 1. Lock Expiry, Renewal Heartbeat & Pre-Insert Verification
- **Issue**: A 30-second distributed lock without active renewal or pre-insert verification could expire during slow third-party LLM inference or network latency, allowing a concurrent request to re-acquire the lock and insert duplicate comparison records.
- **Remediation**:
  - In `frontend/api/_lib/redis.ts`:
    - Added `redisRenewLockToken(lock, ttlSeconds = 30)`: Atomic Lua script for Upstash Redis (`if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("expire", KEYS[1], ARGV[2]) else return 0 end`) and conditional `UPDATE` for PostgreSQL KV fallback (`expires_at = ... WHERE token = ...`).
    - Added `redisVerifyLockToken(lock)`: Confirms active ownership of the lock token before writing database rows.
  - In `frontend/api/_lib/sideby.ts`:
    - Active Heartbeat: An automatic periodic timer renews the lock every 10 seconds while the pipeline executes.
    - Pre-Insert Verification: Right before inserting comparison records (cached or fresh), the engine executes `verifyLockStillHeld()`. If lock ownership was lost or expired, it re-checks for existing in-flight jobs and aborts insertion with a retryable `409` (`COMPARISON_IN_PROGRESS`) rather than inserting a duplicate.
    - Direct In-Flight Check: An atomic database concurrency check immediately precedes `db.insert(comparisons)`.
    - Database Backstop: Every insert carries `comparisons.intent_key` (user + workspace + project + canonical slug, same derivation as the lock scope). The partial unique index `comparisons_intent_inflight_uniq` covers only `queued`/`running` rows, so the INSERT itself is atomic: a 23505 conflict adopts the visible winner (zero pipeline scheduling) or returns retryable 409 when the winner already finished. Non-unique insert errors propagate unchanged.
    - Safe Cleanup: Clears heartbeat interval and releases lock token in `finally`.
- **Verification Evidence**:
  - `frontend/api/_lib/__tests__/duplicate-intent.test.ts` (11/11 tests passed):
    - Verifies active renewal and that loss of lock ownership during slow processing aborts insertion and returns 409.
    - Verifies the database backstop: a 23505 insert conflict adopts the winner with zero pipeline scheduling, returns retryable 409 when no winner is visible, and rethrows non-unique failures untouched.
- **Remaining limitation**: the partial unique index exists as migration files only. No database was reachable from this environment, so `drizzle/0012_intent_inflight_uniqueness.sql` (mirrored to `neon/migrations/019_intent_inflight_uniqueness.sql`) has **not** been applied; run `pnpm db:neon:migrate` with `DATABASE_URL` in the deploy pipeline before claiming production enforcement. Until applied, the violation fallback is code-complete but the constraint does not exist in any database.

---

### 2. Draft Envelope Payload Field Validation
- **Issue**: Stored `sessionStorage` drafts were previously cast with `record.data as T` without verifying payload property types, risking malformed or non-string values (e.g., numbers, objects, unexpected injection properties) reaching React composers.
- **Remediation**:
  - In `frontend/src/lib/pwa/register.ts`:
    - Added `isValidDraftPayload(kind, data)`: Schema-specific validator ensuring composer payloads only contain optional string fields (`entityA`, `entityB`, `context`) and bracket payloads only contain optional string fields (`rawOptions`, `context`). Unexpected keys or non-string field types fail validation.
    - Integrated with `isValidEnvelope`: Any stored record failing payload validation is treated as invalid and immediately purged from `sessionStorage` via `clearPreservedDraft(key)`.
    - Added `DraftPayloadValidator<T>` predicate support on `getPreservedDraft<T>(key, scope, validator?)`.
    - Pre-save guard in `saveAllDrafts`: Rejects savers attempting to write invalid field types.
- **Verification Evidence**:
  - `frontend/src/lib/pwa/__tests__/draft-preservation.test.ts` (16/16 tests passed):
    - Verifies corrupted drafts with numbers or objects are discarded and wiped from storage.
    - Verifies unexpected payload properties cause draft rejection.
    - Verifies custom validator predicates.

---

### 3. Guarded Storage Access in Error Boundary
- **Issue**: In `frontend/src/components/ErrorBoundary.tsx`, direct access to `sessionStorage` (`getItem`, `setItem`, `removeItem`) could throw unhandled `SecurityError` or `DOMException` in private browsing or cookie-restricted environments. Separately, the chunk-reload guard write was fire-and-forget: if blocked storage dropped it, the next page load had no record of the attempt and automatic recovery could reload repeatedly.
- **Remediation**:
  - New module `frontend/src/lib/safe-storage.ts`: `safeSessionGet`, `safeSessionSet` (returns boolean), `safeSessionRemove`, shared `CHUNK_RELOAD_GUARD_KEY`, plus `reloadPage()` and `waitForNewController()` seams for testability.
  - `ErrorBoundary` uses the module everywhere (`componentDidCatch`, `handleReset`, "Go home" handler). Automatic chunk recovery now proceeds only when the guard write persists; otherwise the error surface stays up with the explicit user Reload action and no automatic reload occurs.
- **Verification Evidence**:
  - `frontend/src/lib/__tests__/safe-storage.test.ts` (3/3): round-trip, quota failure reporting, throwing storage getter.
  - `frontend/src/components/__tests__/ErrorBoundary.test.tsx` (4/4, React Testing Library): reloads once with working storage, never reloads when the guard cannot persist, never re-reloads once the guard exists, never reloads non-chunk errors.

---

### 4. Two-Build Update Lifecycle with Unsaved Input Preservation
- **Issue**: The lifecycle suite previously simulated the update (intercepted `sw.js`, manual prompt trigger, manual reload), so it could pass without any second build ever activating.
- **Remediation** (`frontend/e2e/pwa-two-build-update.spec.ts`, Desktop Chromium; other projects exclude it via `testIgnore` because Pixel 5 shares the Chromium `browserName` and the spec owns private builds/a private server):
  1. Build A (unique build-id meta marker) is produced into `dist/two-build` and served on a free localhost port; the page loads, becomes worker-controlled, and the composer holds dirty input (`"Next.js App Router"` / `"Remix Vite"`, dirty state asserted via the store seam).
  2. Build B (different bytes, new marker) is produced into the same directory while the page stays open; the browser's real update check (`registration.update()`, no navigation so dirty state survives) finds the waiting worker and raises the genuine prompt — no manual trigger, no fallback.
  3. The prompt shows the dirty warning and *"Save draft & update"*; the user click runs `applyUpdate()` (draft snapshot) and activates the worker.
  4. Proof is the live DOM: the build-B marker appears after the activation reload (poll tolerates the navigation), inputs are restored, the restoration toast shows, and a controller is present.
- **Adjacent product fix found by this test**: the first real run stuck on "Updating..." because activation relied on the registration plugin's auto-reload, which only fires when its register-time `isUpdate` flag is true — false for pages that loaded while uncontrolled, so no reload ever came. `applyUpdate()`/`forceApplyUpdate()` now own a single explicit reload (`activateAndReload` in `register.ts`): post skipWaiting, wait for the controller handoff (`waitForNewController`, 30s, reload-anyway fallback), then reload. The plugin's `onNeedReload` is a no-op to prevent double reloads. Covered by reload-count assertions in `register.test.ts` / `draft-preservation.test.ts`.
- **Verification Evidence**:
  - `e2e/pwa-two-build-update.spec.ts`: passes repeatedly standalone and in the full suite (Desktop Chromium).
  - Full `pnpm run test:e2e`: **120 passed, 1 skipped** (the known WebKit `context.setOffline` skip), including the two-build spec.
  - Hardening along the way: free-port selection, process-group server teardown, idempotent marker injection/cleanup, 300s hook budget, navigation-tolerant polling.

---

## 3. Physical Hardware Boundary Disclosure

Headless browser emulation via Playwright WebKit 26.5 simulates Apple's rendering engine (layout geometry, typography, CSS safe-area insets, and touch events). However, physical device behaviors cannot be proven headlessly and require hands-on physical testing:

| Capability | Automated WebKit Emulation Evidence | Physical Hardware Requirement | Audit Status |
|---|---|---|---|
| **Safe Area Insets** | Evaluated via `env(safe-area-inset-*)` CSS in WebKit | Dynamic Island / Notch visual alignment under native iOS status bar | Verified in WebKit; **Pending physical hardware inspection** |
| **iOS Auto-Zoom Prevention** | Input computed font-size verified `>= 16px` across all mobile viewports | Native iOS Safari keyboard viewport magnification lock | Verified in WebKit; Confirmed by Apple WebKit spec |
| **PWA Add to Home Screen** | `IosInstallGuideModal` step-by-step instructions displayed when `beforeinstallprompt` is absent | Native Safari Share Sheet "Add to Home Screen" action and icon generation | Instructions verified; **OS sheet action pending physical testing** |
| **Haptic Feedback** | Feature-detected via `navigator.vibrate` | Physical Apple Taptic Engine vibration response in iOS Safari / PWA | **Pending physical device audit** |
| **Biometric Auth / Face ID** | Clerk auth redirection flow tested | Apple Face ID authentication sheet display and credential autofill | **Pending physical device audit** |
| **Virtual Keyboard Resize** | Fixed/sticky bar placement verified above safe area | Interactive keyboard open/close window height resize events (`window.visualViewport`) | Verified via computed bounds; **Pending physical device audit** |

---

## 4. Test Execution Summary

- **TypeScript Typechecking**:
  - `pnpm run typecheck` (`tsc -b && tsc --noEmit -p api/tsconfig.json`): **0 errors across 100% of app and api files**.
- **ESLint**:
  - `pnpm lint`: **0 errors, 0 warnings** (strict compliance).
- **Vitest Unit & Integration Suites**:
  - Total: **23 test files, 177/177 tests passed**.
  - Includes: `duplicate-intent.test.ts` (11/11), `draft-preservation.test.ts` (16/16), `register.test.ts` (5/5), `safe-storage.test.ts` (3/3), `ErrorBoundary.test.tsx` (4/4), `push.test.ts` (13/13).
- **Playwright full suite (`pnpm run test:e2e`)**:
  - Total: **120 passed, 1 skipped** (the known Playwright WebKit internal error on `context.setOffline` reload), Desktop Chromium + Mobile Safari + Mobile Chrome.
  - Includes `e2e/pwa-lifecycle.spec.ts` (registration, control, offline shell, API network-only, scope-gated restoration) and `e2e/pwa-two-build-update.spec.ts` (genuine two-build update, Desktop Chromium only).
  - Incidental fix: `e2e/mobile-pwa.spec.ts` test 6 now mocks `/api/comparisons/validate` so the submit gate settles deterministically instead of validating against the dead dev-proxy backend (previously flaked to zero requests under load).
