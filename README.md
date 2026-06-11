<p align="center">
  <img src="assets/sideby.ico" alt="SideBy Logo" width="160"/>
</p>

<h1 align="center">SideBy</h1>

<p align="center">
  <strong>AI-Powered Research & Comparison Platform</strong><br/>
  Every claim cited. Every source verified.
</p>

<p align="center">
  <a href="https://sideby-kappa.vercel.app" target="_blank"><strong>Live Demo</strong></a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#deployment">Deployment</a> ·
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"/>
  <img src="https://img.shields.io/badge/TypeScript-5.5+-3178C6?logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-6+-646CFF?logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Postgres-Neon-4169E1?logo=postgresql&logoColor=white" alt="Postgres"/>
</p>

---

## What is SideBy?

SideBy is a production-grade, source-backed AI comparison platform. You enter a query like **"React vs Vue"** or **"Stripe vs Paddle for SaaS payments"**, and SideBy:

1. **Classifies** the query into a category (software, SaaS, AI tool, product, etc.)
2. **Searches** the web for authoritative sources
3. **Extracts** facts with citations
4. **Scores** each option across dimensions
5. **Generates** a verdict — every claim linked to its source

Unlike generic chatbots, SideBy doesn't hallucinate rankings. It researches, cites, and shows its work.

### Demo

<a href="https://sideby-kappa.vercel.app" target="_blank">
  <img src="assets/sideby.ico" alt="SideBy Screenshot" width="100%"/>
</a>

---

## Features

- **AI Comparison Pipeline** — 8-step research engine: parse → search → extract → generate dimensions → extract facts → score → verdict → build result
- **Source-Backed Results** — Every fact is tied to a real URL, not made up
- **Category-Aware Taxonomy** — Software, developer tools, AI tools, products, companies, places, education, careers, finance, health, methods, and technical standards each get custom dimensions and search rules
- **Vector Search Follow-ups** — Ask follow-up questions; SideBy searches its embedded fact database
- **Comparison Refresh** — Re-run research on the same query to get fresh data
- **Public & Private Sharing** — Share comparisons via public URLs or keep them private
- **Rate-Limited Free Tier** — Built-in usage caps with Redis-backed enforcement
- **Knowledge Base** — Upload documents and compare against your own content
- **Export** — Download comparisons as Markdown or JSON
- **Real-time Analytics** — PostHog + Sentry integration
- **Premium UI** — Tailwind CSS + shadcn/ui with Framer Motion animations

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vite 6, React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, GSAP |
| **Backend** | Vercel Serverless Functions (Node.js) |
| **Auth** | Clerk (users, orgs, memberships, webhooks) |
| **Database** | Neon Postgres with Drizzle ORM |
| **Cache / Queues** | Upstash Redis |
| **AI** | DeepSeek (primary), OpenRouter (fallback), Anthropic, Gemini |
| **Search** | Tavily, Google Custom Search |
| **Extraction** | Firecrawl |
| **Embeddings** | OpenAI `text-embedding-3-small` |
| **Analytics** | PostHog |
| **Error Tracking** | Sentry |
| **File Storage** | Vercel Blob |
| **Package Manager** | pnpm |

---

## Architecture

```
frontend/
├── src/
│   ├── pages/              # Route pages (marketing + app)
│   ├── components/         # UI components (shadcn + custom)
│   ├── contexts/           # React contexts (auth, workspace, projects)
│   ├── lib/                # Utilities (api, posthog, sentry)
│   └── db/
│       ├── schema.ts       # Drizzle schema (~20 tables)
│       └── index.ts        # Neon connection
├── api/                    # Vercel API routes
│   └── _lib/
│       ├── job-engine.ts   # 8-step comparison pipeline
│       ├── followup-engine.ts
│       ├── refresh-engine.ts
│       ├── export-engine.ts
│       ├── rate-limit.ts
│       ├── route-guard.ts
│       └── providers/      # AI adapters (deepseek, openrouter, anthropic, gemini)
└── vercel.json             # Security headers + rewrites
```

### Comparison Pipeline

