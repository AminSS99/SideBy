# SideBy Staging Deployment Guide

## Prerequisites

- Vercel account with CLI installed
- Clerk account (application created)
- Neon Postgres database
- Upstash Redis instance (or Vercel KV)
- API keys for: DeepSeek, Tavily, Firecrawl (optional), OpenAI (for embeddings)

## Step 1: Database Setup

1. Create a Neon Postgres project
2. Copy the **pooled connection string** from Neon dashboard (it ends with `?pgbouncer=true`)
3. The `pgvector` extension is auto-enabled on Neon, but if you encounter issues during migration, enable it manually in the Neon dashboard first.

## Step 2: Environment Variables

Set these in Vercel Project Settings → Environment Variables:

```
# Required
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgres://.../db?sslmode=require
REDIS_URL=https://...upstash.io
REDIS_TOKEN=... (Upstash REST API token)

# AI Providers (at least one LLM + OpenAI for embeddings)
DEEPSEEK_API_KEY=sk-...
OPENAI_API_KEY=sk-... (required for embeddings)

# Search / Extraction
TAVILY_API_KEY=tvly-...
FIRECRAWL_API_KEY=fc-... (optional but improves extraction quality)

# Clerk Webhook (see Step 6)
CLERK_WEBHOOK_SECRET=whsec_...

# Optional but recommended
VITE_SENTRY_DSN=...
SENTRY_DSN=...
VITE_POSTHOG_KEY=phc_...
POSTHOG_KEY=phc_...
```

### Important Notes

- **DATABASE_URL**: Use Neon's pooled connection string for serverless. The `@neondatabase/serverless` driver handles pooling internally.
- **REDIS_URL**: Must be an HTTP REST API URL (Upstash or Vercel KV). `redis://localhost:6379` will NOT work because SideBy uses `@upstash/redis`. For local development, create a free Upstash database or use Vercel KV.
- **OPENAI_API_KEY**: Required even if using DeepSeek as the primary LLM, because OpenAI `text-embedding-3-small` is used for fact embeddings.

## Step 3: Deploy to Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Link project (first time)
cd frontend
vercel --prod

# Or for staging preview
vercel
```

## Step 4: Database Migration

```bash
cd frontend
export DATABASE_URL="your-neon-url"
pnpm db:push
```

If `db:push` fails with an error about the `vector` extension:
1. Go to Neon Dashboard → SQL Editor
2. Run: `CREATE EXTENSION IF NOT EXISTS vector;`
3. Re-run `pnpm db:push`

## Step 5: Seed Example Comparisons

```bash
cd frontend
export DATABASE_URL="your-neon-url"
pnpm db:seed
```

This creates two public demo comparisons (React vs Vue, Supabase vs Firebase) that appear on the landing page.

## Step 6: Configure Clerk Webhook

1. In Clerk Dashboard → Webhooks, add endpoint:
   `https://your-domain.vercel.app/api/webhooks/clerk`
2. Enable events:
   - `user.created`, `user.updated`, `user.deleted`
   - `organization.created`, `organization.updated`, `organization.deleted`
   - `organizationMembership.created`, `organizationMembership.updated`, `organizationMembership.deleted`
3. Copy the **Signing Secret** and set `CLERK_WEBHOOK_SECRET` in Vercel env vars
4. **The webhook uses Svix signature verification** — unauthenticated requests will be rejected with 400.

## Step 7: Smoke Test

Run the automated smoke test script:

```bash
cd frontend
export BASE_URL="https://your-domain.vercel.app"
npx tsx scripts/smoke-test.ts
```

Or manually test these flows:

### Public Endpoints
- [ ] `GET /api/health` returns 200 with DB and Redis checks
- [ ] `GET /compare/react-vs-vue-2024` shows public comparison (after seeding)

### Authentication
- [ ] Sign up via Clerk UI
- [ ] Webhook creates user in database (check Neon)
- [ ] Sign in works

### Core Workflow
- [ ] Create workspace
- [ ] Create project
- [ ] Run comparison: "React vs Vue"
- [ ] View comparison detail (shows progress → completed)
- [ ] Ask follow-up question
- [ ] Export as Markdown
- [ ] Refresh comparison
- [ ] Publish comparison
- [ ] View public compare page

### Rate Limits
- [ ] Hit comparison limit (5/day on free plan)
- [ ] Verify 429 response with `X-RateLimit-*` headers
- [ ] Check that Redis warning does NOT appear in logs (if configured correctly)

## Security Checklist

- [ ] `vercel.json` includes CSP, HSTS, X-Frame-Options headers
- [ ] CSP allows Clerk (`*.clerk.accounts.dev`), PostHog (`*.posthog.com`), and future Paddle (`*.paddle.com`, `cdn.paddle.com`)
- [ ] Clerk webhook verifies Svix signatures (not just payload structure)
- [ ] API keys are NOT exposed to frontend (only `VITE_*` vars are)

## Rollback

If issues occur:

```bash
# Rollback to previous Vercel deployment
vercel rollback
```

## Monitoring

- Check Vercel Functions logs for errors
- Check Sentry for exceptions
- Check PostHog for usage analytics
- Monitor Neon database connections

## Troubleshooting

### "Database not configured"
- Verify `DATABASE_URL` is set in Vercel environment variables
- Ensure the URL includes `sslmode=require`
- Use the pooled connection string from Neon

### "No AI provider configured"
- Verify at least one AI key is set (DEEPSEEK_API_KEY recommended)
- Verify OPENAI_API_KEY is set (required for embeddings)

### Rate limits not working
- Verify `REDIS_URL` is an HTTP URL (not `redis://`)
- Verify `REDIS_TOKEN` is the Upstash REST API token
- Check health endpoint (`/api/health`) for Redis status
- If Redis is not configured, logs will show: "Redis not configured. Rate limits are DISABLED."

### Comparisons stuck at "running"
- Check Vercel Functions logs for job-engine errors
- Verify DeepSeek API key is valid
- Check Tavily API key for search step
- Firecrawl being missing is fine — jobs continue without it

### Webhook returning 400
- Verify `CLERK_WEBHOOK_SECRET` matches the Signing Secret from Clerk Dashboard
- Ensure the webhook URL in Clerk Dashboard matches your deployed domain exactly
- Check that Svix headers are being forwarded (they should be automatically)

### pgvector extension errors
- Enable manually in Neon SQL Editor: `CREATE EXTENSION IF NOT EXISTS vector;`
- Re-run `pnpm db:push`
