# SideBy Master Implementation Plan

> Historical note: this document captures an earlier product-expansion direction and is no longer the source of truth for launch configuration. The current production stack is Clerk, Neon Postgres, Upstash Redis, Vercel Functions, Paddle for local SideBy billing, and SnapSolve Core for ecosystem workspace/entitlement resolution. Use `AGENTS.md`, `DEPLOYMENT_CHECKLIST.md`, and `frontend/.env.example` for current launch guidance.

## 1. Product Direction

### Product name
SideBy

### Operating company
SnapSolve Ink

### Canonical domain
https://snapsolve.ink

### Global brand rule
Every public and authenticated surface should include a clickable `Made by SnapSolve Ink` link that points to `https://snapsolve.ink`.

### Product position
The current repo is a stylish AI comparison app. The target product is a production SaaS platform that combines:

- AI comparison
- AI research
- AI generation
- AI chat
- saved workspaces
- team collaboration
- multi-provider model routing
- usage metering
- premium visual presentation

This is a product expansion and re-architecture, not a cosmetic reskin.

## 2. Current Repo Audit

### What exists now
- React + TypeScript + Vite frontend
- Tailwind + shadcn base
- Framer Motion-driven landing/comparison experience
- around 80 frontend component files
- Spring Boot backend with a small comparison controller
- Gemini and DeepSeek calls in a thin service layer
- some mock data and synthetic comparison generation

### What does not exist yet
- Supabase auth
- Supabase database integration
- team/workspace model
- billing and subscriptions
- durable AI run history
- file uploads and storage
- vector search / RAG
- admin tools
- analytics
- email flows
- real route system beyond root + 404
- production-safe secret handling
- Vercel-ready backend strategy
- GSAP and Three.js integration
- MiniMax integration
- Z.AI integration

### Immediate blockers
1. Secrets are stored in plaintext in `backend/src/main/resources/application.properties`.
2. The frontend compares against a hardcoded local backend URL.
3. Credits are mocked in client state.
4. The current backend is too thin to justify separate long-term Java infrastructure if Vercel is the target platform.
5. Branding is still `SideBy`.

## 3. Core Strategy

### Recommended architecture
- Frontend: Vercel-hosted React app
- Database/Auth/Storage/Realtime: Supabase
- AI orchestration: TypeScript serverless functions on Vercel or Supabase Edge Functions
- Background jobs: queue workers or scheduled jobs
- Analytics: PostHog
- Error tracking: Sentry
- Billing: Stripe
- Email: Resend

### Important architectural decision
The Spring Boot backend should be retired unless there is a strong Java-specific requirement. The current backend surface is small enough that migrating to TypeScript orchestration is cheaper than scaling split-stack complexity.

### Why this direction fits the repo
- The frontend is already TypeScript-first.
- Vercel is a natural fit for the frontend and serverless orchestration.
- Supabase removes the need to build auth and base CRUD infrastructure from scratch.
- The current Java backend is not large enough to justify carrying a second runtime for the long term.

## 4. Technical Principles

1. Security before scale.
2. Product shell before feature sprawl.
3. Auth, data model, and billing before enterprise claims.
4. Multi-provider AI must be observable and cost-aware.
5. Design quality must be systematic, not page-by-page improvisation.
6. Three.js should be identity-driven, not overused.
7. GSAP should support storytelling, not create friction.
8. Every premium UI element must still degrade cleanly on mobile and low-power devices.

## 5. Target Stack

### Frontend
- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui
- TanStack Query
- GSAP
- Framer Motion for smaller component transitions
- Three.js with React Three Fiber where useful
- React Hook Form
- Zod

### Backend / Platform
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Realtime
- pgvector
- Vercel Functions or Supabase Edge Functions
- Stripe
- Sentry
- PostHog
- Resend

### AI providers
- Gemini
- MiniMax
- Z.AI

## 6. Product Modules

### Public module
- landing
- pricing
- features
- integrations
- docs
- blog
- legal
- contact

### Auth module
- sign up
- sign in
- magic link
- reset password
- invite acceptance
- onboarding

