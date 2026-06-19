# 🚀 SideBy — Production Deployment & Launch Checklist

This document details the exact configuration, environment variables, third-party integrations, and verification commands required to transition SideBy from local development to production on Vercel.

---

## 📦 1. Pre-Deployment Build & Lint Verification
Ensure the build outputs, types, and lints are 100% clean prior to deploying:
```bash
# 1. Install all dependencies
pnpm install

# 2. Run TypeScript compilation check
pnpm exec tsc --noEmit

# 3. Verify ESLint rules
pnpm lint

# 4. Verify dependency audit threshold
pnpm audit --audit-level high

# 5. Compile the optimized production bundles
pnpm run build
```

---

## 🔑 2. Environment Variables Configuration (Vercel)
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
* `PADDLE_API_KEY`: Paddle server API key for checkout and customer portal sessions.
* `PADDLE_WEBHOOK_SECRET`: Signature verification token for subscription sync (`/api/webhooks/paddle`).
* `PADDLE_ENVIRONMENT`: Set to `production` for live billing, `sandbox` for testing.
* `PADDLE_PRO_PRICE_ID`: Paddle price id for the Pro plan.
* `PADDLE_TEAM_PRICE_ID`: Paddle price id for the Team plan.
* `PADDLE_ENTERPRISE_PRICE_ID`: Paddle price id for enterprise checkout, if enabled.

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

## 💰 3. Paddle (Subscriptions) Live Migration Checklist
To transition billing from sandbox mode to live payments:
1. Log in to your **Paddle Merchant Dashboard** (production).
2. Set up the subscription price models and copy the **Product IDs** and **Price IDs**.
3. Set `PADDLE_PRO_PRICE_ID`, `PADDLE_TEAM_PRICE_ID`, and optionally `PADDLE_ENTERPRISE_PRICE_ID` in Vercel.
4. Add the live webhook endpoint URL in Paddle: `https://yourdomain.com/api/webhooks/paddle`.
5. Select the following event subscriptions in Paddle:
   * `subscription.created`
   * `subscription.updated`
   * `subscription.canceled`
6. Copy the newly generated **Webhook Secret Key** from Paddle and set it as `PADDLE_WEBHOOK_SECRET` in Vercel.
7. Change `PADDLE_ENVIRONMENT` to `production` in your Vercel project configuration.

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
* **Webhook Audits**: All `/api/webhooks/*` endpoints require header validation checks (Clerk/Paddle signature validation).
* **API Keys**: All API key validations use standard SHA-256 hash comparison. Never log raw API keys.

---

*Compiled by the SideBy Development Team. Last Updated: May 2026.*
