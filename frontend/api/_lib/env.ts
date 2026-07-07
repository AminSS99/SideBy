/**
 * Server-side environment validation for SideBy API functions.
 * Every required provider is explicitly checked so missing config
 * produces clear errors instead of silent fallbacks or mock data.
 */

const getEnv = (key: string): string | undefined => process.env[key]?.trim() || undefined;

const required = (key: string): string => {
  const value = getEnv(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key: string): string | undefined => getEnv(key);

export const serverEnv = {
  // Neon Postgres
  databaseUrl: optional("DATABASE_URL") || optional("POSTGRES_URL") || optional("POSTGRES_PRISMA_URL"),

  // Clerk
  clerkSecretKey: optional("CLERK_SECRET_KEY"),
  clerkPublishableKey: optional("VITE_CLERK_PUBLISHABLE_KEY") || optional("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),

  // AI Providers
  deepseekApiKey: optional("DEEPSEEK_API_KEY"),
  openaiApiKey: optional("OPENAI_API_KEY"),
  anthropicApiKey: optional("ANTHROPIC_API_KEY"),
  geminiApiKey: optional("GEMINI_API_KEY"),
  openrouterApiKey: optional("OPENROUTER_API_KEY"),

  // Search / Extraction
  tavilyApiKey: optional("TAVILY_API_KEY"),
  googleSearchApiKey: optional("GOOGLE_SEARCH_API_KEY"),
  googleSearchCx: optional("GOOGLE_SEARCH_CX"),
  firecrawlApiKey: optional("FIRECRAWL_API_KEY"),
  firecrawlApiUrl: optional("FIRECRAWL_API_URL") || "https://api.firecrawl.dev/v2/scrape",

  // Redis
  redisUrl: optional("REDIS_URL") || optional("KV_URL"),
  redisToken: optional("REDIS_TOKEN") || optional("KV_REST_API_TOKEN"),

  // File storage / knowledge base
  blobReadWriteToken: optional("BLOB_READ_WRITE_TOKEN"),
  knowledgeMaxUploadBytes: Number(optional("KNOWLEDGE_MAX_UPLOAD_BYTES") || "26214400"),

  // Billing
  paddleApiKey: optional("PADDLE_API_KEY"),
  paddleWebhookSecret: optional("PADDLE_WEBHOOK_SECRET"),
  paddleEnvironment: optional("PADDLE_ENVIRONMENT") || "sandbox",

  // Email
  resendApiKey: optional("RESEND_API_KEY"),

  // Observability
  sentryDsn: optional("SENTRY_DSN"),
  sentryAuthToken: optional("SENTRY_AUTH_TOKEN"),
  sentryOrg: optional("SENTRY_ORG"),
  sentryProject: optional("SENTRY_PROJECT"),
  posthogKey: optional("NEXT_PUBLIC_POSTHOG_KEY") || optional("VITE_POSTHOG_KEY"),
  posthogHost: optional("NEXT_PUBLIC_POSTHOG_HOST") || optional("VITE_POSTHOG_HOST"),

  // Edge security
  turnstileSiteKey: optional("VITE_CLOUDFLARE_TURNSTILE_SITE_KEY"),
  turnstileSecretKey: optional("CLOUDFLARE_TURNSTILE_SECRET_KEY"),

  // SnapSolve ecosystem bridge
  snapsolveCoreUrl: optional("SNAPSOLVE_CORE_URL"),
  snapsolveSidebySecret: optional("SNAPSOLVE_SIDEBY_SECRET"),

  // App
  nodeEnv: optional("NODE_ENV") || "development",
  isVercel: optional("VERCEL") === "1",
} as const;

export function assertDatabaseConfigured(): void {
  if (!serverEnv.databaseUrl) {
    throw new Error("Database not configured. Set DATABASE_URL or POSTGRES_URL.");
  }
}

export function assertAiProviderConfigured(): void {
  const hasAi =
    serverEnv.deepseekApiKey ||
    serverEnv.openaiApiKey ||
    serverEnv.anthropicApiKey ||
    serverEnv.geminiApiKey ||
    serverEnv.openrouterApiKey;

  if (!hasAi) {
    throw new Error(
      "No AI provider configured. Set DEEPSEEK_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY.",
    );
  }
}

export function assertSearchConfigured(): void {
  const hasSearch =
    serverEnv.tavilyApiKey ||
    (serverEnv.googleSearchApiKey && serverEnv.googleSearchCx);

  if (!hasSearch) {
    throw new Error(
      "No search provider configured. Set TAVILY_API_KEY or GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_CX.",
    );
  }
}

export function assertRedisConfigured(): void {
  if (!serverEnv.redisUrl) {
    throw new Error("Redis not configured. Set REDIS_URL or KV_URL.");
  }
}

export function assertBillingConfigured(): void {
  if (!serverEnv.paddleApiKey) {
    throw new Error("Paddle not configured. Set PADDLE_API_KEY.");
  }
}
