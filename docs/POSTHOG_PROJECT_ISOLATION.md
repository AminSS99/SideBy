# PostHog project isolation

Each product has a dedicated EU PostHog project. Its website and application use the same project. Production hostnames are checked before SDK initialization; localhost, LAN addresses, and preview URLs cannot initialize production tracking. SideBy server capture also requires VERCEL_ENV=production.

Set the public SDK key and ingestion host in Production environment variables. Keys live in deployment configuration, never source code. A changed browser key requires a rebuild. Existing consent and masking rules remain in effect.

The former Default project (126824) retains mixed historical data; this change routes future events only. A&G Bildung remains on 356689. New projects: SideBy 359434; Orizonte 359435; Winoma 359436; SnapSolve Production 359437.

Validate after deploy using the live bundle's key and project event hostnames. Do not manufacture customer events to mark onboarding complete.
