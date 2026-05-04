# SideBy — Agent Guide

## Overview

SideBy is a production-grade Vite + React SaaS for source-backed AI comparisons. Users enter a comparison query (e.g., "React vs Vue"), and the system researches entities, extracts facts, scores dimensions, and generates a verdict — all with cited sources.

## Tech Stack

- **Frontend**: Vite 6 + React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Vercel Functions (Node.js runtime)
- **Auth**: Clerk (users, orgs, memberships)
- **Database**: Neon Postgres with Drizzle ORM
- **Cache/Locks**: Upstash Redis
- **AI**: DeepSeek (primary), OpenRouter (fallback)
- **Search**: Tavily
- **Extraction**: Firecrawl
- **Embeddings**: OpenAI `text-embedding-3-small`
- **Analytics**: PostHog
- **Error Tracking**: Sentry
- **Package Manager**: pnpm

## Project Structure

```
frontend/
  src/
    pages/           # Route pages (marketing + app)
    components/      # UI components (shadcn + custom)
    contexts/        # React contexts (auth, workspace, projects)
    lib/             # Utilities (api, posthog, sentry)
    db/
      schema.ts      # Drizzle schema (~20 tables)
      index.ts       # Neon connection
  api/               # Vercel API routes
    _lib/            # Shared backend code
      job-engine.ts         # 8-step comparison pipeline
      followup-engine.ts    # Vector search follow-ups
      refresh-engine.ts     # Comparison refresh
      export-engine.ts      # Markdown/JSON export
      rate-limit.ts         # Redis-backed usage caps
      route-guard.ts        # Rate limit middleware
      analytics.ts          # PostHog server-side
      providers/            # AI adapters (deepseek, openrouter)
    comparisons/       # Comparison CRUD routes
    webhooks/clerk.ts  # Clerk webhook handler
    usage.ts           # Daily usage status
vercel.json          # Security headers + rewrites
```

## Build Commands

```bash
# Install dependencies
pnpm install

# Dev server
pnpm dev

# Production build
pnpm run build

# Lint
pnpm lint

# Type check
pnpm exec tsc --noEmit
```

## Environment Variables

See `frontend/.env.example` for all variables. Key required ones:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `DEEPSEEK_API_KEY`
- `TAVILY_API_KEY`
- `FIRECRAWL_API_KEY`
- `OPENAI_API_KEY` (for embeddings)

## Database Schema

Key tables:

- `users` / `orgs` / `org_memberships` — synced from Clerk webhooks
- `workspaces` / `projects` — user-created containers
- `comparisons` — the main research job (status, progress, result JSON)
- `comparison_sources` / `comparison_facts` / `comparison_scores` — normalized result data
- `ai_runs` / `ai_run_steps` — per-job AI call telemetry
- `usage_events` — raw usage event log

## Comparison Pipeline

The 8-step pipeline in `job-engine.ts`:

1. Parse query into entities + dimensions
2. Search Tavily for sources
3. Extract content via Firecrawl
4. Generate dimensions
5. Extract facts (with pgvector embeddings + SHA-256 dedup)
6. Score entities per dimension
7. Generate verdict
8. Build result JSON and finalize

Guardrails per job: $0.50 cost, 5 minutes, 12 searches, 6 AI calls.

## Rate Limits (Free Plan)

- 5 comparisons/day
- 10 follow-ups/day
- 3 refreshes/day
- 10 exports/day

Configurable via env vars. Returns 429 with `Retry-After` header when exceeded.

## Security

- CSP, HSTS, X-Frame-Options, etc. configured in `vercel.json`
- All authenticated routes use `requireAuth()`
- Rate limits on expensive endpoints
- Input validation via Zod
- SQL injection prevention via Drizzle ORM
- API keys never exposed to frontend

## Conventions

- Use TypeScript strictly; avoid `any`
- Prefer Drizzle ORM over raw SQL
- Use `apiFetch` + `buildApiUrl` for all API calls
- Use `toast` from sonner for user feedback
- Use `withRateLimit` for new expensive API routes
- Use `captureEvent` / `captureServerEvent` for analytics

## Retry Logic

Jobs automatically retry on failure (max 2 retries) with exponential backoff (1s, 2s). The `comparisons.retry_count` column tracks retries.

## Next Steps / Phase 7

- Paddle checkout integration
- Subscriptions table + customer portal
- Payment webhooks
- Pro plan features (unlimited comparisons, etc.)