```
User Query
    │
    ▼
[1] Parse → Extract entities, context, category
    │
    ▼
[2] Search → Tavily for each entity
    │
    ▼
[3] Extract → Firecrawl page content
    │
    ▼
[4] Generate Dimensions → Category-specific scoring axes
    │
    ▼
[5] Extract Facts → With pgvector embeddings + SHA-256 dedup
    │
    ▼
[6] Score → Per entity per dimension (0-100)
    │
    ▼
[7] Verdict → Overall winner with rationale
    │
    ▼
[8] Build Result JSON → Sources, facts, scores, verdict
```

**Guardrails per job:** $0.50 cost, 5 minutes, 12 searches, 6 AI calls.

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL 15+ (or a [Neon](https://neon.tech) account)
- Redis / [Upstash](https://upstash.com) (HTTP REST API required)
- [Clerk](https://clerk.dev) account
- AI API keys (at least one)

### 1. Clone & Install

```bash
git clone https://github.com/AminSS99/SideBy.git
cd SideBy/frontend
pnpm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in the required variables. See [frontend/.env.example](frontend/.env.example) for the full list.

**Minimum required:**

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgres://user:password@host/db?sslmode=require
REDIS_URL=https://your-db.upstash.io
REDIS_TOKEN=your-upstash-rest-api-token
DEEPSEEK_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
OPENAI_API_KEY=sk-...
```

### 3. Database Setup

```bash
# Generate and push schema
pnpm db:generate
pnpm db:push

# Or use the Neon migration script
pnpm db:neon:migrate
pnpm db:neon:check
```

### 4. Run Dev Server

```bash
# Frontend + Vercel API functions
pnpm dev

# For full Vercel serverless parity (recommended)
npx vercel dev
```

The app will be available at `http://localhost:5173`.

### 5. Build for Production

```bash
pnpm build
```

---

## Deployment

### Vercel (Recommended)

1. Fork this repository
2. Create a new project on [Vercel](https://vercel.com)
3. Link your fork
4. Set all environment variables from `.env.example`
5. Deploy

The `vercel.json` file already configures:
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- API route rewrites
- SPA fallback routing

### Docker

```bash
cd SideBy
cp .env.docker.example .env
# Fill in your keys
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

---

## Project Structure

```
SideBy/
├── frontend/
│   ├── src/
│   │   ├── pages/           # Marketing + app pages
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # Auth, workspace, projects
│   │   ├── lib/             # API client, analytics, taxonomy
│   │   └── db/
│   │       ├── schema.ts    # Drizzle ORM schema
│   │       └── index.ts     # Database connection
│   ├── api/                 # Vercel serverless functions
│   │   ├── _lib/            # Shared backend libraries
│   │   ├── comparisons/     # Comparison CRUD + actions
│   │   ├── webhooks/        # Clerk webhook handler
│   │   └── ...
│   ├── public/              # Static assets
│   ├── drizzle/             # Migration files
│   └── scripts/             # DB seed, smoke tests
├── backend/                 # Legacy Spring Boot (transitional)
├── neon/                    # Neon migration SQL
├── supabase/                # Supabase configs
├── assets/                  # Logos, screenshots
├── docker-compose.yml
└── vercel.json
```

---

## API Overview

### Comparison Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/comparisons` | Create a new comparison job |
| `GET` | `/api/comparisons` | List user's comparison history |
| `GET` | `/api/comparisons?action=taxonomy` | Get supported categories |
| `GET` | `/api/comparisons/[id]` | Get a comparison by ID |
| `POST` | `/api/comparisons/[id]/actions` | Follow-up questions |
| `POST` | `/api/comparisons/[id]/visibility` | Toggle public/private |
| `GET` | `/api/comparisons/by-slug/[slug]` | Public share link |

### Workspace & Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/workspace?resource=workspaces` | Manage workspaces |
| `GET/POST` | `/api/workspace?resource=projects` | Manage projects |

### Knowledge Base

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/knowledge?action=upload` | Upload a document |
| `GET` | `/api/knowledge?action=documents` | List documents |
| `GET` | `/api/knowledge?action=search` | Semantic search |
| `GET` | `/api/knowledge?action=document&id=` | Get a document |

### Auth & Usage

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/webhooks/clerk` | Clerk webhook sync |
| `GET` | `/api/usage` | Daily usage status |
| `GET` | `/api/health` | Health check |

All authenticated routes use `requireAuth()` middleware. Rate limits are enforced via `withRateLimit()`.

---

## Rate Limits (Free Tier)

| Feature | Limit |
|---------|-------|
| Comparisons | 5 / day |
| Follow-ups | 10 / day |
| Refreshes | 3 / day |
| Exports | 10 / day |

Configurable via environment variables. Returns `429` with `Retry-After` header when exceeded.

---

## Customization

### Adding a Comparison Category

Edit `frontend/src/lib/comparisonTaxonomy.ts`:

```typescript
export const COMPARISON_CATEGORIES = {
  my_category: {
    id: "my_category",
    label: "My Category",
    description: "...",
    examples: ["A vs B"],
    defaultDimensions: dims([
      ["Dimension 1", "Description", 1.0],
    ]),
    keywords: ["keyword"],
    entityHints: ["entity"],
    // ...
  },
};
```

### Changing AI Provider

Edit `frontend/api/_lib/providers/` and update the adapter in `ai-adapter.ts`.

### Custom Rate Limits

```env
FREE_COMPARISONS_PER_DAY=10
FREE_FOLLOWUPS_PER_DAY=20
```

---

## Database Schema

Key tables:

- `users` / `orgs` / `org_memberships` — synced from Clerk webhooks
- `workspaces` / `projects` — user-created containers
- `comparisons` — main research job (status, progress, result JSON)
- `comparison_entities` / `comparison_dimensions` / `comparison_sources` / `comparison_facts` / `comparison_scores` — normalized result data
- `ai_runs` / `ai_run_steps` — per-job AI call telemetry
- `usage_events` — raw usage event log
- `query_analytics` — rejected/accepted query analytics

See `frontend/src/db/schema.ts` for the full schema.

---

## Testing

```bash
# Type check
pnpm exec tsc --noEmit

# Lint
pnpm lint

# Smoke test (requires .env.local)
# pnpm tsx scripts/smoke-test.ts
```

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Quick contribution flow:

```bash
git checkout -b feature/your-feature-name
# Make changes
pnpm lint
pnpm build
git commit -m "feat: your feature"
git push origin feature/your-feature-name
# Open a Pull Request
```

---

## Roadmap

- [x] Core comparison pipeline
- [x] Source-backed research
- [x] Category taxonomy
- [x] Public/private sharing
- [x] Knowledge base
- [x] Rate limiting & usage tracking
- [ ] Paddle billing integration
- [ ] Pro plan features
- [ ] Multi-entity comparisons (3+)
- [ ] Team collaboration
- [ ] API for third-party integrations

See [SNAPSOLVE_MASTER_PLAN.md](./SNAPSOLVE_MASTER_PLAN.md) for the full roadmap.

---

## Security

- Content Security Policy (CSP) configured
- HSTS, X-Frame-Options, X-XSS-Protection headers
- Rate limiting on expensive endpoints
- Input validation via Zod
- SQL injection prevention via Drizzle ORM
- API keys never exposed to frontend
- Clerk webhook request signing

For responsible disclosure, see [SECURITY.md](./SECURITY.md).

---

## License

[MIT License](./LICENSE)

---

## Community & Support

- **Issues:** [GitHub Issues](https://github.com/AminSS99/SideBy/issues)
- **Discussions:** [GitHub Discussions](https://github.com/AminSS99/SideBy/discussions)
- **Website:** [https://snapsolve.ink](https://snapsolve.ink)
- **Live Demo:** [https://sideby-kappa.vercel.app](https://sideby-kappa.vercel.app)

---

<p align="center">
  <strong>Made with ❤️ by the SnapSolve team</strong><br/>
  <a href="https://snapsolve.ink">snapsolve.ink</a>
</p>
