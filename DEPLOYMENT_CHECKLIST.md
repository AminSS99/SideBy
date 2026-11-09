# 🚀 SideBy — Production Deployment & Launch Checklist

This document details the exact configuration, environment variables, third-party integrations, and verification commands required to transition SideBy from local development to production on Vercel.

---

## 📦 1. Pre-Deployment Build & Lint Verification
Ensure the build outputs, types, and lints are 100% clean prior to deploying (enter `frontend/` once):
```bash
# Enter the application workspace directory
cd frontend

# 1. Install all dependencies
pnpm install

# 2. Run TypeScript compilation check (covers both Vite web app and api/ serverless functions)
pnpm run typecheck

# 3. Verify ESLint rules
pnpm lint

# 4. Run targeted unit test suites (once testing is authorized)
pnpm test

# 5. Compile the optimized production bundles
pnpm run build
```

---

## 🗄️ 2. Database Migration 020 (Required & Unapplied — Strict Ordering)

> **CRITICAL DEPLOYMENT ORDERING**: Migration **020** must be applied to Neon Postgres **BEFORE** deploying the new application code.

- **Migration File**: `neon/migrations/020_comparison_publication_scope.sql`
- **Schema Columns**:
  - `input_scope text NOT NULL DEFAULT 'unknown'`
  - `public_snapshot_source_id uuid`
  - Index `comparisons_public_scope_idx` on `(input_scope, visibility) WHERE input_scope = 'public'`
- **Failure Risk if Inverted**: The backend code in `sideby.ts`, `loadPublishEvidence()`, and `comparisons` insert selects and writes `input_scope`. If application code is deployed before migration 020 is executed, all comparison reads, status checks, and snapshot jobs will fail with PostgreSQL `column "input_scope" does not exist`.
- **Execution Command** (from `frontend/` directory):
  ```bash
  DATABASE_URL_UNPOOLED="<direct-neon-connection-url>" pnpm run db:neon:migrate
  ```

---

## 🔑 3. Environment Variables Configuration (Vercel)
Add the following keys to your project in the Vercel Dashboard under **Project Settings > Environment Variables**:

### Frontend & Core Authentication
* `VITE_CLERK_PUBLISHABLE_KEY`: Clerk Publishable Key (production instance).
* `VITE_APP_URL`: Canonical production app URL for redirects and generated links.
* `CLERK_SECRET_KEY`: Clerk Secret API Key.
* `CLERK_WEBHOOK_SECRET`: Signature verification key for Clerk webhook sync (`/api/webhooks/clerk`).

### Database & Caching
* `DATABASE_URL`: Neon PostgreSQL Connection string (pooled).
* `DATABASE_URL_UNPOOLED`: Neon PostgreSQL Connection string (direct/unpooled for migrations).
* `REDIS_URL`: Upstash Redis REST URL (`https://...`) for job concurrency locks, execution state, and rate limits.
* `REDIS_TOKEN`: Upstash Redis REST API token.

### Search & Scraping Web APIs
* `TAVILY_API_KEY`: Tavily Search Engine API key (for target-entity search & fact extraction).
* `FIRECRAWL_API_KEY`: Firecrawl scraper key (for web document retrieval).

### Artificial Intelligence & LLM Providers
* `DEEPSEEK_API_KEY`: DeepSeek API key (primary research, categorization, and verdict generator).
* `OPENROUTER_API_KEY`: OpenRouter API key (fallback provider for DeepSeek queries).
* `OPENAI_API_KEY`: OpenAI API key (for generating `text-embedding-3-small` vector spaces).

### Billing & Subscription Infrastructure
The intended subscription authority is SnapSolve Core, with Dodo Payments configured there. SideBy checkout and portal actions redirect to Cockpit. A legacy SideBy Dodo webhook and related local subscription fallback still exist in code; disable the old webhook delivery and retire that fallback before claiming the bridge is the sole authority. Do not configure new payment credentials in SideBy.

### SnapSolve Ecosystem Bridge
* `SNAPSOLVE_CORE_URL`: SnapSolve Core base URL for workspace and entitlement resolution.
* `SNAPSOLVE_SIDEBY_SECRET`: Product HMAC secret registered with SnapSolve Core.

### Scheduled Jobs
* `CRON_SECRET`: Bearer token required for `/api/jobs/drain` and watchlist cron endpoints.

### Slack Bot Integration
* `SLACK_SIGNING_SECRET`: HMAC-SHA256 signature verification key for verifying requests to `/api/integrations/slack/events`.
* `SLACK_BOT_TOKEN`: Slack OAuth access token (`xoxb-...`) for posting Slack Block-Kit notifications.

### Global & Analytics Settings
* `VITE_POSTHOG_KEY`: PostHog public key.
* `VITE_POSTHOG_HOST`: PostHog host URL (`https://us.i.posthog.com`).
* `SENTRY_AUTH_TOKEN`: Auth token for uploading sourcemaps during Vercel builds.

---

## 💰 3. Shared Dodo billing verification
1. Configure Dodo product IDs, API key, and verified webhook **only in SnapSolve Core**. Check SnapSolve's billing runbook for the current variable names and plan matrix.
2. Verify a Flow account can use SideBy without checkout and that a paid SideBy action is denied without the matching signed SnapSolve entitlement.
3. Complete a test checkout from SideBy through Cockpit; confirm a single SnapSolve subscription and that SideBy receives the updated workspace entitlement.
4. Test change, cancellation, payment failure, duplicate webhook, and revoked product access. SideBy must follow the central state within its documented cache window; no local billing record can grant access.
5. Verify the billing portal link returns to Cockpit and pricing copy matches the actual enabled plan.

---

## 🗺️ 4. SEO & Verification Integrations
1. **XML Sitemap**: The sitemap is automatically generated at `https://yourdomain.com/sitemap.xml` via Vercel rewrites leading to `/api/seo/sitemap`. Ensure this URL is registered in Google Search Console.
2. **Metadata Injection**: Dynamic SEO values are loaded on client views by `Compare.tsx` (using fallback options for crawler parsing).
3. **Robots.txt**: Verify that `public/robots.txt` points to the XML sitemap:
   ```txt
   User-agent: *
   Allow: /
   Sitemap: https://yourdomain.com/sitemap.xml
   ```

---

## 🔒 5. Production Security Verification
Verify the following parameters before final launch:
* **SSL/TLS**: HTTPS is enforced globally via HSTS settings inside `vercel.json`.
* **CORS Policy**: CORS headers are configured for public-facing assets like `sideby-widget.js`.
* **Rate Limits**: IP-based rate limiting is enabled for the `/api/v1` routes and AI job creation routes.
* **Webhook Audits**: SideBy-owned webhook endpoints validate their signatures. Confirm Dodo lifecycle webhooks terminate only at SnapSolve Core and remove the legacy SideBy webhook subscription.
* **API Keys**: All API key validations use standard SHA-256 hash comparison. Never log raw API keys.

---

*Compiled by the SideBy Development Team. Last Updated: May 2026.*
