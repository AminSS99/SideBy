# Revision 3 Repair Report: Tickets B00-R1, B01-R1, B02-R1

- **Date**: 2026-10-09
- **Author**: Mobile Builder
- **Plan Revision**: Revision 3 (`SIDEBY_IOS_MASTER_PLAN.md` rev 3 / `BUILDER_RUNBOOK.md` rev 3)
- **Status Proposed**: `READY_FOR_REVIEW` (no ticket marked `ACCEPTED` by builder)

---

## 1. Executive Summary & Verification Matrix

| Ticket | Scope & Review Findings Addressed | Automated Test / Verification Results | Evidence Artifacts | Status Proposed |
| :--- | :--- | :--- | :--- | :--- |
| **B00-R1** | Runnable source evidence, native build log, authentic rendered UI screenshot, runtime vs target separation, SHA-256 source manifest | `xcodebuild` clean exit code 0; app launch PID 26232 verified on simulator; OCR verified on screen | `docs/ios/evidence/B00-R1/BUILD.log`<br>`docs/ios/evidence/B00-R1/APP_LAUNCH_VERIFIED.png`<br>`docs/ios/evidence/B00-R1/APP_LAUNCH_SIGN_IN.png`<br>`docs/ios/evidence/B00-R1/SOURCE_MANIFEST.sha256` | `READY_FOR_REVIEW` |
| **B01-R1** | Findings R1–R6: raw text/markdown export decoding, HTTP-date Retry-After, auth token stripping on external URLs, malformed response/job guards, quota unbounded mapping, typed error envelopes | 66/66 Jest tests pass across 6 suites; `tsc --noEmit` clean (0 errors) | `docs/ios/evidence/B01-R1/CONTRACTS.md`<br>`src/api/__tests__/*.test.ts` | `READY_FOR_REVIEW` |
| **B02-R1** | Specification reconciliation matching master plan sections 5–7: exactly 3 tabs + modal Account sheet, Contender A/B composer, kinetic swap button, dynamic safe area clearance, `@react-navigation/bottom-tabs` primitives, semantic dark tokens | Spec rewritten and validated against design system tokens and layout geometry | `docs/ios/design/SCREEN_SPEC.md` | `READY_FOR_REVIEW` |

---

## 2. Environment & Tooling Identity

- **Host OS**: macOS (Darwin 26B5091g arm64)
- **Node**: `v22.22.3`
- **pnpm**: `9.15.4`
- **TypeScript**: `5.7.3` (`tsc --noEmit` 0 errors)
- **Expo SDK**: `~57.0.27` (`expo install --check` dependencies up to date)
- **Xcode**: `27.0` (Build version `27A266a`)
- **Simulator Device**: `iPhone 17 Pro` (UDID `39A881DD-22B0-402C-96FF-F68AF2366CBF`)
- **Simulator Runtime**: `iOS 27.0` (`SimRuntime.iOS-27-0`, build `24A5423a`)
- **Deployment Target (`IPHONEOS_DEPLOYMENT_TARGET`)**: `17.0` (distinct from runtime `27.0`)
- **Bundle ID**: `ink.snapsolve.sideby`

---

## 3. Ticket B00-R1: Runnable Source Evidence & Native Launch Verification

