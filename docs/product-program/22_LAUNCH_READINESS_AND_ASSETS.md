# SideBy Launch Readiness, Demo Assets, and Operational Protocols

**Document ID**: `LAUNCH-DOC-22`  
**Date**: 2026-10-30  
**Status**: Release Candidate Draft (Testing & Production Actions Deferred)  
**Parent Batch**: [LAUNCH-01](20_LAUNCH_COMPLETION_BATCH.md)

---

## 1. Capability Matrix & Truthful Copy Reconciliation (Task 13)

### Exact Candidate Capability Matrix

| Capability | Current State | Truthful Copy Boundary |
| :--- | :--- | :--- |
| **Two-Option Research** | Implemented | Researches 2 explicit options using web extraction and LLM synthesis. |
| **Evidence Attribution** | Implemented | Displays source URLs, publication timestamps, and support scores. |
| **Privacy / Public Snapshot** | Implemented (v3) | Records from private briefs require a dedicated public snapshot generated solely from option names to be shared. |
| **Decision Receipt** | Implemented | Distinguishes AI recommendation from user's recorded decision with frozen entity names. |
| **Decision Matrix** | Implemented | Allows custom weightings; validates JSONB markers server-side. |
| **Evidence Gap Detection** | Implemented | Identifies missing, one-sided, uncited, weak, and contradictory claims. |
| **History & PWA Drafts** | Implemented | Preserves offline composer drafts; provides bounded history pagination. |
| **Central SnapSolve Billing** | Implemented | Reads entitlement from SnapSolve Core; no local paid override or card checkout. |
| **Multi-Option Tournaments**| Partial / Experimental| Multi-option bracket composer is a frontend flow; not presented as core launch promise. |
| **Physical iPhone QA** | Pending / Blocked | Web authentication hotfix PR #174 is separate; physical device pass is unexecuted. |

### Copy Guidance (Adherence to 21_LAUNCH_COPY_DRAFTS.md)

- **Do NOT claim**:
  - Universal real-time truth or guaranteed zero-hallucination research.
  - Native iOS app parity (the web app is a responsive PWA).
  - Millions of concurrent users or instant guaranteed cloud persistence during server restarts.
  - Unlimited free usage or secret launch discount codes.
- **DO claim**:
  - Clear side-by-side comparison with cited sources you can inspect.
  - Transparent support scoring (distinguishing evidence support from probability).
  - Explicit separation between AI synthesis and your own recorded decision.
  - Integration with the central SnapSolve workspace ecosystem.

---

## 2. Deterministic Non-Sensitive Comparison Fixture (Task 14)

This deterministic fixture is provided for landing demos, offline preview, and automated mock environments. It is strictly classified as `provenance: "illustrative"` and never presented as live research.