### App module
- dashboard
- workspace home
- projects
- AI chat
- comparison studio
- research canvas
- knowledge base
- uploads
- prompts
- generations
- analytics
- settings

### Team module
- members
- roles
- invites
- usage
- shared projects
- comments
- activity

### Platform module
- provider routing
- model registry
- AI usage tracking
- billing
- audit log
- admin controls

## 7. Route Map

### Public routes
- `/`
- `/pricing`
- `/features`
- `/integrations`
- `/docs`
- `/docs/:slug`
- `/blog`
- `/blog/:slug`
- `/contact`
- `/about`
- `/customers`
- `/templates`
- `/compare/:slug`
- `/legal/privacy`
- `/legal/terms`
- `/legal/cookies`

### Auth routes
- `/auth/sign-in`
- `/auth/sign-up`
- `/auth/magic-link`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/verify`
- `/auth/invite/:token`
- `/onboarding`

### Authenticated app routes
- `/app`
- `/app/workspaces`
- `/app/workspaces/:workspaceId`
- `/app/projects`
- `/app/projects/:projectId`
- `/app/chat`
- `/app/compare`
- `/app/research`
- `/app/generate`
- `/app/uploads`
- `/app/knowledge`
- `/app/prompts`
- `/app/history`
- `/app/templates`
- `/app/analytics`
- `/app/settings/profile`
- `/app/settings/account`
- `/app/settings/billing`
- `/app/settings/providers`
- `/app/settings/api-keys`
- `/app/settings/notifications`
- `/app/settings/team`
- `/app/settings/security`

### Admin routes
- `/admin`
- `/admin/users`
- `/admin/workspaces`
- `/admin/providers`
- `/admin/costs`
- `/admin/flags`
- `/admin/audit`
- `/admin/incidents`

## 8. Data Model

### Core tables
- `users`
- `profiles`
- `organizations`
- `memberships`
- `workspaces`
- `workspace_members`
- `projects`
- `folders`
- `documents`
- `document_versions`
- `uploads`
- `upload_chunks`
- `knowledge_sources`
- `knowledge_chunks`
- `tags`
- `entity_tags`

### AI tables
- `providers`
- `models`
- `provider_credentials`
- `prompt_templates`
- `prompt_template_versions`
- `ai_runs`
- `ai_run_steps`
- `ai_run_outputs`
- `ai_run_sources`
- `ai_feedback`
- `model_routing_rules`
- `usage_events`
- `cost_snapshots`

### Product-specific tables
- `comparisons`
- `comparison_items`
- `comparison_scores`
- `comparison_exports`
- `saved_answers`
- `personas`
- `workflows`
- `workflow_runs`
- `automations`

### Collaboration tables
- `comments`
- `mentions`
- `notifications`
- `activity_events`
- `audit_logs`
- `shared_links`

### Commercial tables
- `subscriptions`
- `subscription_items`
- `billing_customers`
- `payment_events`
- `invoices`
- `coupon_redemptions`

## 9. AI Orchestration Layer

### Provider router responsibilities
- choose provider and model
- apply feature gating
- validate request shape
- inject system prompts and template context
- attach knowledge sources
- stream partial output
- record latency and cost
- retry or fail over when needed
- return structured output where possible

### Routing modes
- best-quality
- balanced
- fastest
- cheapest
- manual

### Capability flags per model
- text generation
- structured JSON output
- long context
- image input
- document analysis
- streaming
- tool calling
- low latency
- low cost

### Base fallback chain
1. Preferred model for task
2. Same provider secondary model
3. Alternative provider model of equivalent capability
4. Graceful degraded mode with explanation

### Core AI features
- compare two or more entities
- summarize documents
- summarize URLs
- generate action plans
- answer questions from uploaded files
- build side-by-side decision matrices
- create executive briefs
- create shareable reports
- generate titles and metadata
- maintain workspace memory

## 10. Provider-Specific Usage Plan

### Gemini
- multimodal analysis
- document intelligence
- image understanding
- complex reasoning

### MiniMax
- conversational workflows
- style-sensitive generation
- alternate routing lane for latency/cost balancing

### Z.AI
- third provider lane for redundancy
- routing diversity
- cost and availability hedge

### Mandatory telemetry for every AI run
- workspace id
- user id
- provider
- model
- task type
- token usage
- latency
- cost estimate
- cache status
- fallback path
- safety status

## 11. Security Plan

### Phase-zero requirements
- rotate exposed keys immediately
- remove secrets from tracked config
- move all secrets into environment variables
- add row-level security policies in Supabase
- enforce server-side authorization checks
- add request validation with Zod or equivalent
- add rate limiting
- add abuse detection
- add upload validation
- add audit logs for privileged actions

### Security features for launch
- session management
- MFA-ready account model
- secure invite tokens
- signed share links
- webhook signature validation
- CSP
- bot protection
- Sentry alerting

## 12. Billing and SaaS Model

### Plans
- Free
- Pro
- Team
- Business

### Metered dimensions
- AI runs
- model-specific credits
- storage
- seats
- knowledge indexing volume
- export limits

### Billing surfaces
- pricing page
- upgrade modal
- usage dashboard
- invoice history
- billing portal
- plan comparison cards

## 13. Design System Direction

### Visual identity
SnapSolve Ink should not look like a generic AI dashboard. The design language should feel editorial, high-contrast, premium, and slightly cinematic.

### Style rules
- dark ink base with selective light surfaces
- off-white content cards for contrast moments
- copper, cyan, and warm ivory accents
- restrained gradients
- custom typography pair with one display face and one readable UI face
- large visual hierarchy
- intentional negative space
- strong component edges with subtle glass only where hierarchy benefits

### Motion rules
- GSAP for page choreography, scrollytelling, sticky reveals, staged onboarding
- Framer Motion for small component state transitions
- Three.js only for hero identity scenes, premium empty states, and a few ambient backgrounds

## 14. UI Inventory

The target product should launch with at least 84 deliberate surfaces or modules.

1. Landing hero
2. Feature grid
3. Product story section
4. Integrations section
5. Comparison showcase
6. AI providers showcase
7. Pricing page
8. Docs home
9. Docs article
10. Blog index
11. Blog article
12. Contact page
13. About page
14. Legal privacy page
15. Legal terms page
16. Legal cookies page
17. Sign-in page
18. Sign-up page
19. Magic-link page
20. Forgot-password page
21. Reset-password page
22. Email verification page
23. Invite acceptance page
24. Onboarding welcome page
25. Onboarding workspace page
26. Onboarding role page
27. Onboarding provider setup page
28. App dashboard
29. Workspace home
30. Project list
31. Project detail
32. AI chat page
33. Comparison studio
34. Multi-item compare page
35. Research canvas
36. Generation studio
37. Prompt library
38. Prompt editor
39. Prompt version history
40. Upload manager
41. Document viewer
42. Knowledge base page
43. Knowledge source detail
44. Search results page
45. Saved answers page
46. Export modal
47. Public share page
48. Analytics dashboard
49. Usage dashboard
50. Billing page
51. Invoice page
52. Plan upgrade modal
53. Team members page
54. Invite members modal
55. Role management page
56. Activity timeline
57. Comments panel
58. Notifications center
59. Account profile page
60. Security settings page
61. Provider settings page
62. API key page
63. Webhook settings page
64. Brand settings page
65. Workspace settings page
66. Command palette
67. Global search overlay
68. Mobile navigation shell
69. Error state system
70. Empty state system
71. Skeleton state system
72. Toast system
73. Provider health dashboard
74. Cost inspector
75. AI run detail panel
76. Source citation panel
77. Consensus view
78. Disagreement view
79. Persona presets
80. Workflow builder
81. Workflow run history
82. Automation settings
83. Admin incident page
84. Admin audit page

## 15. Animation Plan

### GSAP usage
- landing hero entrance
- scroll-pinned product story
- pricing card reveal sequence
- onboarding scene transitions
- sticky feature narrative
- dashboard section reveals
- high-value report export celebration

### Three.js usage
- landing hero background scene
- provider constellation visualization
- AI run ambient state
- premium empty-state sculpture

### Performance rules
- no blocking on first meaningful paint
- disable heavy 3D on low-power devices
- respect reduced-motion preferences
- lazy-load all 3D bundles

## 16. Phase Plan

### Phase 0: Stabilize and secure
- rotate secrets
- clean env handling
- remove hardcoded local URLs
- add config strategy
- define product naming and brand assets

### Phase 1: Rebrand and app shell
- rename product to SnapSolve Ink
- build route map
- create public layouts and app layouts
- add navigation systems
- add design tokens and brand primitives

### Phase 2: Supabase foundation
- auth flows
- profile model
- workspace model
- protected routes
- storage buckets
- base RLS policies

### Phase 3: AI platform core
- provider registry
- model configs
- routing engine
- AI run persistence
- streaming output
- structured output helpers

### Phase 4: Core user value
- chat
- compare
- research
- uploads
- document summary
- source-linked answers

### Phase 5: SaaS monetization
- Stripe checkout
- tier gating
- usage dashboards
- invoice history
- upgrade prompts

### Phase 6: Collaboration
- workspaces
- team invites
- comments
- activity feeds
- public sharing

### Phase 7: Growth and trust
- docs
- blog
- testimonials
- SEO pages
- analytics
- legal polish

### Phase 8: Premium polish
- GSAP site choreography
- Three.js brand scenes
- advanced empty states
- micro-interaction cleanup
- responsive and accessibility tuning

### Phase 9: Launch hardening
- test coverage
- error monitoring
- analytics validation
- incident process
- production runbooks

## 17. Acceptance Criteria by Milestone

### MVP acceptance
- users can sign up and sign in
- users can create a workspace
- users can run AI compare/chat/research flows
- Gemini, MiniMax, and Z.AI are all integrated
- all runs are logged with provider and cost metadata
- billing gates are enforced
- shared result pages work
- production deployment is live on Vercel
- Supabase auth and DB are live

### Launch acceptance
- analytics and Sentry are working
- legal pages are complete
- emails are branded
- usage dashboards match billing logic
- mobile experience is strong
- reduced motion and accessibility are respected
- public marketing pages are SEO-ready

## 18. Repo-Level Implementation Map

### Frontend restructure target
- `frontend/src/app/`
- `frontend/src/routes/`
- `frontend/src/layouts/`
- `frontend/src/features/auth/`
- `frontend/src/features/workspaces/`
- `frontend/src/features/chat/`
- `frontend/src/features/compare/`
- `frontend/src/features/research/`
- `frontend/src/features/billing/`
- `frontend/src/features/settings/`
- `frontend/src/features/admin/`
- `frontend/src/components/brand/`
- `frontend/src/components/marketing/`
- `frontend/src/components/3d/`
- `frontend/src/lib/supabase/`
- `frontend/src/lib/api/`
- `frontend/src/lib/ai/`
- `frontend/src/lib/analytics/`
- `frontend/src/hooks/`
- `frontend/src/styles/`

### Backend/orchestration target
- `frontend/api/` if using Vercel Functions
- or `supabase/functions/` if using Edge Functions
- `supabase/migrations/`
- `supabase/seed/`
- `supabase/policies/`

### Legacy areas to retire or heavily rewrite
- current `backend/`
- current root-only route setup
- current mock credit flow
- current compare-only information architecture
- current brand assets and copy

## 19. Execution Order for This Repo

1. Secure secrets and clean configuration.
2. Rebrand the product to SnapSolve Ink.
3. Build the route shell and layouts.
4. Add Supabase auth and base schema.
5. Replace the current backend integration with serverless orchestration.
6. Implement provider routing for Gemini, MiniMax, and Z.AI.
7. Build compare, chat, research, and uploads as the first four core value loops.
8. Add billing and usage gating.
9. Add collaboration and sharing.
10. Add GSAP and Three.js premium polish.
11. Launch on Vercel with Supabase.

## 20. Recommended Immediate Next Tasks

1. Create a secure environment-variable strategy and remove plaintext secrets from tracked files.
2. Rebrand the visible app shell from SideBy to SnapSolve Ink.
3. Replace the single-route structure with public/auth/app route groups.
4. Add Supabase client setup and auth bootstrap.
5. Design the initial schema and migrations for users, workspaces, projects, ai_runs, subscriptions, and usage_events.
