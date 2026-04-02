const normalizeEnv = (value?: string) => value?.trim() ?? "";

const removeTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const apiBaseUrl = removeTrailingSlash(
  normalizeEnv(import.meta.env.VITE_API_BASE_URL),
);
const supabaseUrl = removeTrailingSlash(
  normalizeEnv(import.meta.env.VITE_SUPABASE_URL),
);
const supabasePublishableKey = normalizeEnv(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);
const pexelsApiKey = normalizeEnv(import.meta.env.VITE_PEXELS_API_KEY);

export const envConfig = {
  apiBaseUrl,
  supabaseUrl,
  supabasePublishableKey,
  pexelsApiKey,
  hasApiBaseUrl: apiBaseUrl.length > 0,
  hasSupabaseConfig:
    supabaseUrl.length > 0 && supabasePublishableKey.length > 0,
  hasPexelsApiKey: pexelsApiKey.length > 0,
} as const;

export const buildApiUrl = (path: string) => {
  if (!envConfig.hasApiBaseUrl) {
    throw new Error("Missing VITE_API_BASE_URL.");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${envConfig.apiBaseUrl}${normalizedPath}`;
};