```json
{
  "query": "Next.js vs Remix for Production Web Apps",
  "slug": "nextjs-vs-remix-web-apps",
  "provenance": "illustrative",
  "sourceCount": 3,
  "updatedAt": "2026-10-30T12:00:00.000Z",
  "entities": {
    "a": {
      "name": "Next.js",
      "subtitle": "React framework by Vercel",
      "mark": "N",
      "hex": "#000000",
      "logoUrl": "https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_dark_background.png"
    },
    "b": {
      "name": "Remix",
      "subtitle": "Full-stack framework by Shopify",
      "mark": "R",
      "hex": "#3992ff",
      "logoUrl": "https://remix.run/favicon.ico"
    }
  },
  "dimensions": [
    { "subject": "Data Fetching", "a": 88, "b": 92, "fullMark": 100 },
    { "subject": "Ecosystem & Hosting", "a": 95, "b": 78, "fullMark": 100 },
    { "subject": "Standard Web APIs", "a": 80, "b": 94, "fullMark": 100 },
    { "subject": "Learning Curve", "a": 75, "b": 82, "fullMark": 100 },
    { "subject": "Rendering Flexibility", "a": 92, "b": 80, "fullMark": 100 }
  ],
  "categories": [
    {
      "name": "Architecture & Standards",
      "winner": "b",
      "verdict": "Remix aligns closely with standard Web Fetch APIs and nested routing, while Next.js introduces Server Components and granular caching primitives.",
      "facts": [
        {
          "entity": "a",
          "label": "React Server Components",
          "value": "Native App Router RSC architecture with server actions",
          "source": "Next.js Documentation",
          "sourceUrl": "https://nextjs.org/docs/app/building-your-application/rendering/server-components",
          "sourceTitle": "Server Components - Next.js Docs",
          "confidence": 0.95,
          "freshness": "Stable"
        },
        {
          "entity": "b",
          "label": "Web Fetch Standards",
          "value": "Built on Web Standards Request/Response objects and HTML forms",
          "source": "Remix Documentation",
          "sourceUrl": "https://remix.run/docs/en/main/discussion/web-fetch",
          "sourceTitle": "Web Fetch API - Remix Docs",
          "confidence": 0.94,
          "freshness": "Stable"
        }
      ]
    },
    {
      "name": "Ecosystem & Deployment",
      "winner": "a",
      "verdict": "Next.js benefits from massive market adoption and deep first-party integration with Vercel and AWS infrastructure.",
      "facts": [
        {
          "entity": "a",
          "label": "Market Share",
          "value": "Industry default for enterprise React deployments",
          "source": "State of JS Survey",
          "sourceUrl": "https://stateofjs.com",
          "sourceTitle": "State of JavaScript Survey",
          "confidence": 0.91,
          "freshness": "Stable"
        },
        {
          "entity": "b",
          "label": "Multi-Runtime Support",
          "value": "Deploys to Node, Cloudflare Workers, Deno, and Vercel natively",
          "source": "Remix Deployment Guides",
          "sourceUrl": "https://remix.run/docs/en/main/guides/deployment",
          "sourceTitle": "Deployment Guides - Remix",
          "confidence": 0.90,
          "freshness": "Stable"
        }
      ]
    }
  ],
  "verdict": {
    "bestOverall": "Next.js",
    "developers": "Remix for standard Web API simplicity; Next.js for RSC and server performance",
    "summary": "Next.js offers unmatched ecosystem breadth, RSC performance, and enterprise hiring advantages. Remix offers clean standard Web APIs, intuitive nested routing, and excellent form mutation semantics."
  },
  "consensus": [
    "Both are first-class, production-ready React frameworks.",
    "Both support SSR, static generation, and edge execution."
  ],
  "contradictions": [
    "Community opinions diverge on whether RSC complexity is offset by bundle reduction."
  ],
  "sources": [
    {
      "title": "Next.js Documentation",
      "url": "https://nextjs.org/docs",
      "reliability": "Official",
      "fetchedAt": "2026-10-30"
    },
    {
      "title": "Remix Documentation",
      "url": "https://remix.run/docs",
      "reliability": "Official",
      "fetchedAt": "2026-10-30"
    },
    {
      "title": "State of JS Survey",
      "url": "https://stateofjs.com",
      "reliability": "Community",
      "fetchedAt": "2026-10-30"
    }
  ]
}
```

---

## 3. Capture Targets & Visual Storyboard (Task 15)

To prepare launch collateral without fabricating metrics or unreleased features, captures must be taken from real application states:

1. **Mobile Landing View**: Viewport 390×844px. Shows hero headline, search prompt bar, and supported comparison chips. No fake user counts.
2. **Filled Comparison Composer**: Mobile viewport. Shows explicit option names ("Next.js" vs "Remix") with optional priorities ("low latency", "standard web APIs") populated.
3. **Research Loader in Progress**: Shows real elapsed timer (`Elapsed 14s`), server step name (`Acquiring official documentation targets`), and truthful reconciliation disclaimer.
4. **Desktop Comparison Workbench**: Viewport 1440×900px. Shows 8/4 grid layout with ComparisonHeader, Verdict, Radar Chart, and Categories on the left, TableOfContents and DecisionReceipt on the right.
5. **Evidence Detail Drawer**: Expanded fact view highlighting exact source citation URL, publisher title, retrieval date, and support score (clearly labeled as evidence support, not truth probability).
6. **Explicit Decision Receipt**: Showing the AI recommendation side-by-side with the user's recorded decision ("My decision: Remix because our team prefers standard Web Fetch APIs") with frozen entity names.
7. **Mobile History Continuation**: Shows history list with 12 items rendered and the clean "Show more comparisons" button.

