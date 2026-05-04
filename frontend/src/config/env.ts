const normalizeEnv = (value?: string) => value?.trim() ?? "";

const removeTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const apiBaseUrl = removeTrailingSlash(
  normalizeEnv(import.meta.env.VITE_API_BASE_URL),
);
const pexelsApiKey = normalizeEnv(import.meta.env.VITE_PEXELS_API_KEY);
const clerkPublishableKey = normalizeEnv(
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

export const envConfig = {
  apiBaseUrl,
  pexelsApiKey,
  clerkPublishableKey,
  hasApiBaseUrl: apiBaseUrl.length > 0,
  hasPexelsApiKey: pexelsApiKey.length > 0,
  hasClerkConfig: clerkPublishableKey.length > 0,
} as const;

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!envConfig.apiBaseUrl) {
    return normalizedPath;
  }

  return `${envConfig.apiBaseUrl}${normalizedPath}`;
};
