import { serverEnv } from "./env.js";
import { isRuntimeStoreConfigured, getRuntimeStoreKind } from "./redis.js";

type CheckStatus = "ok" | "error" | "not_configured";

export type EnvCheck = {
  status: CheckStatus;
  missingRequired: string[];
  missingOptional: string[];
  warnings: string[];
};

function isProductionRuntime() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

function present(value: string | undefined | null) {
  return Boolean(value?.trim());
}

export function checkEnvironment(): EnvCheck {
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  const warnings: string[] = [];
  const production = isProductionRuntime();

  const requiredInProduction: Array<[string, boolean]> = [
    ["CLERK_SECRET_KEY", present(serverEnv.clerkSecretKey)],
    ["DATABASE_URL or POSTGRES_URL", present(serverEnv.databaseUrl)],
    ["Redis or Postgres runtime store", isRuntimeStoreConfigured()],
    ["DEEPSEEK_API_KEY or OPENROUTER_API_KEY", present(serverEnv.deepseekApiKey) || present(serverEnv.openrouterApiKey)],
    ["TAVILY_API_KEY or GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_CX", present(serverEnv.tavilyApiKey) || (present(serverEnv.googleSearchApiKey) && present(serverEnv.googleSearchCx))],
    ["OPENAI_API_KEY", present(serverEnv.openaiApiKey)],
  ];

  if (production) {
    for (const [name, ok] of requiredInProduction) {
      if (!ok) missingRequired.push(name);
    }
  }

  const optional: Array<[string, boolean]> = [
    ["PADDLE_API_KEY", present(serverEnv.paddleApiKey)],
    ["PADDLE_WEBHOOK_SECRET", present(serverEnv.paddleWebhookSecret)],
    ["SENTRY_DSN", present(serverEnv.sentryDsn)],
    ["POSTHOG_KEY or VITE_POSTHOG_KEY", present(serverEnv.posthogKey)],
    ["BLOB_READ_WRITE_TOKEN", present(serverEnv.blobReadWriteToken)],
  ];

  for (const [name, ok] of optional) {
    if (!ok) missingOptional.push(name);
  }

  const hasSnapSolveUrl = present(serverEnv.snapsolveCoreUrl);
  const hasSnapSolveSecret = present(serverEnv.snapsolveSidebySecret);
  if (hasSnapSolveUrl !== hasSnapSolveSecret) {
    const message = "SNAPSOLVE_CORE_URL and SNAPSOLVE_SIDEBY_SECRET must be configured together.";
    warnings.push(message);
    if (production) missingRequired.push(message);
  }

  const hasAnyPaddlePrice = Boolean(
    process.env.PADDLE_PRO_PRICE_ID ||
      process.env.PADDLE_TEAM_PRICE_ID ||
      process.env.PADDLE_ENTERPRISE_PRICE_ID,
  );
  if (present(serverEnv.paddleApiKey) && !hasAnyPaddlePrice) {
    warnings.push("PADDLE_API_KEY is set but no PADDLE_*_PRICE_ID values are configured.");
  }

  if (production && getRuntimeStoreKind() === "postgres") {
    warnings.push("Redis is not configured; using Postgres runtime fallback for locks, cache, and rate limits.");
  }

  return {
    status: missingRequired.length > 0 ? "error" : production ? "ok" : "not_configured",
    missingRequired,
    missingOptional,
    warnings,
  };
}