---

## 4. Availability & Dependency Failure Boundaries (Task 16)

Documented points of potential degradation:

- **Sign-in & Authentication**:
  - Dependent on Clerk API availability and third-party cookie/storage access.
  - If Clerk is unavailable: App displays fallback auth error; unauthenticated users can still view public comparisons by slug.
- **Comparison Creation Pipeline**:
  - Dependent on Tavily search, Firecrawl scraping, and DeepSeek / OpenRouter LLMs.
  - If primary LLM (DeepSeek) hits rate limits: System fails over to OpenRouter automatically.
  - If search/crawl fails: Partial results are preserved; user is presented with an honest retry option.
- **SnapSolve Central Billing**:
  - Managed by SnapSolve Cockpit (`https://snapsolve.ink/cockpit/#/subscription`).
  - SideBy does not store credit cards or process payments locally.
  - If Cockpit is unreachable: Entitlement defaults to Free plan (Flow) with 5 comparisons/day; no silent paid elevation occurs.
- **Public Sharing**:
  - Only comparisons with `input_scope = 'public'` and fully attributed citations can be published.
  - Private-brief comparisons require running a dedicated public snapshot before sharing.

---

## 5. Support Routing, Issue Triage & Rollback Notes (Task 17)

### Support & Issue Triage
- **Issue Intake**: Project repository issue tracker. No unconfigured external support inbox is assumed.
- **Triage Priority**:
  - **Critical (Blocker)**: Authentication loop, security/privacy regression, or data leakage in public endpoints. Action: Immediate deployment rollback to prior verified release SHA.
  - **High**: Provider API outage (DeepSeek/OpenRouter) or crawler failure. Action: Switch fallback provider configuration via environment variables.
  - **Normal**: Visual glitches, contained optional-panel errors (isolated by `SafePanel`). Action: Normal development cycle repair.

### Rollback Runbook & Migration Ordering
1. **Migration 020 Ordering Requirement**:
   - Migration `020_comparison_publication_scope.sql` is **required and unapplied**.
   - It MUST be applied to the target database before deploying the application code.
   - If deploying older code or rolling back, note that migration 020 is backward-compatible (adds nullable/defaulted columns).
2. **Deployment Rollback**:
   - Authorized coordinator rolls back to the previous stable deployment via the Vercel Dashboard or CLI (`vercel rollback`).
   - Do not perform destructive database rollbacks without validating schema ledger state.
   - Purge edge cache for `/compare/*` if any stale public response was served.

---

## 6. Local Plan Configuration & External Billing Boundary (Task 18)

### Local Configuration (Implemented in this repository)
The only usage limits and plan enforcement defined within SideBy are the local Free tier daily caps configured in `api/_lib/rate-limit.ts` and `api/usage.ts`:
- **Comparisons**: 5 per day
- **Follow-ups**: 10 per day
- **Refreshes**: 3 per day
- **Exports**: 10 per day
- *Daily usage caps reset at 00:00 UTC.*

### External Billing Authority
- **No Local Card Processing**: SideBy does not process payments, store cards, or manage subscriptions locally.
- **Central Delegation**: Checkout and portal actions (`/api/billing/checkout` and `/api/billing/portal`) redirect directly to SnapSolve Cockpit (`https://snapsolve.ink/cockpit/#/subscription`).
- **Plan Names & Pricing**: Marketing displays tier names (`Flow`, `Pulse`, `Core`, `Orbit`) as informational copy from `Pricing.tsx`. All cross-product pricing, seat quotas, and payment lifecycles are owned exclusively by SnapSolve Core.
- **Fail-Safe Behavior**: If SnapSolve Core entitlement cannot be verified, SideBy defaults to the Free plan (Flow) rate limits. No local paid elevation or unlimited usage is ever granted locally.
