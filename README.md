<p align="center">
  <img src="assets/logo.jpg" alt="SideBy Logo" width="200"/>
</p>

<h1 align="center">SideBy</h1>

<p align="center">
  <strong>Research Faster. Compare Smarter.</strong>
</p>

---

## What is SideBy?

SideBy is an AI-powered research and comparison platform operated by SnapSolve Ink. It helps users analyze options, synthesize web signals, and make clearer decisions.

The current repository is transitioning from a single comparison experience into a broader SaaS product built around:

- AI comparison
- AI research
- AI generation
- workspaces
- multi-provider model routing
- premium UI and motion

## Current Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Spring Boot Java service in transition |
| Target Platform | Supabase, Vercel, Stripe |
| AI Providers | Gemini, MiniMax, Z.AI |

## Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
# Run with your preferred Maven setup
```

## Docker

1. Copy `.env.docker.example` to `.env`
2. Fill in your Supabase and AI provider keys
3. Start everything:

```bash
docker compose up --build
```

The app will be available at:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

Notes:

- The frontend container serves the built app with Nginx.
- Nginx proxies `/api/*` to the backend container, so the default Docker frontend API base URL is `http://localhost:5173`.
- Supabase remains your external hosted dependency; it is not containerized here.

## Environment

Frontend expects:

- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_PEXELS_API_KEY` (optional)

Backend expects:

- `GEMINI_API_KEY`
- `GEMINI_API_URL` (optional override)
- `DEEPSEEK_API_KEY`
- `SERVER_PORT` (optional)

## Product Direction

The product roadmap for the full SideBy SaaS is documented in:

- [SNAPSOLVE_MASTER_PLAN.md](./SNAPSOLVE_MASTER_PLAN.md)

## Domain

- https://snapsolve.ink

---

<p align="center">
  <a href="https://snapsolve.ink"><strong>Made by SnapSolve Ink</strong></a>
</p>
