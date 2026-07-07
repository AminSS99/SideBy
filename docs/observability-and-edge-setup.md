# SideBy Observability and Edge Setup

This repo is wired for Sentry error tracking and Cloudflare Turnstile. The app
code is safe to run without these services locally; production should set the
variables below.

## Sentry

Required Vercel environment variables:

```bash
SENTRY_DSN=
VITE_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_RELEASE=
VITE_SENTRY_RELEASE=
```

Notes:

- `SENTRY_DSN` enables server-side Vercel Function capture.
- `VITE_SENTRY_DSN` enables browser capture.
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` enable production
  source map upload during `vite build`.
- `SENTRY_RELEASE` and `VITE_SENTRY_RELEASE` should match the deployed commit
  SHA or release name.

CLI checks:

```bash
sentry-cli login
sentry-cli info
sentry-cli projects list --org <org-slug>
```

## Cloudflare

Required Cloudflare products for the current integration:

- DNS for `sideby.ink`, once nameservers are moved to Cloudflare.
- Turnstile for public form bot protection.

Required Vercel environment variables:

```bash
VITE_CLOUDFLARE_TURNSTILE_SITE_KEY=
CLOUDFLARE_TURNSTILE_SECRET_KEY=
```

CLI checks:

```bash
wrangler login
wrangler whoami
```

DNS target for Vercel:

```text
A     @      216.198.79.1
CNAME www    <value shown by Vercel for www.sideby.ink>
```

Keep Google Search Console verification as a TXT record on `@`, not `www`.

## Current App Wiring

- Browser errors initialize in `src/lib/sentry.ts`.
- React render crashes are captured in `src/components/ErrorBoundary.tsx`.
- API fetch failures are captured in `src/lib/api.ts`.
- Vercel Function unhandled errors are captured in `api/[...path].ts`.
- Contact form Turnstile renders in `src/components/security/TurnstileWidget.tsx`.
- Turnstile server verification lives in `api/_lib/turnstile.ts`.
