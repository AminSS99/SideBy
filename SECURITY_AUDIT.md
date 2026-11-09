# SideBy security review (2026-11-08)

Source-first review of the API surface, auth, rate limiting, webhooks, uploads, and dependencies.
Scope: `frontend/api`. No live probing beyond the earlier read-only production checks.

## Fixed in this pass
| Area | Weakness | Fix |
|---|---|---|
| `POST /api/comparisons/validate` (unauthenticated) | Per-IP limit only; a distributed caller could drive unbounded Tavily + LLM spend | Global per-minute AI breaker (`VALIDATION_AI_GLOBAL_PER_MIN`, default 60). When open, rules-only answer, never cached |
| `GET /api/search` | Authenticated, paid embedding call per request, no limit | 20/min per user |
| `POST /api/knowledge/upload` | Blob storage + embeddings with no quota | Uses the existing `contextImport` daily quota |
| All write routes | Several mutation routes (prompts, team, api-keys, notes, matrices, settings) had no limiter | `requireAuth` now applies 60/min/user to POST/PUT/PATCH/DELETE (`MUTATION_BURST_PER_MINUTE`) |
| 5xx responses | Raw SQL, params, and user ids reached the browser toast | `sendJson` replaces internal-looking 5xx messages with a generic one; detail is logged |
| CSP | `unsafe-inline`/`unsafe-eval` in `script-src`, any-`https:`/`wss:` in `connect-src`, no `frame-ancestors` | Scripts limited to self + Clerk/Google/Cloudflare/PostHog; `script-src-attr 'none'`; `connect-src` allow-list; `frame-ancestors 'none'`; `upgrade-insecure-requests`. Verified in a signed-in production session with zero violations on 7 pages. `style-src` keeps `'unsafe-inline'` (React inline styles); `img-src` keeps `https:` (entity logos/favicons) |
| Live web search | Not built | `POST /api/web-search`: signed-in only, 2/day on the free plan (`FREE_WEB_SEARCHES_PER_DAY`), slot reserved before any provider call, 429 + Retry-After. Providers: Tavily, Exa, Parallel (needs `PARALLEL_API_KEY`), TinyFish |
| Workspace/project ids on comparison create | `POST /api/comparisons` and `/api/v1/comparisons` passed caller-supplied `workspaceId`/`projectId` without an access check (cross-tenant write into another org's workspace) | `createComparisonJob` now requires `canAccessWorkspace`/`canAccessProject`; foreign id returns 404 (verified on production). Also re-checks membership when an API key is used |
| `PATCH`/`DELETE /api/team` | Target membership looked up by id only, not scoped to the caller's org (could alter or delete another org's membership row) | Lookups, updates and deletes scoped by `organizationId` |
| Source/citation URLs | LLM citations and provider URLs reached `href` unfiltered (`javascript:` stored-XSS vector for public comparisons; CSP now also blocks it) | Server drops non-http(s) citations/results; client `safeHref()` on every dynamic link |
| Slack slash command | Ran jobs as the first user row in the DB; posted to any `response_url`; echoed raw error text | Requires `SLACK_JOB_OWNER_USER_ID`; `response_url` must be `hooks.slack.com`; generic error text. Not reachable today: `SLACK_SIGNING_SECRET` is unset in production |
| Push subscribe | Accepted any HTTPS endpoint; server later POSTs to it (blind SSRF-style) | Host allow-list: FCM, Mozilla, Apple, Windows push services only, no custom ports |
| Clerk token verification | `authorizedParties` not pinned | `CLERK_AUTHORIZED_PARTIES` (set to `https://sideby.ink,https://www.sideby.ink` in production, signed-in session verified) |
| Cron drain | `CRON_SECRET` unset in production, so orphan recovery always 404'd | Secret added; polling also sweeps stale jobs |

## Verified sound
- Ownership checks on every `:id` route (`canAccessComparison` / `canMutateComparison`, owner-scoped queries).
- CSRF double-submit + same-origin check on cookie sessions; bearer-only API clients exempt.
- API keys stored hashed, scoped, revocable. Test-auth bypass disabled in production.
- Webhook delivery: HTTPS only, DNS resolved and pinned, all non-public ranges blocked.
- Slack, Clerk (svix) signature verification; legacy Dodo webhook disabled (404).
- Secrets: no committed keys; only `.env.example` is tracked.

## Open risks (ordered)
1. **Hobby plan**: commercial-use terms, hard quotas, daily-only crons. Move to Pro before launch.
2. **Provider spend**: no hard cap in code beyond per-job $0.50. Set spend limits at DeepSeek, Tavily, Firecrawl, OpenAI.
3. **Counters live in Postgres** (no Redis in production). Burst traffic on counters competes with app queries on Neon.
4. **CSP** residual: `style-src 'unsafe-inline'` and `img-src https:`; no violation reporting endpoint yet.
5. **Dependencies**: 17 advisories (2 high, 13 moderate), all transitive via build/PWA tooling or `@vercel/blob`; none on a request path we found.
7. **`x-forwarded-for`** first hop is trusted for IP limits; correct on Vercel, wrong behind another proxy.
8. Missing production keys: PostHog, web push (VAPID).

## Not yet fixed / observed
- `DELETE /api/account` removes database rows only; the Clerk user remains and there is no recent-sign-in requirement.
- Invalid API-key attempts are not rate limited before the database lookup (keys are 256-bit, so this is load, not guessing risk).
- Coverage: single-pass source review of the API routes, auth, team, API keys, Slack, public read path and link rendering. No full multi-agent run, no dependency re-scan.
