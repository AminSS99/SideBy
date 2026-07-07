const normalizeEnv = (value?: string) => value?.trim() ?? "";

const removeTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const apiBaseUrl = removeTrailingSlash(
  normalizeEnv(import.meta.env.VITE_API_BASE_URL),
);
const pexelsApiKey = normalizeEnv(import.meta.env.VITE_PEXELS_API_KEY);
const turnstileSiteKey = normalizeEnv(import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY);
const rawClerkPublishableKey = normalizeEnv(
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

const decodeClerkPublishableKeyHost = (publishableKey: string) => {
  const keyPrefix = publishableKey.startsWith("pk_live_")
    ? "pk_live_"
    : publishableKey.startsWith("pk_test_")
      ? "pk_test_"
      : "";

  if (!keyPrefix) {
    return "";
  }

  try {
    const encodedHost = publishableKey.slice(keyPrefix.length);
    const decodedHost = globalThis
      .atob(encodedHost.replace(/-/g, "+").replace(/_/g, "/"))
      .replace(/\$$/, "");

    return decodedHost.trim();
  } catch {
    return "";
  }
};

const clerkPublishableKeyHost = decodeClerkPublishableKeyHost(rawClerkPublishableKey);
const isMalformedClerkKey =
  rawClerkPublishableKey.length > 0 &&
  (clerkPublishableKeyHost.length === 0 ||
    clerkPublishableKeyHost.startsWith(".") ||
    !clerkPublishableKeyHost.includes("."));
const isClerkTestKey = rawClerkPublishableKey.startsWith("pk_test_");
const isProductionBuild = import.meta.env.PROD;
const allowClerkTestKeyInProduction =
  normalizeEnv(import.meta.env.VITE_ALLOW_CLERK_TEST_KEY_IN_PRODUCTION) === "true";
const shouldBlockClerkTestKey =
  isProductionBuild && isClerkTestKey && !allowClerkTestKeyInProduction;
const clerkPublishableKey =
  shouldBlockClerkTestKey || isMalformedClerkKey ? "" : rawClerkPublishableKey;
const hasClerkConfig = clerkPublishableKey.length > 0;
const canUseTestAuth = !isProductionBuild;

export const envConfig = {
  apiBaseUrl,
  pexelsApiKey,
  turnstileSiteKey,
  clerkPublishableKey,
  isProductionBuild,
  hasApiBaseUrl: apiBaseUrl.length > 0,
  hasPexelsApiKey: pexelsApiKey.length > 0,
  hasTurnstileConfig: turnstileSiteKey.length > 0,
  hasClerkConfig,
  canUseTestAuth,
  allowClerkTestKeyInProduction,
  isClerkTestKeyBlocked: shouldBlockClerkTestKey,
  isClerkPublishableKeyMalformed: isMalformedClerkKey,
} as const;

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!envConfig.apiBaseUrl) {
    return normalizedPath;
  }

  return `${envConfig.apiBaseUrl}${normalizedPath}`;
};