### 3.1 Source Manifest
- Generated clean SHA-256 hash inventory of all 117 project source files at [`/Users/aminsobor/Dev/SideBy/docs/ios/evidence/B00-R1/SOURCE_MANIFEST.sha256`](file:///Users/aminsobor/Dev/SideBy/docs/ios/evidence/B00-R1/SOURCE_MANIFEST.sha256).
- Strictly excluded `.env*`, `DerivedData`, `build/`, `node_modules`, `Pods`, and generated logs.

### 3.2 Native Build Investigation & Resolution
- **Root Cause of Previous Blank Screen & Crash**:
  1. The iOS 27.0 SDK runtime (`iphonesimulator27.0`) introduced an enforcement requiring UIScene lifecycle adoption (`_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`).
  2. Expo's default standalone AppDelegate did not declare `UIApplicationSceneManifest` or `SceneDelegate`, causing iOS 27 to abort execution immediately before React Native mounted.
  3. `ReactNativeDelegate` required explicit implementation of `bundleURL()` returning the local embedded bundle fallback.
- **Remediation**:
  - Implemented `SceneDelegate: UIResponder, UIWindowSceneDelegate` and `application(_:configurationForConnecting:options:)` in `ios/SideBy/AppDelegate.swift`.
  - Added `UIApplicationSceneManifest` in `ios/SideBy/Info.plist`.
  - Implemented `bundleURL()` in `ReactNativeDelegate` resolving `main.jsbundle` directly.
- **Native Build Execution**:
  - Executed: `xcodebuild -workspace ios/SideBy.xcworkspace -scheme SideBy -configuration Debug -destination 'platform=iOS Simulator,id=39A881DD-22B0-402C-96FF-F68AF2366CBF' build`
  - Build completed with **`** BUILD SUCCEEDED **`** (exit code 0).
  - Complete dated log captured in [`/Users/aminsobor/Dev/SideBy/docs/ios/evidence/B00-R1/BUILD.log`](file:///Users/aminsobor/Dev/SideBy/docs/ios/evidence/B00-R1/BUILD.log).

### 3.3 Authentic Rendered UI Evidence
- The app was installed on the booted `iPhone 17 Pro` simulator and launched (`ink.snapsolve.sideby: 26232` / `26417`).
- Captured authentic high-resolution screenshots:
  - [`APP_LAUNCH_VERIFIED.png`](file:///Users/aminsobor/Dev/SideBy/docs/ios/evidence/B00-R1/APP_LAUNCH_VERIFIED.png) / [`rendered-composer.png`](file:///Users/aminsobor/Dev/SideBy/docs/ios/evidence/B00-R1/rendered-composer.png): Shows the Contender A/B Composer with SideBy brand header, Option A & B input fields, kinetic swap control, curated benchmarks, evaluation context input, and bottom tabs (`Compare`, `History`, `Sources`).
  - [`APP_LAUNCH_SIGN_IN.png`](file:///Users/aminsobor/Dev/SideBy/docs/ios/evidence/B00-R1/APP_LAUNCH_SIGN_IN.png): Shows the authentication gateway screen with Email/Password fields, Social Auth buttons, and "Explore as Guest →".
- Vision OCR verification confirmed the on-screen rendered UI strings directly from the frame buffer:
  ```
  SIDEBY INTELLIGENCE
  SideBy
  • AUTONOMOUS DECISION ENGINE
  Make the call.
  Two contenders in. A source-backed, calibrated verdict out.
  OPTION A
  First Option (e.g. Astro)
  CURATED BENCHMARKS
  Astro vs Sveltekit
  PostgreSQL vs MongoDB
  EVALUATION CONTEXT (OPTIONAL)
  e.g. High-throughput edge runtime or startu...
  Run Deep Comparison +
  Compare
  History
  Sources
  ```

---

## 4. Ticket B01-R1: Transport & State Contracts Verification

### 4.1 Resolution of Review Findings (R1–R6)
1. **R1 (Export Decoding)**:
   - Added content-type boundary detection in `apiFetch`. If `text/markdown`, returns raw text preserving GitHub-flavored Markdown without premature JSON parsing.
   - Verified by unit tests in `src/api/__tests__/client.test.ts` and `src/api/__tests__/comparisons.test.ts`.
2. **R2 (Cache Invalidation & Ack Rollback)**:
   - Verified that job mutation failure preserves previous cache states and management acknowledgements do not wipe valid cached jobs.
   - Unit tests verify `EXAMPLE_READ_ONLY` blocking for static mock IDs (`example-astro-vs-nextjs`).
3. **R3 (Removal of Invented Data Defaults)**:
   - Eliminated schema defaulting of arbitrary metrics or fake token usage.
   - Enforced strict decoding: malformed usage payloads (`{}`) throw `MALFORMED_RESPONSE`.
   - Unlimited quota correctly maps to `isUnlimited: true`, `limit: null`.
4. **R4 (Signal & Cancellation Semantics)**:
   - Added handling for pre-aborted signals: immediately throws `SideByApiError` with `CANCELLED` and `statusCode: 0`.
5. **R5 (Credential Isolation)**:
   - Added strict origin matching before injecting Clerk `Authorization: Bearer` headers. External / third-party URLs strip caller authorization headers.
6. **R6 (Retry-After Header Parsing)**:
   - Added dual-mode `Retry-After` parsing supporting both integer seconds (`120`) and HTTP-date formats (`Wed, 21 Oct 2026 07:28:00 GMT`).

### 4.2 Automated Test Execution
- Executed: `pnpm exec jest --runInBand`
- **Result**: 6 suites passed, 66 tests passed (0 failures).
  - `src/api/__tests__/sources.test.ts`: PASS
  - `src/api/__tests__/client.test.ts`: PASS
  - `src/api/__tests__/comparisons.test.ts`: PASS
  - `src/api/__tests__/contracts.test.ts`: PASS
  - `src/api/__tests__/usage.test.ts`: PASS
  - `src/utils/__tests__/progress.test.ts`: PASS
- TypeScript check (`pnpm typecheck`): PASS (0 errors).
- Dependency validation (`pnpm exec expo install --check`): PASS.

### 4.3 Verified Contract Ledger
- Authored [`/Users/aminsobor/Dev/SideBy/docs/ios/evidence/B01-R1/CONTRACTS.md`](file:///Users/aminsobor/Dev/SideBy/docs/ios/evidence/B01-R1/CONTRACTS.md) detailing:
  - Exact route matrix, HTTP methods, headers, request/response bodies.
  - Success/error schemas and backend implementation file mappings.
  - Staging verification status: Marked `NOT RUN (PENDING STAGING GATE)`.

---

## 5. Ticket B02-R1: Design Specification Reconciliation

- Rewrote [`/Users/aminsobor/Dev/SideBy/docs/ios/design/SCREEN_SPEC.md`](file:///Users/aminsobor/Dev/SideBy/docs/ios/design/SCREEN_SPEC.md) strictly aligned with master plan sections 5–7:
  1. **Tab Structure**: Exactly 3 bottom tabs (`Compare`, `History`, `Sources`) + modal `Account` sheet.
  2. **Composer Specification**: Contender A and Contender B inputs, kinetic swap button, optional context field, and combined 800-character budget.
  3. **Navigation Primitives**: Grounded in installed `@react-navigation/bottom-tabs` with standard iOS tab bar semantics.
  4. **Geometry & Clearance**: Dynamic safe area clearance using `useSafeAreaInsets().bottom + 64 + 16` (no fixed unmeasured offsets).
  5. **Design System & Typography**: Semantic dark obsidian tokens (`#0A0B0E`), WCAG AAA minimum contrast (7:1+), Dynamic Type scaling up to `accessibilityXXXLarge`.
  6. **Screen × State × Environment Matrix**: Complete edge-case coverage including offline banner, cold cache, unknown confidence, tie verdicts, cancellation, and quota exhaustion.

---

## 6. Propose Status

All acceptance criteria for B00-R1, B01-R1, and B02-R1 have been fulfilled with authentic evidence artifacts.

In accordance with `BUILDER_RUNBOOK.md`:
- **B00-R1**: Propose `READY_FOR_REVIEW`
- **B01-R1**: Propose `READY_FOR_REVIEW`
- **B02-R1**: Propose `READY_FOR_REVIEW`

Awaiting coordinator review before proceeding to Ticket B03 integration.
