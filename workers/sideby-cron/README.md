# SideBy Cloudflare Cron Worker (`sideby-cron-worker`)

Vercel Hobby restricts cron schedules in `vercel.json` to once per day (`0 0 * * *`). This lightweight Cloudflare Worker runs on the free tier and triggers SideBy's background job endpoints on a high-frequency schedule:

- **Every 2 minutes (`*/2 * * * *`)**: `POST https://sideby.ink/api/jobs/drain` — reclaims timed-out/orphaned comparison runs and drains queued comparisons.
- **Every hour (`0 * * * *`)**: `POST https://sideby.ink/api/watchlists-run` — executes due watchlist refreshes.

## Deploy

```bash
cd workers/sideby-cron

# 1. Authenticate Wrangler (once)
wrangler login

# 2. Store the same CRON_SECRET configured in Vercel
wrangler secret put CRON_SECRET

# 3. Deploy the Worker + Cron Triggers
wrangler deploy
```

## Endpoints

- `GET /health` — Returns `{ ok: true, worker: "sideby-cron-worker", secretConfigured: true }`
- `POST /trigger` (requires `Authorization: Bearer <CRON_SECRET>`) — Immediately invokes `/api/jobs/drain` (or `/api/watchlists-run` with `?job=watchlists`).
