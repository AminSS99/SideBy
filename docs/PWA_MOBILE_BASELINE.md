# SideBy PWA & Mobile Baseline Report

Prepared: 2026-10-05
Environment: macOS arm64, Node.js v20+, Vite 6.4.3, React 18, TypeScript 5.8
Worktree State: Active branch `main`, commit `9d64125` ("Fix health checks and refresh product experience (#139)")

---

## 1. Executive Summary & Goals

This baseline documents the pre-implementation state of SideBy prior to mobile and PWA hardening. 
The initiative transforms SideBy into an exceptional mobile web app and installed PWA on iPhones and modern mobile browsers, while preserving:
1. Premium dark visual identity, warm amber/copper accents, refined editorial typography.
2. Meaningful transitions and interactive evidence workbench.
3. Authenticated data boundaries, rate limits, and billing authority (SnapSolve Core entitlement bridge).
4. Desktop and tablet excellence without degradations.

### Unresolved Exclusion Note
The specification states: *“The phrase 'we will not include that anymore' did not identify a feature or technology. It is an unresolved exclusion, not authorization to delete a feature. Before removing a capability, ask what it refers to. Continue independent improvements while that decision remains open.”*
Accordingly, **zero existing features, routes, billing paths, push notifications, or animations are deleted or removed**. All capabilities are retained and enhanced.

---

## 2. Baseline Measurements

### 2.1 Production Build & Bundle Metrics (Pre-Optimization)
- **Vite Build Time**: ~3.24s
- **CSS Bundle**:
  - `dist/assets/index-DfMg1wmw.css`: **173.99 kB** (gzip: **28.05 kB**)
- **Largest Vendor Chunks**:
  - `vendor-observability-DduFRvsb.js`: **478.76 kB** (gzip: **158.16 kB**) — Sentry
  - `vendor-charts-DPp1CPUn.js`: **277.53 kB** (gzip: **75.68 kB**) — Recharts / D3
  - `index-BWHmK5PC.js`: **226.86 kB** (gzip: **70.01 kB**) — Core index chunk
  - `vendor-analytics-CnxWT1lu.js`: **214.62 kB** (gzip: **71.14 kB**) — PostHog
  - `HTMLProjectionNode-DwasCLHT.js`: **194.08 kB** (gzip: **63.77 kB**) — Framer Motion projection
  - `vendor-animation-lOjAp5cq.js`: **178.85 kB** (gzip: **59.82 kB**) — GSAP + Framer Motion
  - `WatchlistPanel-B2gHBSUS.js`: **129.06 kB** (gzip: **30.36 kB**)
- **PWA Service Worker**:
  - `dist/sw.mjs`: **27.86 kB** (gzip: **9.00 kB**)
  - **Precache Size**: **75 entries (3,514.38 KiB / ~3.43 MiB)** — Unbudgeted; includes every lazy route and heavy observability vendor chunk.

### 2.2 Test Suite Baseline
- **Vitest**: 18 test files, 138 tests passing.
- **Typechecks**:
  - `pnpm exec tsc --noEmit`: 0 errors.
  - `pnpm run typecheck:api`: 0 errors.
- **Linter**:
  - `pnpm lint`: 0 errors.
- **Playwright E2E**:
  - Configured only for `Desktop Chrome` (30 tests across 5 files).
  - Missing WebKit and mobile viewport project targets.

---

## 3. Ranked Defect & Improvement Inventory

| Priority | Area | Issue Description | Planned Remediation |
|---|---|---|---|
| **P0** | **Viewport & Safe Areas** | `index.html` lacks `viewport-fit=cover`. App content is clipped or letterboxed on notched/Dynamic Island iPhones. Floating bottom nav uses ad-hoc safe-area margins. | Add `viewport-fit=cover` (with user zoom preserved). Centralize safe area CSS variables (`--sat`, `--sab`, `--sal`, `--sar`) and tokenized bottom clearance. |
| **P0** | **Keyboard / iOS Zoom** | Inputs with font-size `< 16px` trigger automatic Safari page zoom upon focus, causing sudden horizontal jumping and disorienting layout shifts. | Enforce minimum 16px (`1rem`) font-size on all mobile text inputs; maintain accessible scaling without auto-zoom. |
| **P0** | **Overlay Collisions** | `UpdatePrompt` is fixed at `bottom-4` (`z-[100]`), directly overlapping the floating bottom navigation (`h-[68px]` + safe area) on mobile screens. | Integrate `UpdatePrompt` into shared overlay hierarchy with responsive bottom spacing clear of the mobile nav bar. |
| **P0** | **Service Worker Routes** | `sw.ts` passes `new NavigationRoute(...)` to `registerRoute(matcher, handler)` incorrectly; denylist only checks `/^\/api\//` (missing `/api` root or auth callbacks). | Correct Workbox `registerRoute(navigationRoute)` semantics; expand API/auth denylists to `/^\/api($|\/)/` and `/^\/auth($|\/)/`. |
| **P0** | **Duplicate Mutation** | Rapid double-tapping "Research this decision" triggers duplicate jobs. Backend creates duplicate AI pipeline runs for identical queries in flight. | Add UI submit locking and backend query deduplication / in-flight reuse for identical query intents. |
| **P0** | **Account Switching** | When switching workspaces or signing out, cached React Query data could display prior workspace resources. | Explicitly clear queries and transient cache on auth/workspace state transitions. |
| **P1** | **iOS PWA Install Guidance** | `useInstallPrompt` hides on iOS because iOS Safari lacks `beforeinstallprompt`. No manual "Add to Home Screen" instructions exist. | Provide truthful, browser-aware installation instructions modal for iOS Safari and other non-prompt environments. |
| **P1** | **Manifest Orientation** | `manifest.ts` locks `orientation: "portrait"`, violating WCAG 2.2 AA (1.3.4 Orientation) and breaking iPad/landscape support. | Remove orientation lock to allow natural responsive rotation. |
| **P1** | **Offline Honesty** | Navigating offline to an uncached route could trigger generic error boundary without explanation. | Implement dedicated offline detection and friendly offline fallback states. |
| **P1** | **Precache Budget** | Precache downloads 3.5MB including heavy charts and observability chunks on first SW install. | Budget precache to core shell assets and cache non-critical route chunks on demand. |

---

## 4. Cache Policy Contract

| Resource Category | Strategy | Exclusions / Notes |
|---|---|---|
| **App Shell (`index.html`, root JS/CSS)** | Precached via Workbox | Core entry point; versions with each deploy |
| **API Endpoints (`/api/*`)** | Strictly `NetworkOnly` | **NEVER CACHED**. Guarantees research freshness and prevents private data exposure |
| **Auth & Billing (`/auth/*`, Clerk, Dodo)** | Strictly `NetworkOnly` | Excluded from SPA shell navigation interceptors and caching |
| **Hashed Static Assets (`/assets/*`, SVGs, fonts)** | `StaleWhileRevalidate` | Bounded cache (max 120 entries) with quota eviction |
| **Public Logos & Fonts (cross-origin)** | `CacheFirst` | Allowed only for public fonts and static images. Excludes signed URLs (`token=`, `signature=`) |
